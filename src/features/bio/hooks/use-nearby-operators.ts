import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import type { LatLng } from "@/features/route/model/route";
import { fetchNearbyOperators } from "../api/fetch-operators";
import { snapCenter, type ActivityFilter } from "../model/operator";

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

export const bioKeys = {
  all: ["bio"] as const,
  nearby: (center: LatLng, activity: ActivityFilter, query: string) =>
    [
      ...bioKeys.all,
      "nearby",
      center.lat,
      center.lng,
      activity,
      query,
    ] as const,
};

type UseNearbyOperatorsParams = {
  center: LatLng | null;
  activity: ActivityFilter;
  query: string;
};

export const useNearbyOperators = ({
  center,
  activity,
  query,
}: UseNearbyOperatorsParams) => {
  const snappedCenter = center === null ? null : snapCenter(center);
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: bioKeys.nearby(
      snappedCenter ?? { lat: 0, lng: 0 },
      activity,
      trimmedQuery,
    ),
    queryFn:
      snappedCenter === null
        ? skipToken
        : ({ signal }) =>
            fetchNearbyOperators({
              center: snappedCenter,
              activity,
              query: trimmedQuery,
              signal,
            }),
    staleTime: TEN_MINUTES_IN_MS,
    placeholderData: keepPreviousData,
  });
};
