import { skipToken, useQuery } from "@tanstack/react-query";
import { fetchIrisConsumption, fetchSectorSeries } from "../api/fetch-enedis";

// Les données Enedis sont annuelles : inutile de les rafraîchir souvent.
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

export const enedisKeys = {
  all: ["enedis"] as const,
  sectors: (communeCode: string | null) =>
    [...enedisKeys.all, "sectors", communeCode] as const,
  iris: (communeCode: string | null, year: number | null) =>
    [...enedisKeys.all, "iris", communeCode, year] as const,
};

export const useSectorSeries = (communeCode: string | null) =>
  useQuery({
    queryKey: enedisKeys.sectors(communeCode),
    queryFn:
      communeCode === null
        ? skipToken
        : ({ signal }) => fetchSectorSeries(communeCode, signal),
    staleTime: SIX_HOURS_IN_MS,
  });

export const useIrisConsumption = (
  communeCode: string | null,
  year: number | null,
) =>
  useQuery({
    queryKey: enedisKeys.iris(communeCode, year),
    queryFn:
      communeCode === null || year === null
        ? skipToken
        : ({ signal }) => fetchIrisConsumption(communeCode, year, signal),
    staleTime: SIX_HOURS_IN_MS,
  });
