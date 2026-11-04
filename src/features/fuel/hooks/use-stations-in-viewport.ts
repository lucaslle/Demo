import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchStationsInArea } from "../api/fetch-stations";
import {
  areBoundsEqual,
  needsNewFetchArea,
  padAndSnapBounds,
  type Bounds,
} from "../model/bounds";
import type { FuelType } from "../model/fuel-types";
import type { Viewport } from "../model/viewport";

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
  const [fetchArea, setFetchArea] = useState<Bounds | null>(null);
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

  // La zone chargée est plus large que la vue : on ne la recalcule que lorsque
  // l'utilisateur en sort, pour ne pas relancer d'appel à chaque déplacement.
  if (viewport !== null && isZoomSufficient) {
    const isTruncated = stationsQuery.data?.isTruncated ?? false;
    if (
      fetchArea === null ||
      needsNewFetchArea(viewport.bounds, fetchArea, isTruncated)
    ) {
      const nextFetchArea = padAndSnapBounds(viewport.bounds);
      if (fetchArea === null || !areBoundsEqual(nextFetchArea, fetchArea)) {
        setFetchArea(nextFetchArea);
      }
    }
  }

  return { stationsQuery, isZoomSufficient };
};
