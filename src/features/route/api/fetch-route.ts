import { describeApiError } from "@/shared/api/describe-api-error";
import { ApiError, fetchJson } from "@/shared/api/http-client";
import { toRoute, type LatLng, type Route } from "../model/route";
import { routeResponseSchema } from "../schemas/route-response";

// Service d'itinéraire de la Géoplateforme (IGN) : gratuit, sans clé, CORS ouvert.
const ROUTE_URL = "https://data.geopf.fr/navigation/itineraire";
const ROUTE_RESOURCE = "bdtopo-valhalla";

type FetchRouteParams = {
  origin: LatLng;
  destination: LatLng;
  signal?: AbortSignal;
};

const toApiPoint = ({ lat, lng }: LatLng): string => `${lng},${lat}`;

export const fetchRoute = async ({
  origin,
  destination,
  signal,
}: FetchRouteParams): Promise<Route> => {
  const params = new URLSearchParams({
    resource: ROUTE_RESOURCE,
    profile: "car",
    optimization: "fastest",
    start: toApiPoint(origin),
    end: toApiPoint(destination),
    geometryFormat: "geojson",
    getSteps: "true",
    crs: "EPSG:4326",
    distanceUnit: "meter",
    timeUnit: "second",
  });

  const response = await fetchJson(
    `${ROUTE_URL}?${params.toString()}`,
    routeResponseSchema,
    { signal },
  );

  return toRoute(response);
};

// L'API répond 400 quand un point est hors de sa zone de couverture.
export const describeRouteError = (error: unknown): string =>
  error instanceof ApiError && error.kind === "http" && error.status === 400
    ? "Cet itinéraire sort de la zone couverte par le service."
    : describeApiError(error);
