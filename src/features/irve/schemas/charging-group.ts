import { z } from "zod";
import type { LatLng } from "@/features/route/model/route";
import type { ChargingStation, PlugType } from "../model/charging-station";

const nullableText = z.string().nullable();

// Une ligne de l'API = les points de charge d'une même station qui partagent
// les mêmes caractéristiques (regroupement côté API).
export const chargingGroupSchema = z.object({
  id_station_itinerance: z.string(),
  nom_station: nullableText,
  nom_enseigne: nullableText,
  nom_operateur: nullableText,
  adresse_station: nullableText,
  condition_acces: nullableText,
  horaires: nullableText,
  gratuit: nullableText,
  prise_type_2: nullableText,
  prise_type_combo_ccs: nullableText,
  prise_type_chademo: nullableText,
  prise_type_ef: nullableText,
  pdc: z.number(),
  max_kw: z.number().nullable(),
  lat: z.number(),
  lon: z.number(),
  maj: nullableText,
});

export type ChargingGroup = z.infer<typeof chargingGroupSchema>;

const GROUP_FIELDS = [
  "id_station_itinerance",
  "nom_station",
  "nom_enseigne",
  "nom_operateur",
  "adresse_station",
  "condition_acces",
  "horaires",
  "gratuit",
  "prise_type_2",
  "prise_type_combo_ccs",
  "prise_type_chademo",
  "prise_type_ef",
] as const;

export const CHARGING_GROUP_BY = GROUP_FIELDS.join(",");

export const CHARGING_SELECT = [
  ...GROUP_FIELDS,
  "count(*) as pdc",
  "max(puissance_nominale) as max_kw",
  "avg(consolidated_latitude) as lat",
  "avg(consolidated_longitude) as lon",
  "max(date_maj) as maj",
].join(",");

// Les booléens arrivent en texte, avec une casse variable (« True », « TRUE »…).
const isTrue = (value: string | null): boolean =>
  value?.trim().toLowerCase() === "true";

const readPlugs = (group: ChargingGroup): PlugType[] => {
  const plugs: PlugType[] = [];
  if (isTrue(group.prise_type_2)) plugs.push("type2");
  if (isTrue(group.prise_type_combo_ccs)) plugs.push("ccs");
  if (isTrue(group.prise_type_chademo)) plugs.push("chademo");
  if (isTrue(group.prise_type_ef)) plugs.push("domestic");
  return plugs;
};

const PLUG_ORDER: readonly PlugType[] = ["ccs", "type2", "chademo", "domestic"];

const pickText = (...candidates: (string | null)[]): string | null =>
  candidates.find((text) => text !== null && text.trim() !== "")?.trim() ??
  null;

const toPosition = (group: ChargingGroup): LatLng => ({
  lat: group.lat,
  lng: group.lon,
});

// Fusionne les groupes d'une même station en une seule fiche.
export const mergeChargingGroups = (
  groups: readonly ChargingGroup[],
): ChargingStation[] => {
  const byStation = new Map<string, ChargingGroup[]>();
  for (const group of groups) {
    const existing = byStation.get(group.id_station_itinerance);
    if (existing === undefined) {
      byStation.set(group.id_station_itinerance, [group]);
    } else {
      existing.push(group);
    }
  }

  return [...byStation.entries()].flatMap(([id, stationGroups]) => {
    const [first] = stationGroups;
    if (first === undefined) {
      return [];
    }

    const powers = stationGroups.flatMap(({ max_kw }) =>
      max_kw === null ? [] : [max_kw],
    );
    const plugs = new Set(stationGroups.flatMap(readPlugs));
    const updatedAt = stationGroups
      .map(({ maj }) => maj)
      .reduce<string | null>(
        (latest, current) =>
          current !== null && (latest === null || current > latest)
            ? current
            : latest,
        null,
      );

    return [
      {
        id,
        name:
          pickText(...stationGroups.map(({ nom_station }) => nom_station)) ??
          "Station de recharge",
        operator:
          pickText(
            ...stationGroups.map(({ nom_enseigne }) => nom_enseigne),
            ...stationGroups.map(({ nom_operateur }) => nom_operateur),
          ) ?? "Opérateur inconnu",
        address:
          pickText(
            ...stationGroups.map(({ adresse_station }) => adresse_station),
          ) ?? "Adresse inconnue",
        position: toPosition(first),
        pointCount: stationGroups.reduce((total, { pdc }) => total + pdc, 0),
        maxPowerKw: powers.length === 0 ? null : Math.max(...powers),
        plugs: PLUG_ORDER.filter((plug) => plugs.has(plug)),
        isFree: stationGroups.some(({ gratuit }) => isTrue(gratuit)),
        access: pickText(
          ...stationGroups.map(({ condition_acces }) => condition_acces),
        ),
        hours: pickText(...stationGroups.map(({ horaires }) => horaires)),
        updatedAt,
      },
    ];
  });
};

export type ParsedChargingStations = {
  stations: ChargingStation[];
  rejectedCount: number;
};

// Chaque groupe est validé séparément : une ligne mal formée est écartée sans
// empêcher l'affichage des autres.
export const parseChargingGroups = (
  rawGroups: readonly unknown[],
): ParsedChargingStations => {
  const groups: ChargingGroup[] = [];
  let rejectedCount = 0;

  for (const rawGroup of rawGroups) {
    const parsed = chargingGroupSchema.safeParse(rawGroup);
    if (parsed.success) {
      groups.push(parsed.data);
    } else {
      rejectedCount += 1;
    }
  }

  return { stations: mergeChargingGroups(groups), rejectedCount };
};
