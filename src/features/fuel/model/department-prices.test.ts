import { describe, expect, it } from "vitest";
import type { DepartmentPrice } from "../schemas/department-prices";
import {
  findPriceBounds,
  getScaleBin,
  MIN_STATIONS_FOR_RANKING,
  rankDepartments,
  readDepartmentAverages,
} from "./department-prices";

const department = (
  code: string,
  average: number | null,
  stationCount = 20,
): DepartmentPrice => ({
  code,
  stationCount,
  averages: average === null ? {} : { e10: { average, stationCount } },
});

describe("readDepartmentAverages", () => {
  it("ne garde que les départements qui vendent le carburant", () => {
    const averages = readDepartmentAverages(
      [department("75", 2.0), department("13", null)],
      "e10",
    );

    expect(averages.map(({ code }) => code)).toEqual(["75"]);
  });
});

describe("rankDepartments", () => {
  it("classe du moins cher au plus cher", () => {
    const ranked = rankDepartments(
      readDepartmentAverages(
        [department("75", 2.05), department("15", 1.9), department("13", 1.95)],
        "e10",
      ),
    );

    expect(ranked.map(({ code }) => code)).toEqual(["15", "13", "75"]);
  });

  it("écarte les départements trop peu représentés", () => {
    const ranked = rankDepartments(
      readDepartmentAverages(
        [
          department("48", 1.5, MIN_STATIONS_FOR_RANKING - 1),
          department("75", 2.0),
        ],
        "e10",
      ),
    );

    expect(ranked.map(({ code }) => code)).toEqual(["75"]);
  });
});

describe("findPriceBounds", () => {
  it("renvoie null sans département classable", () => {
    expect(findPriceBounds([])).toBeNull();
  });

  it("renvoie le prix le plus bas et le plus haut", () => {
    const bounds = findPriceBounds(
      readDepartmentAverages(
        [department("15", 1.9), department("75", 2.1)],
        "e10",
      ),
    );

    expect(bounds).toEqual({ min: 1.9, max: 2.1 });
  });
});

describe("getScaleBin", () => {
  const bounds = { min: 1.9, max: 2.1 };

  it("attribue le premier palier au moins cher et le dernier au plus cher", () => {
    expect(getScaleBin(1.9, bounds)).toBe(1);
    expect(getScaleBin(2.1, bounds)).toBe(5);
  });

  it("répartit les valeurs intermédiaires", () => {
    expect(getScaleBin(2.0, bounds)).toBe(3);
  });

  it("borne les valeurs hors de l'échelle", () => {
    expect(getScaleBin(1.5, bounds)).toBe(1);
    expect(getScaleBin(3, bounds)).toBe(5);
  });

  it("gère une échelle sans écart", () => {
    expect(getScaleBin(2, { min: 2, max: 2 })).toBe(1);
  });
});
