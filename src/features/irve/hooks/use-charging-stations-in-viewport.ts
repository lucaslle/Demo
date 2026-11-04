import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useFetchArea } from "@/features/map/hooks/use-fetch-area";
import type { Bounds } from "@/features/map/model/bounds";
import type { Viewport } from "@/features/map/model/viewport";
import { fetchChargingStationsInArea } from "../api/fetch-charging-stations";
import { POWER_FILTER_MIN_KW, type PowerFilter } from "../model/power";

export const MIN_ZOOM_FOR_CHARGING = 10;

export const chargingKeys = {
  all: ["charging-stations"] as const,
  inArea: (area: Bounds | null, powerFilter: PowerFilter) =>
    [...chargingKeys.all, powerFilter, area] as const,
};

type UseChargingStationsInViewportParams = {
  viewport: Viewport | null;
  powerFilter: PowerFilter;
};

export const useChargingStationsInViewport = ({
  viewport,
  powerFilter,
}: UseChargingStationsInViewportParams) => {
  const { fetchArea, syncFetchArea } = useFetchArea();
  const isZoomSufficient =
    viewport !== null && viewport.zoom >= MIN_ZOOM_FOR_CHARGING;

  const chargingQuery = useQuery({
    queryKey: chargingKeys.inArea(fetchArea, powerFilter),
    queryFn:
      fetchArea === null || !isZoomSufficient
        ? skipToken
        : ({ signal }) =>
            fetchChargingStationsInArea({
              area: fetchArea,
              minPowerKw: POWER_FILTER_MIN_KW[powerFilter],
              signal,
            }),
    placeholderData: keepPreviousData,
  });

  if (viewport !== null && isZoomSufficient) {
    syncFetchArea(viewport.bounds, chargingQuery.data?.isTruncated ?? false);
  }

  return { chargingQuery, isZoomSufficient };
};
