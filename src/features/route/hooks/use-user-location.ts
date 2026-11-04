import { useCallback, useState } from "react";
import type { LatLng } from "../model/route";

export type LocationStatus =
  "idle" | "locating" | "located" | "denied" | "unavailable";

type UserLocationState = {
  status: LocationStatus;
  position: LatLng | null;
};

const GEOLOCATION_TIMEOUT_IN_MS = 10_000;
const GEOLOCATION_MAX_AGE_IN_MS = 60_000;

// La position n'est demandée qu'à l'action de l'utilisateur : le navigateur
// affiche alors sa propre demande d'autorisation.
export const useUserLocation = () => {
  const [state, setState] = useState<UserLocationState>({
    status: "idle",
    position: null,
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((current) => ({ ...current, status: "unavailable" }));
      return;
    }

    setState((current) => ({ ...current, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setState({
          status: "located",
          position: { lat: coords.latitude, lng: coords.longitude },
        }),
      (error) =>
        setState((current) => ({
          ...current,
          status:
            error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        })),
      {
        timeout: GEOLOCATION_TIMEOUT_IN_MS,
        maximumAge: GEOLOCATION_MAX_AGE_IN_MS,
      },
    );
  }, []);

  return { ...state, locate };
};
