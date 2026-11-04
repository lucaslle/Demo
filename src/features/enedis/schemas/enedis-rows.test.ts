import { describe, expect, it } from "vitest";
import { parseIrisRows, parseSectorRows } from "./enedis-rows";

describe("parseSectorRows", () => {
  it("convertit l'année et garde les secteurs connus", () => {
    expect(
      parseSectorRows([
        { annee: "2024", code_grand_secteur: "TERTIAIRE", mwh: 12.5, sites: 3 },
      ]),
    ).toEqual([{ year: 2024, sector: "TERTIAIRE", mwh: 12.5, sites: 3 }]);
  });

  it("compte les valeurs secrétisées (null) pour zéro", () => {
    const [row] = parseSectorRows([
      {
        annee: "2024",
        code_grand_secteur: "RESIDENTIEL",
        mwh: null,
        sites: null,
      },
    ]);

    expect(row).toMatchObject({ mwh: 0, sites: 0 });
  });

  it("range un secteur inconnu sous « non classé »", () => {
    const [row] = parseSectorRows([
      { annee: "2024", code_grand_secteur: "NOUVEAU", mwh: 1, sites: 1 },
    ]);

    expect(row?.sector).toBe("INCONNU");
  });

  it("écarte une ligne invalide sans perdre les autres", () => {
    const rows = parseSectorRows([
      {
        annee: "deux mille",
        code_grand_secteur: "TERTIAIRE",
        mwh: 1,
        sites: 1,
      },
      { code_grand_secteur: "TERTIAIRE" },
      null,
      { annee: "2023", code_grand_secteur: "INDUSTRIE", mwh: 2, sites: 1 },
    ]);

    expect(rows.map(({ year }) => year)).toEqual([2023]);
  });
});

describe("parseIrisRows", () => {
  it("lit le nom, le code, la consommation et les logements", () => {
    expect(
      parseIrisRows([
        { nom_iris: "Centre", code_iris: "330630101", mwh: 100, logements: 40 },
      ]),
    ).toEqual([{ code: "330630101", name: "Centre", mwh: 100, housing: 40 }]);
  });

  it("compte les valeurs nulles pour zéro et écarte les lignes sans nom", () => {
    const rows = parseIrisRows([
      { nom_iris: "Gare", code_iris: "1", mwh: null, logements: null },
      { code_iris: "2", mwh: 1, logements: 1 },
    ]);

    expect(rows).toEqual([{ code: "1", name: "Gare", mwh: 0, housing: 0 }]);
  });
});
