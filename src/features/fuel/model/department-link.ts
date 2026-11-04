import type { FuelType } from "./fuel-types";
import { buildFuelSearch } from "./url-state";

const DEPARTMENT_ZOOM = 10;

// Lien vers la carte des stations, centrée sur le département.
export const buildDepartmentHref = (
  center: readonly [number, number],
  fuel: FuelType,
): string => {
  const [lat, lng] = center;
  return `/carburants/${buildFuelSearch({ view: { lat, lng, zoom: DEPARTMENT_ZOOM }, fuel })}`;
};
