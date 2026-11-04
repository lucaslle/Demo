import { isPositionInBounds, type Bounds } from "@/features/map/model/bounds";
import type { ChargingStation } from "./charging-station";
import { FAST_MIN_KW, ULTRA_MIN_KW } from "./power";

// Garde les bornes visibles, les plus puissantes d'abord.
export const buildDisplayedChargingStations = (
  stations: readonly ChargingStation[],
  viewportBounds: Bounds | null,
): ChargingStation[] =>
  stations
    .filter(
      ({ position }) =>
        viewportBounds === null || isPositionInBounds(position, viewportBounds),
    )
    .sort(
      (first, second) =>
        (second.maxPowerKw ?? 0) - (first.maxPowerKw ?? 0) ||
        first.id.localeCompare(second.id),
    );

export type ChargingSummary = {
  stationCount: number;
  fastCount: number;
  ultraCount: number;
  strongest: ChargingStation;
};

export const summarizeChargingStations = (
  displayedStations: readonly ChargingStation[],
): ChargingSummary | null => {
  const [strongest] = displayedStations;
  if (strongest === undefined) {
    return null;
  }

  return {
    stationCount: displayedStations.length,
    fastCount: displayedStations.filter(
      ({ maxPowerKw }) => (maxPowerKw ?? 0) >= FAST_MIN_KW,
    ).length,
    ultraCount: displayedStations.filter(
      ({ maxPowerKw }) => (maxPowerKw ?? 0) >= ULTRA_MIN_KW,
    ).length,
    strongest,
  };
};
