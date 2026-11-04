import type { SearchParamsReader } from "@/features/map/model/map-view-url";
import {
  findSectorByKey,
  isIndicator,
  type Indicator,
  type Sector,
} from "./employment";
import {
  DEFAULT_TERRITORY,
  findTerritory,
  type Territory,
} from "./territories";

export const ALL_SECTORS_KEY = "tous";

export type EmploymentUrlState = {
  territory: Territory;
  sector: Sector | null;
  indicator: Indicator;
};

export const parseEmploymentUrlState = (
  params: SearchParamsReader,
): EmploymentUrlState => {
  const rawIndicator = params.get("indicateur");

  return {
    territory: findTerritory(params.get("territoire")) ?? DEFAULT_TERRITORY,
    sector: findSectorByKey(params.get("secteur")) ?? null,
    indicator: isIndicator(rawIndicator) ? rawIndicator : "employees",
  };
};

export const buildEmploymentSearch = ({
  territory,
  sector,
  indicator,
}: EmploymentUrlState): string => {
  const params = new URLSearchParams({
    territoire: territory.code,
    secteur: sector?.key ?? ALL_SECTORS_KEY,
    indicateur: indicator,
  });
  return `?${params.toString()}`;
};
