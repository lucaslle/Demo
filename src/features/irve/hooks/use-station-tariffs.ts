import { skipToken, useQuery } from "@tanstack/react-query";
import { fetchStationTariffs } from "../api/fetch-tariffs";

const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;

export const tariffKeys = {
  all: ["irve-tariffs"] as const,
  station: (stationId: string | null) =>
    [...tariffKeys.all, "station", stationId] as const,
  observed: () => [...tariffKeys.all, "observed"] as const,
};

export const useStationTariffs = (stationId: string | null) =>
  useQuery({
    queryKey: tariffKeys.station(stationId),
    queryFn:
      stationId === null
        ? skipToken
        : ({ signal }) => fetchStationTariffs(stationId, signal),
    staleTime: THIRTY_MINUTES_IN_MS,
  });
