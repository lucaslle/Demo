import { z } from "zod";
import { fetchJson } from "@/shared/api/http-client";
import { recordsResponseSchema } from "@/shared/api/records-response";
import {
  parseKwhPrice,
  weightedMedian,
  type WeightedPrice,
} from "../model/tariff";
import { IRVE_RECORDS_URL } from "./endpoints";

const tariffGroupSchema = z.object({
  tarification: z.string().nullable(),
  n: z.number(),
});

const MAX_TARIFF_GROUPS = 100;
const STATION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const buildTariffUrl = (where: string, limit: number): string => {
  const params = new URLSearchParams({
    select: "tarification,count(*) as n",
    where: `tarification is not null and tarification != '' and ${where}`,
    group_by: "tarification",
    order_by: "n desc",
    limit: String(limit),
  });
  return `${IRVE_RECORDS_URL}?${params.toString()}`;
};

const fetchTariffGroups = async (
  where: string,
  limit: number,
  signal?: AbortSignal,
) => {
  const response = await fetchJson(
    buildTariffUrl(where, limit),
    recordsResponseSchema,
    { signal },
  );
  return response.results.flatMap((rawGroup) => {
    const parsed = tariffGroupSchema.safeParse(rawGroup);
    return parsed.success && parsed.data.tarification !== null
      ? [{ text: parsed.data.tarification, count: parsed.data.n }]
      : [];
  });
};

export type StationTariff = {
  text: string;
  pricePerKwh: number | null;
};

// Tarifs affichés par l'opérateur pour une station (chargés à la demande, au
// moment où l'utilisateur la choisit).
export const fetchStationTariffs = async (
  stationId: string,
  signal?: AbortSignal,
): Promise<StationTariff[]> => {
  if (!STATION_ID_PATTERN.test(stationId)) {
    return [];
  }
  const groups = await fetchTariffGroups(
    `id_station_itinerance = "${stationId}"`,
    10,
    signal,
  );
  return groups.map(({ text }) => ({
    text,
    pricePerKwh: parseKwhPrice(text),
  }));
};

export type ObservedTariff = {
  medianPerKwh: number;
  sampleSize: number;
};

export type ObservedTariffs = {
  normal: ObservedTariff | null;
  fast: ObservedTariff | null;
};

const summarizeTariffs = (
  groups: readonly { text: string; count: number }[],
): ObservedTariff | null => {
  const prices = groups.flatMap(({ text, count }): WeightedPrice[] => {
    const value = parseKwhPrice(text);
    return value === null ? [] : [{ value, weight: count }];
  });
  const median = weightedMedian(prices);
  return median === null
    ? null
    : {
        medianPerKwh: median,
        sampleSize: prices.reduce((total, { weight }) => total + weight, 0),
      };
};

// Tarif médian affiché dans les données ouvertes, par type de borne : seuls les
// textes dont on sait lire le prix au kWh sont retenus, pondérés par le nombre
// de points de charge concernés.
export const fetchObservedTariffs = async (
  signal?: AbortSignal,
): Promise<ObservedTariffs> => {
  const [normalGroups, fastGroups] = await Promise.all([
    fetchTariffGroups(
      "puissance_nominale > 0 and puissance_nominale <= 22",
      MAX_TARIFF_GROUPS,
      signal,
    ),
    fetchTariffGroups("puissance_nominale >= 50", MAX_TARIFF_GROUPS, signal),
  ]);

  return {
    normal: summarizeTariffs(normalGroups),
    fast: summarizeTariffs(fastGroups),
  };
};
