import { isPositionInBounds, type Bounds } from "@/features/map/model/bounds";
import type { FuelType } from "./fuel-types";
import { getPriceRange, getPriceTier, type PriceTier } from "./price-tier";
import type { FuelPrice, Station } from "./station";

export type DisplayedStation = {
  station: Station;
  price: FuelPrice;
  tier: PriceTier;
};

// Garde les stations visibles qui vendent le carburant choisi, du moins cher
// au plus cher, et attribue à chacune un palier de prix relatif à la zone.
export const buildDisplayedStations = (
  stations: readonly Station[],
  fuel: FuelType,
  viewportBounds: Bounds | null,
): DisplayedStation[] => {
  const pricedStations = stations.flatMap((station) => {
    const price = station.prices[fuel];
    const isVisible =
      viewportBounds === null ||
      isPositionInBounds(station.position, viewportBounds);
    return price !== undefined && isVisible ? [{ station, price }] : [];
  });

  const range = getPriceRange(pricedStations.map(({ price }) => price.amount));
  if (range === null) {
    return [];
  }

  return pricedStations
    .sort(
      (first, second) =>
        first.price.amount - second.price.amount ||
        first.station.id - second.station.id,
    )
    .map(({ station, price }) => ({
      station,
      price,
      tier: getPriceTier(price.amount, range),
    }));
};
