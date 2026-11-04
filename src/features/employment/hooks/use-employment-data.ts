import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import {
  fetchEmploymentSeries,
  fetchSectorBreakdown,
} from "../api/fetch-employment";
import type { Branch, Sector } from "../model/employment";
import type { Territory } from "../model/territories";

// Les données Urssaf sont publiées au trimestre : inutile de les rafraîchir souvent.
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

export const employmentKeys = {
  all: ["employment"] as const,
  series: (
    territoryCode: string,
    sectorKey: string | null,
    branchCode: string | null,
  ) =>
    [
      ...employmentKeys.all,
      "series",
      territoryCode,
      sectorKey,
      branchCode,
    ] as const,
  breakdown: (territoryCode: string, date: string | null) =>
    [...employmentKeys.all, "breakdown", territoryCode, date] as const,
};

// `placeholderData` garde l'affichage précédent le temps du chargement : le
// graphique ne disparaît pas à chaque changement de territoire.
export const useEmploymentSeries = (
  territory: Territory,
  sector: Sector | null,
  branch: Branch | null,
) =>
  useQuery({
    queryKey: employmentKeys.series(
      territory.code,
      sector?.key ?? null,
      branch?.code ?? null,
    ),
    queryFn: ({ signal }) =>
      fetchEmploymentSeries({ territory, sector, branch, signal }),
    staleTime: SIX_HOURS_IN_MS,
    placeholderData: keepPreviousData,
  });

export const useSectorBreakdown = (territory: Territory, date: string | null) =>
  useQuery({
    queryKey: employmentKeys.breakdown(territory.code, date),
    queryFn:
      date === null
        ? skipToken
        : ({ signal }) => fetchSectorBreakdown({ territory, date, signal }),
    staleTime: SIX_HOURS_IN_MS,
    placeholderData: keepPreviousData,
  });
