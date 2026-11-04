import { useQuery } from "@tanstack/react-query";
import { fetchObservedTariffs } from "../api/fetch-tariffs";
import { tariffKeys } from "./use-station-tariffs";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const useObservedTariffs = () =>
  useQuery({
    queryKey: tariffKeys.observed(),
    queryFn: ({ signal }) => fetchObservedTariffs(signal),
    staleTime: ONE_DAY_IN_MS,
  });
