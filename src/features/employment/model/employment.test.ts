import { describe, expect, it } from "vitest";
import {
  computeChange,
  findSectorByKey,
  findSectorByValue,
  formatQuarterLabel,
  isIndicator,
  SECTORS,
  type QuarterPoint,
} from "./employment";

const point = (
  index: number,
  employees: number | null,
  payroll: number | null = null,
): QuarterPoint => ({
  date: `2020-0${(index % 9) + 1}-30`,
  year: 2020 + Math.floor(index / 4),
  quarter: (index % 4) + 1,
  label: `T${(index % 4) + 1}`,
  employees,
  payroll,
});

describe("computeChange", () => {
  const points = [100, 102, 104, 106, 110].map((value, index) =>
    point(index, value),
  );

  it("calcule la variation en pourcentage entre le dernier trimestre et un trimestre antérieur", () => {
    expect(computeChange(points, "employees", 4)).toBeCloseTo(10, 10);
    expect(computeChange(points, "employees", 1)).toBeCloseTo(3.7736, 4);
  });

  it("renvoie null quand l'historique est trop court", () => {
    expect(computeChange(points, "employees", 10)).toBeNull();
  });

  it("renvoie null quand une valeur manque ou vaut zéro", () => {
    expect(
      computeChange([point(0, null), point(1, 5)], "employees", 1),
    ).toBeNull();
    expect(
      computeChange([point(0, 0), point(1, 5)], "employees", 1),
    ).toBeNull();
  });

  it("travaille sur l'indicateur demandé", () => {
    const withPayroll = [point(0, 1, 50), point(1, 1, 75)];

    expect(computeChange(withPayroll, "payroll", 1)).toBeCloseTo(50, 10);
  });
});

describe("secteurs", () => {
  it("retrouve un secteur par sa clé ou par sa valeur dans les données", () => {
    expect(findSectorByKey("gs3")?.label).toBe("Commerce");
    expect(findSectorByValue("GS6 Intérim")?.key).toBe("gs6");
    expect(findSectorByKey("inconnu")).toBeUndefined();
    expect(findSectorByKey(null)).toBeUndefined();
  });

  it("définit sept grands secteurs aux clés uniques", () => {
    expect(SECTORS).toHaveLength(7);
    expect(new Set(SECTORS.map(({ key }) => key)).size).toBe(7);
  });
});

describe("helpers", () => {
  it("formate l'étiquette d'un trimestre", () => {
    expect(formatQuarterLabel(2026, 2)).toBe("T2 2026");
  });

  it("reconnaît uniquement les indicateurs valides", () => {
    expect(isIndicator("employees")).toBe(true);
    expect(isIndicator("payroll")).toBe(true);
    expect(isIndicator("pib")).toBe(false);
  });
});
