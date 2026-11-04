import { describe, expect, it } from "vitest";
import {
  buildSectorShares,
  buildYearPoints,
  computeYearChange,
  formatEnergy,
  formatMwhPerSite,
  rankIris,
  type SectorYearRow,
} from "./electricity";

const rows: SectorYearRow[] = [
  { year: 2024, sector: "RESIDENTIEL", mwh: 600, sites: 200 },
  { year: 2024, sector: "TERTIAIRE", mwh: 300, sites: 20 },
  { year: 2024, sector: "INDUSTRIE", mwh: 100, sites: 2 },
  { year: 2023, sector: "RESIDENTIEL", mwh: 500, sites: 200 },
  { year: 2023, sector: "TERTIAIRE", mwh: 300, sites: 20 },
];

describe("buildYearPoints", () => {
  it("somme les secteurs par année, de la plus ancienne à la plus récente", () => {
    const points = buildYearPoints(rows);

    expect(points.map(({ year }) => year)).toEqual([2023, 2024]);
    expect(points[1]).toMatchObject({
      total: 1000,
      residential: 600,
      residentialSites: 200,
      perResidentialSite: 3,
    });
  });

  it("ne calcule pas de moyenne sans site résidentiel", () => {
    const [point] = buildYearPoints([
      { year: 2024, sector: "TERTIAIRE", mwh: 10, sites: 1 },
    ]);

    expect(point?.perResidentialSite).toBeNull();
    expect(point?.residential).toBe(0);
  });

  it("renvoie une liste vide sans ligne", () => {
    expect(buildYearPoints([])).toEqual([]);
  });
});

describe("computeYearChange", () => {
  const points = buildYearPoints(rows);

  it("compare à l'année précédente", () => {
    expect(computeYearChange(points, 2024, "total")).toBeCloseTo(25, 10);
    expect(computeYearChange(points, 2024, "residential")).toBeCloseTo(20, 10);
    expect(computeYearChange(points, 2024, "perResidentialSite")).toBeCloseTo(
      20,
      10,
    );
  });

  it("renvoie null sans année précédente ou pour une année inconnue", () => {
    expect(computeYearChange(points, 2023, "total")).toBeNull();
    expect(computeYearChange(points, 1999, "total")).toBeNull();
  });

  it("renvoie null quand l'année précédente vaut zéro", () => {
    const withZero = buildYearPoints([
      { year: 2023, sector: "RESIDENTIEL", mwh: 0, sites: 0 },
      { year: 2024, sector: "RESIDENTIEL", mwh: 10, sites: 5 },
    ]);

    expect(computeYearChange(withZero, 2024, "residential")).toBeNull();
  });
});

describe("buildSectorShares", () => {
  it("classe les secteurs par consommation et omet les secteurs vides", () => {
    const [, point] = buildYearPoints(rows);

    const shares = buildSectorShares(point as NonNullable<typeof point>);

    expect(shares.map(({ sector }) => sector)).toEqual([
      "RESIDENTIEL",
      "TERTIAIRE",
      "INDUSTRIE",
    ]);
    expect(shares[0]?.ratio).toBeCloseTo(0.6, 10);
  });
});

describe("rankIris", () => {
  it("classe par consommation par logement et écarte les cas non représentatifs", () => {
    const ranked = rankIris([
      { code: "1", name: "Centre", mwh: 600, housing: 200 },
      { code: "2", name: "Gare", mwh: 1000, housing: 200 },
      { code: "3", name: "Fictif - Bordeaux", mwh: 9, housing: 66 },
      { code: "4", name: "Hameau", mwh: 90, housing: 10 },
    ]);

    expect(ranked.map(({ name }) => name)).toEqual(["Gare", "Centre"]);
    expect(ranked[0]?.perHousing).toBe(5);
  });
});

describe("formatEnergy", () => {
  it("choisit l'unité pour garder des nombres lisibles", () => {
    expect(formatEnergy(512.4)).toBe("512 MWh");
    expect(formatEnergy(9999)).toMatch(/^9\s?999 MWh$/);
    expect(formatEnergy(163_242.518)).toBe("163,2 GWh");
    expect(formatEnergy(1_375_866.5)).toBe("1,38 TWh");
  });
});

describe("formatMwhPerSite", () => {
  it("utilise la virgule décimale", () => {
    expect(formatMwhPerSite(2.8956)).toBe("2,9 MWh");
  });
});
