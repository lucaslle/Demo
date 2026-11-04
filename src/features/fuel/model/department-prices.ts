import type { FuelType } from "./fuel-types";
import type { DepartmentPrice } from "../schemas/department-prices";

// En dessous de ce nombre de stations, une moyenne départementale n'est pas
// représentative : le département reste sur la carte mais pas dans les classements.
export const MIN_STATIONS_FOR_RANKING = 5;

export const PRICE_SCALE_BINS = 5;

export type DepartmentAverage = {
  code: string;
  average: number;
  stationCount: number;
};

export const readDepartmentAverages = (
  departments: readonly DepartmentPrice[],
  fuel: FuelType,
): DepartmentAverage[] =>
  departments.flatMap(({ code, averages }) => {
    const fuelAverage = averages[fuel];
    return fuelAverage === undefined
      ? []
      : [
          {
            code,
            average: fuelAverage.average,
            stationCount: fuelAverage.stationCount,
          },
        ];
  });

export const rankDepartments = (
  averages: readonly DepartmentAverage[],
): DepartmentAverage[] =>
  averages
    .filter(({ stationCount }) => stationCount >= MIN_STATIONS_FOR_RANKING)
    .sort(
      (first, second) =>
        first.average - second.average || first.code.localeCompare(second.code),
    );

export type PriceBounds = { min: number; max: number };

export const findPriceBounds = (
  averages: readonly DepartmentAverage[],
): PriceBounds | null => {
  const ranked = rankDepartments(averages);
  const first = ranked[0];
  const last = ranked[ranked.length - 1];
  return first === undefined || last === undefined
    ? null
    : { min: first.average, max: last.average };
};

// Palier de couleur de 1 (le moins cher) à PRICE_SCALE_BINS (le plus cher).
export const getScaleBin = (value: number, bounds: PriceBounds): number => {
  const spread = bounds.max - bounds.min;
  if (spread <= 0) {
    return 1;
  }
  const ratio = (value - bounds.min) / spread;
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  return Math.min(
    PRICE_SCALE_BINS,
    Math.floor(clampedRatio * PRICE_SCALE_BINS) + 1,
  );
};
