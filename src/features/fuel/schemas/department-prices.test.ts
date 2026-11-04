import { describe, expect, it } from "vitest";
import { DEPARTMENT_SELECT, parseDepartmentRecords } from "./department-prices";

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  code_departement: "75",
  stations: 100,
  gazole: 2.2,
  e10: 2.0,
  sp98: 2.1,
  sp95: null,
  e85: null,
  gplc: null,
  n_gazole: 100,
  n_e10: 80,
  n_sp98: 50,
  n_sp95: 0,
  n_e85: 0,
  n_gplc: 0,
  last_update: "2026-11-04T11:39:58+00:00",
  ...overrides,
});

describe("parseDepartmentRecords", () => {
  it("garde les carburants disponibles avec leur moyenne et leur effectif", () => {
    const { departments } = parseDepartmentRecords([buildRecord()]);

    expect(departments).toEqual([
      {
        code: "75",
        stationCount: 100,
        averages: {
          gazole: { average: 2.2, stationCount: 100 },
          e10: { average: 2.0, stationCount: 80 },
          sp98: { average: 2.1, stationCount: 50 },
        },
      },
    ]);
  });

  it("pondère la moyenne nationale par le nombre de stations", () => {
    const { nationalAverages } = parseDepartmentRecords([
      buildRecord({ code_departement: "75", e10: 2.0, n_e10: 100 }),
      buildRecord({ code_departement: "13", e10: 1.8, n_e10: 300 }),
    ]);

    expect(nationalAverages.e10).toBeCloseTo(1.85, 10);
  });

  it("compte les stations sans département dans le national, pas sur la carte", () => {
    const result = parseDepartmentRecords([
      buildRecord({ code_departement: null, stations: 4 }),
      buildRecord({ code_departement: "75", stations: 100 }),
    ]);

    expect(result.departments).toHaveLength(1);
    expect(result.totalStations).toBe(104);
  });

  it("corrige l'heure de Paris pour la dernière mise à jour", () => {
    const { lastUpdatedAt } = parseDepartmentRecords([
      buildRecord({ last_update: "2026-11-04T11:00:00+00:00" }),
      buildRecord({ last_update: "2026-11-04T11:39:58+00:00" }),
    ]);

    expect(lastUpdatedAt).toBe("2026-11-04T10:39:58.000Z");
  });

  it("écarte les groupes invalides", () => {
    const result = parseDepartmentRecords([
      buildRecord({ code_departement: "75" }),
      { code_departement: "13" },
      buildRecord({ code_departement: "69", e10: "n/a" }),
    ]);

    expect(result.departments.map(({ code }) => code)).toEqual(["75"]);
  });
});

describe("DEPARTMENT_SELECT", () => {
  it("demande la moyenne et l'effectif de chaque carburant", () => {
    const fields = DEPARTMENT_SELECT.split(",");

    expect(fields).toContain("avg(e10_prix) as e10");
    expect(fields).toContain("count(gazole_prix) as n_gazole");
    expect(fields).toContain("max(e10_maj) as last_update");
  });
});
