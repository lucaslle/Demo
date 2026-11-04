import { skipToken, useQuery } from "@tanstack/react-query";
import { fetchCommune, searchPlaces, type PlaceScope } from "../api/places-api";
import { MIN_PLACE_QUERY_LENGTH } from "../model/place";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

export const placeKeys = {
  all: ["places"] as const,
  search: (query: string, scope: PlaceScope) =>
    [...placeKeys.all, "search", scope, query] as const,
  commune: (code: string | null) =>
    [...placeKeys.all, "commune", code] as const,
};

export const usePlaceSearch = (query: string, scope: PlaceScope) => {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: placeKeys.search(trimmedQuery, scope),
    queryFn:
      trimmedQuery.length >= MIN_PLACE_QUERY_LENGTH
        ? ({ signal }) => searchPlaces({ query: trimmedQuery, scope, signal })
        : skipToken,
    staleTime: ONE_HOUR_IN_MS,
  });
};

export const useCommune = (code: string | null) =>
  useQuery({
    queryKey: placeKeys.commune(code),
    queryFn:
      code === null ? skipToken : ({ signal }) => fetchCommune(code, signal),
    staleTime: ONE_DAY_IN_MS,
  });
