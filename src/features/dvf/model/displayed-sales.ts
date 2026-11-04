import type { Bounds } from "@/features/map/model/bounds";
import type { Sale } from "./sale";

// La zone interrogée déborde un peu de la carte : on ne garde que les ventes
// visibles. Les plus récentes viennent en premier, et on plafonne pour garder
// une carte et une liste fluides.
export const MAX_DISPLAYED_SALES = 300;

export const selectDisplayedSales = (
  sales: readonly Sale[],
  bounds: Bounds | null,
): Sale[] =>
  sales
    .filter(
      ({ position }) =>
        bounds === null ||
        (position.lat >= bounds.south &&
          position.lat <= bounds.north &&
          position.lng >= bounds.west &&
          position.lng <= bounds.east),
    )
    .slice(0, MAX_DISPLAYED_SALES);
