import {
  mapViewToParams,
  parseMapView,
  type SearchParamsReader,
} from "@/features/map/model/map-view-url";
import type { MapView } from "@/features/map/model/viewport";
import { DEFAULT_FUEL, isFuelType, type FuelType } from "./fuel-types";

export type FuelUrlState = {
  view: MapView;
  fuel: FuelType;
};

export const parseFuelUrlState = (
  params: SearchParamsReader,
  fallbackFuel: FuelType = DEFAULT_FUEL,
): FuelUrlState => {
  const rawFuel = params.get("carburant");

  return {
    view: parseMapView(params),
    fuel: isFuelType(rawFuel) ? rawFuel : fallbackFuel,
  };
};

export const buildFuelSearch = ({ view, fuel }: FuelUrlState): string => {
  const params = new URLSearchParams({
    ...mapViewToParams(view),
    carburant: fuel,
  });
  return `?${params.toString()}`;
};
