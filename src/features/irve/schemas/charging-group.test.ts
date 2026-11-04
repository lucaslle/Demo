import { describe, expect, it } from "vitest";
import { parseChargingGroups } from "./charging-group";

const buildGroup = (overrides: Record<string, unknown> = {}) => ({
  id_station_itinerance: "FRELCPCOUHI",
  nom_station: "Courbevoie - Hôtel Ibis Budget",
  nom_enseigne: "ELECTRA",
  nom_operateur: "ELECTRA",
  adresse_station: "37 quai Paul Doumer 92400 Courbevoie",
  condition_acces: "Accès libre",
  horaires: "24/7",
  gratuit: "false",
  prise_type_2: "false",
  prise_type_combo_ccs: "true",
  prise_type_chademo: "false",
  prise_type_ef: "false",
  pdc: 4,
  max_kw: 400,
  lat: 48.895257,
  lon: 2.261755,
  maj: "2026-10-30T00:00:00+00:00",
  ...overrides,
});

describe("parseChargingGroups", () => {
  it("transforme un groupe en station avec ses prises", () => {
    const { stations } = parseChargingGroups([buildGroup()]);

    expect(stations).toEqual([
      {
        id: "FRELCPCOUHI",
        name: "Courbevoie - Hôtel Ibis Budget",
        operator: "ELECTRA",
        address: "37 quai Paul Doumer 92400 Courbevoie",
        position: { lat: 48.895257, lng: 2.261755 },
        pointCount: 4,
        maxPowerKw: 400,
        plugs: ["ccs"],
        isFree: false,
        access: "Accès libre",
        hours: "24/7",
        updatedAt: "2026-10-30T00:00:00+00:00",
      },
    ]);
  });

  it("normalise les booléens à casse variable", () => {
    const { stations } = parseChargingGroups([
      buildGroup({
        prise_type_2: "TRUE",
        prise_type_combo_ccs: "True",
        prise_type_chademo: "FALSE",
        gratuit: "TRUE",
      }),
    ]);

    expect(stations[0]?.plugs).toEqual(["ccs", "type2"]);
    expect(stations[0]?.isFree).toBe(true);
  });

  it("fusionne les groupes d'une même station : points additionnés, puissance maximale, prises cumulées", () => {
    const { stations } = parseChargingGroups([
      buildGroup({
        pdc: 2,
        max_kw: 22,
        prise_type_combo_ccs: "false",
        prise_type_2: "true",
      }),
      buildGroup({
        pdc: 4,
        max_kw: 150,
        prise_type_combo_ccs: "true",
        prise_type_2: "false",
      }),
    ]);

    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({
      pointCount: 6,
      maxPowerKw: 150,
      plugs: ["ccs", "type2"],
    });
  });

  it("remplace les libellés absents par des valeurs explicites", () => {
    const { stations } = parseChargingGroups([
      buildGroup({
        nom_station: null,
        nom_enseigne: null,
        nom_operateur: null,
        adresse_station: null,
        max_kw: null,
        gratuit: null,
      }),
    ]);

    expect(stations[0]).toMatchObject({
      name: "Station de recharge",
      operator: "Opérateur inconnu",
      address: "Adresse inconnue",
      maxPowerKw: null,
      isFree: false,
    });
  });

  it("écarte les groupes invalides sans bloquer les autres", () => {
    const { stations, rejectedCount } = parseChargingGroups([
      buildGroup({ id_station_itinerance: "A" }),
      buildGroup({ id_station_itinerance: "B", lat: "48,8" }),
      { n: "importe quoi" },
    ]);

    expect(stations.map(({ id }) => id)).toEqual(["A"]);
    expect(rejectedCount).toBe(2);
  });
});
