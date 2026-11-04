import type { LatLng } from "@/features/route/model/route";

const EARTH_RADIUS_IN_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Distance à vol d'oiseau (formule de haversine) : suffisante pour classer des
// points proches sans appeler un service d'itinéraire.
export const distanceInKm = (from: LatLng, to: LatLng): number => {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_IN_KM * Math.asin(Math.sqrt(a));
};
