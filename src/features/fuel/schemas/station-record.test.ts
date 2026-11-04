import { describe, expect, it } from "vitest";
import { parseStationRecords, STATION_SELECT_FIELDS } from "./station-record";

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 75010003,
  geom: { lon: 2.37, lat: 48.879 },
  adresse: "2/6 RUE LOUIS BLANC",
  ville: "Paris",
  cp: "75010",
  gazole_prix: 2.275,
  gazole_maj: "2026-11-04T07:31:00+00:00",
  e10_prix: 2.096,
  e10_maj: "2026-11-04T07:31:00+00:00",
  sp98_prix: null,
  sp98_maj: null,
  sp95_prix: null,
  sp95_maj: null,
  e85_prix: null,
  e85_maj: null,
  gplc_prix: null,
  gplc_maj: null,
  ...overrides,
});

describe("parseStationRecords", () => {
  it("transforme un enregistrement en station avec ses prix disponibles", () => {
    const { stations, rejectedCount } = parseStationRecords([buildRecord()]);

    expect(rejectedCount).toBe(0);
    expect(stations).toEqual([
      {
        id: 75010003,
        position: { lat: 48.879, lng: 2.37 },
        address: "2/6 RUE LOUIS BLANC",
        postalCode: "75010",
        city: "Paris",
        prices: {
          gazole: { amount: 2.275, updatedAt: "2026-11-04T06:31:00.000Z" },
          e10: { amount: 2.096, updatedAt: "2026-11-04T06:31:00.000Z" },
        },
      },
    ]);
  });

  it("remplace une adresse absente par un libellé explicite", () => {
    const { stations } = parseStationRecords([
      buildRecord({ adresse: null, ville: null, cp: null }),
    ]);

    expect(stations[0]).toMatchObject({
      address: "Adresse inconnue",
      postalCode: "",
      city: "",
    });
  });

  it("écarte les enregistrements invalides sans bloquer les autres", () => {
    const { stations, rejectedCount } = parseStationRecords([
      buildRecord({ id: 1 }),
      buildRecord({ id: 2, geom: null }),
      { n: "importe quoi" },
      buildRecord({ id: 3, e10_prix: "2,05" }),
    ]);

    expect(stations.map((station) => station.id)).toEqual([1]);
    expect(rejectedCount).toBe(3);
  });
});

describe("STATION_SELECT_FIELDS", () => {
  it("liste les champs du schéma pour la requête", () => {
    expect(STATION_SELECT_FIELDS.split(",")).toEqual(
      expect.arrayContaining(["id", "geom", "e10_prix", "gazole_maj"]),
    );
  });
});
