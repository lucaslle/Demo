import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from "./map-config";
import type { MapView } from "./viewport";

export type SearchParamsReader = Pick<URLSearchParams, "get">;

export const DEFAULT_VIEW: MapView = { lat: 48.8566, lng: 2.3522, zoom: 13 };

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

// Lit la position et le zoom de la carte dans l'URL (lien partageable) ; toute
// valeur absente ou invalide retombe sur la vue par défaut.
export const parseMapView = (params: SearchParamsReader): MapView => ({
  lat: readNumberInRange(params.get("lat"), -90, 90, DEFAULT_VIEW.lat),
  lng: readNumberInRange(params.get("lng"), -180, 180, DEFAULT_VIEW.lng),
  zoom: readNumberInRange(
    params.get("z"),
    MAP_MIN_ZOOM,
    MAP_MAX_ZOOM,
    DEFAULT_VIEW.zoom,
  ),
});

export const mapViewToParams = (view: MapView): Record<string, string> => ({
  lat: view.lat.toFixed(COORDINATE_DECIMALS),
  lng: view.lng.toFixed(COORDINATE_DECIMALS),
  z: String(Math.round(view.zoom)),
});
