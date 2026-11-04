import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useFetchArea } from "@/features/map/hooks/use-fetch-area";
import type { Bounds } from "@/features/map/model/bounds";
import type { Viewport } from "@/features/map/model/viewport";
import { fetchStationsInArea } from "../api/fetch-stations";
import type { FuelType } from "../model/fuel-types";

export const MIN_ZOOM_FOR_STATIONS = 10;

export const stationKeys = {
  all: ["stations"] as const,
  inArea: (area: Bounds | null, fuel: FuelType) =>
    [...stationKeys.all, fuel, area] as const,
};

type UseStationsInViewportParams = {
  viewport: Viewport | null;
  fuel: FuelType;
};

export const useStationsInViewport = ({
  viewport,
  fuel,
}: UseStationsInViewportParams) => {
  const { fetchArea, syncFetchArea } = useFetchArea();
  const isZoomSufficient =
    viewport !== null && viewport.zoom >= MIN_ZOOM_FOR_STATIONS;

  const stationsQuery = useQuery({
    queryKey: stationKeys.inArea(fetchArea, fuel),
    queryFn:
      fetchArea === null || !isZoomSufficient
        ? skipToken
        : ({ signal }) =>
            fetchStationsInArea({ area: fetchArea, fuel, signal }),
    placeholderData: keepPreviousData,
  });

  if (viewport !== null && isZoomSufficient) {
    syncFetchArea(viewport.bounds, stationsQuery.data?.isTruncated ?? false);
  }

  return { stationsQuery, isZoomSufficient };
};
