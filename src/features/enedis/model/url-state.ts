import type { SearchParamsReader } from "@/features/map/model/map-view-url";
import { isCommuneCode } from "@/features/places/model/place";

const YEAR_PATTERN = /^\d{4}$/;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export const isYear = (value: number): boolean =>
  Number.isInteger(value) && value >= MIN_YEAR && value <= MAX_YEAR;

export type ElectricityUrlState = {
  communeCode: string | null;
  year: number | null;
};

export const parseElectricityUrlState = (
  params: SearchParamsReader,
): ElectricityUrlState => {
  const rawCommune = params.get("commune");
  const rawYear = params.get("annee");
  const year =
    rawYear !== null && YEAR_PATTERN.test(rawYear) ? Number(rawYear) : null;

  return {
    communeCode: isCommuneCode(rawCommune) ? rawCommune : null,
    year: year !== null && isYear(year) ? year : null,
  };
};

// Seul ce qui est choisi apparaît dans l'URL.
export const buildElectricitySearch = ({
  communeCode,
  year,
}: ElectricityUrlState): string => {
  const params = new URLSearchParams();
  if (communeCode !== null) {
    params.set("commune", communeCode);
    if (year !== null) {
      params.set("annee", String(year));
    }
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
};
