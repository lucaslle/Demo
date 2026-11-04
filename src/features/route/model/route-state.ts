import {
  formatDistance,
  formatDuration,
  type LatLng,
  type Route,
} from "./route";

export type RouteState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "location-denied" }
  | { status: "location-unavailable" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; route: Route; origin: LatLng; destination: LatLng };

export const LOCATION_DENIED_MESSAGE =
  "Position refusée. Autorisez la localisation dans votre navigateur pour obtenir l'itinéraire.";
export const LOCATION_UNAVAILABLE_MESSAGE =
  "Votre position n'a pas pu être déterminée.";

// Phrase courte décrivant l'état, pour les endroits où la place manque
// (fenêtre de détail sur la carte).
export const summarizeRouteState = (state: RouteState): string | null => {
  switch (state.status) {
    case "idle":
      return null;
    case "locating":
      return "Localisation en cours…";
    case "location-denied":
      return LOCATION_DENIED_MESSAGE;
    case "location-unavailable":
      return LOCATION_UNAVAILABLE_MESSAGE;
    case "loading":
      return "Calcul de l'itinéraire…";
    case "error":
      return state.message;
    case "ready":
      return `${formatDuration(state.route.durationInSeconds)} · ${formatDistance(state.route.distanceInMeters)}`;
  }
};
