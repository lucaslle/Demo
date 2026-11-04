import { DEFAULT_FUEL, isFuelType, type FuelType } from "./fuel-types";
import type { MapView } from "./viewport";

export type FuelUrlState = {
  view: MapView;
  fuel: FuelType;
};

type SearchParamsReader = Pick<URLSearchParams, "get">;

export const DEFAULT_VIEW: MapView = { lat: 48.8566, lng: 2.3522, zoom: 13 };

export const MAP_MIN_ZOOM = 6;
export const MAP_MAX_ZOOM = 18;

const COORDINATE_DECIMALS = 5;

const readNumberInRange = (
  rawValue: string | null,
  min: number,
  max: number,
  fallback: number,
): number => {
  if (rawValue === null || rawValue.trim() === "") {
    return fallback;
  }
  const value = Number(rawValue);
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
};

export const parseFuelUrlState = (
  params: SearchParamsReader,
  fallbackFuel: FuelType = DEFAULT_FUEL,
): FuelUrlState => {
  const rawFuel = params.get("carburant");

  return {
    view: {
      lat: readNumberInRange(params.get("lat"), -90, 90, DEFAULT_VIEW.lat),
      lng: readNumberInRange(params.get("lng"), -180, 180, DEFAULT_VIEW.lng),
      zoom: readNumberInRange(
        params.get("z"),
        MAP_MIN_ZOOM,
        MAP_MAX_ZOOM,
        DEFAULT_VIEW.zoom,
      ),
    },
    fuel: isFuelType(rawFuel) ? rawFuel : fallbackFuel,
  };
};

export const buildFuelSearch = ({ view, fuel }: FuelUrlState): string => {
  const params = new URLSearchParams({
    lat: view.lat.toFixed(COORDINATE_DECIMALS),
    lng: view.lng.toFixed(COORDINATE_DECIMALS),
    z: String(Math.round(view.zoom)),
    carburant: fuel,
  });
  return `?${params.toString()}`;
};
