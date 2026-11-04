import type { SearchParamsReader } from "@/features/map/model/map-view-url";
import {
  findBranchByCode,
  findSectorByKey,
  isIndicator,
  type Branch,
  type Indicator,
  type Sector,
} from "./employment";
import {
  DEFAULT_TERRITORY,
  FRANCE_CODE,
  findTerritory,
  type Territory,
} from "./territories";

export const ALL_SECTORS_KEY = "tous";

// Un grand secteur et une branche fine s'excluent : l'un ou l'autre, jamais les
// deux. La branche n'existe que pour la France entière.
export type EmploymentUrlState = {
  territory: Territory;
  sector: Sector | null;
  branch: Branch | null;
  indicator: Indicator;
};

export const parseEmploymentUrlState = (
  params: SearchParamsReader,
): EmploymentUrlState => {
  const rawIndicator = params.get("indicateur");
  const territory =
    findTerritory(params.get("territoire")) ?? DEFAULT_TERRITORY;
  const branch =
    territory.code === FRANCE_CODE
      ? (findBranchByCode(params.get("branche")) ?? null)
      : null;

  return {
    territory,
    sector:
      branch === null ? (findSectorByKey(params.get("secteur")) ?? null) : null,
    branch,
    indicator: isIndicator(rawIndicator) ? rawIndicator : "employees",
  };
};

export const buildEmploymentSearch = ({
  territory,
  sector,
  branch,
  indicator,
}: EmploymentUrlState): string => {
  const params = new URLSearchParams({
    territoire: territory.code,
    secteur: sector?.key ?? ALL_SECTORS_KEY,
    indicateur: indicator,
  });
  if (branch !== null && territory.code === FRANCE_CODE) {
    params.set("branche", branch.code);
  }
  return `?${params.toString()}`;
};
