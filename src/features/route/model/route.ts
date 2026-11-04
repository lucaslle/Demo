import type { RouteResponse } from "../schemas/route-response";
import { describeInstruction } from "./instruction-label";

export type LatLng = { lat: number; lng: number };

export type RouteStep = {
  label: string;
  distanceInMeters: number;
};

export type Route = {
  distanceInMeters: number;
  durationInSeconds: number;
  path: LatLng[];
  steps: RouteStep[];
};

export const toRoute = (response: RouteResponse): Route => ({
  distanceInMeters: response.distance,
  durationInSeconds: response.duration,
  // GeoJSON donne [longitude, latitude].
  path: response.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
  steps: response.portions.flatMap(({ steps }) =>
    steps.map(({ distance, instruction }) => ({
      label: describeInstruction(instruction.type, instruction.modifier),
      distanceInMeters: distance,
    })),
  ),
});

const METERS_PER_KILOMETER = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const ROUNDING_STEP_IN_METERS = 10;

const kilometerFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatDistance = (meters: number): string => {
  if (meters < METERS_PER_KILOMETER) {
    const rounded =
      Math.round(meters / ROUNDING_STEP_IN_METERS) * ROUNDING_STEP_IN_METERS;
    return `${rounded} m`;
  }
  return `${kilometerFormatter.format(meters / METERS_PER_KILOMETER)} km`;
};

export const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.max(1, Math.round(seconds / SECONDS_PER_MINUTE));
  if (totalMinutes < MINUTES_PER_HOUR) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return minutes === 0
    ? `${hours} h`
    : `${hours} h ${String(minutes).padStart(2, "0")}`;
};

// Lien vers un service de navigation ouvert, pour partir réellement en route.
export const buildOpenStreetMapDirectionsUrl = (
  origin: LatLng,
  destination: LatLng,
): string => {
  const route = `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
};
