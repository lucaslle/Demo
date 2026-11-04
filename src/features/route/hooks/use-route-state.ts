import { skipToken, useQuery } from "@tanstack/react-query";
import { describeRouteError, fetchRoute } from "../api/fetch-route";
import type { LatLng } from "../model/route";
import type { RouteState } from "../model/route-state";
import type { LocationStatus } from "./use-user-location";

const COORDINATE_DECIMALS = 4;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

const roundCoordinate = (value: number): number =>
  Number(value.toFixed(COORDINATE_DECIMALS));

// Arrondi à une dizaine de mètres : une dérive du GPS ne relance pas le calcul.
const toKeyPoint = (point: LatLng | null): [number, number] | null =>
  point === null
    ? null
    : [roundCoordinate(point.lat), roundCoordinate(point.lng)];

export const routeKeys = {
  all: ["route"] as const,
  between: (origin: LatLng | null, destination: LatLng | null) =>
    [...routeKeys.all, toKeyPoint(origin), toKeyPoint(destination)] as const,
};

type UseRouteStateParams = {
  origin: LatLng | null;
  locationStatus: LocationStatus;
  destination: LatLng | null;
};

export const useRouteState = ({
  origin,
  locationStatus,
  destination,
}: UseRouteStateParams): RouteState => {
  const routeQuery = useQuery({
    queryKey: routeKeys.between(origin, destination),
    queryFn:
      origin === null || destination === null
        ? skipToken
        : ({ signal }) => fetchRoute({ origin, destination, signal }),
    staleTime: FIVE_MINUTES_IN_MS,
    retry: false,
  });

  if (destination === null) {
    return { status: "idle" };
  }
  if (origin === null) {
    if (locationStatus === "denied") {
      return { status: "location-denied" };
    }
    if (locationStatus === "unavailable") {
      return { status: "location-unavailable" };
    }
    return { status: "locating" };
  }
  if (routeQuery.isError) {
    return { status: "error", message: describeRouteError(routeQuery.error) };
  }
  if (routeQuery.data === undefined) {
    return { status: "loading" };
  }
  return { status: "ready", route: routeQuery.data, origin, destination };
};
