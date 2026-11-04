import { fetchJson } from "@/shared/api/http-client";
import {
  isCommuneCode,
  MAX_PLACE_QUERY_LENGTH,
  MIN_PLACE_QUERY_LENGTH,
  type Commune,
  type Place,
} from "../model/place";
import {
  communeResponseSchema,
  geocodingResponseSchema,
  parsePlaces,
} from "../schemas/geocoding";

// Géocodage de la Géoplateforme (IGN) et API Géo : gratuits, sans clé, CORS ouvert.
const GEOCODING_URL = "https://data.geopf.fr/geocodage/search";
const COMMUNES_URL = "https://geo.api.gouv.fr/communes";

const MAX_RESULTS = 6;

export type PlaceScope = "municipality" | "any";

type SearchPlacesParams = {
  query: string;
  scope: PlaceScope;
  signal?: AbortSignal;
};

export const buildPlacesUrl = ({
  query,
  scope,
}: Omit<SearchPlacesParams, "signal">): string => {
  const params = new URLSearchParams({
    q: query.trim().slice(0, MAX_PLACE_QUERY_LENGTH),
    limit: String(MAX_RESULTS),
    autocomplete: "1",
  });
  if (scope === "municipality") {
    params.set("type", "municipality");
  }
  return `${GEOCODING_URL}?${params.toString()}`;
};

export const searchPlaces = async ({
  query,
  scope,
  signal,
}: SearchPlacesParams): Promise<Place[]> => {
  if (query.trim().length < MIN_PLACE_QUERY_LENGTH) {
    return [];
  }
  const response = await fetchJson(
    buildPlacesUrl({ query, scope }),
    geocodingResponseSchema,
    { signal },
  );
  return parsePlaces(response.features);
};

// Commune connue par son code INSEE (lien partagé, rechargement).
export const fetchCommune = async (
  code: string,
  signal?: AbortSignal,
): Promise<Commune | null> => {
  if (!isCommuneCode(code)) {
    return null;
  }
  const params = new URLSearchParams({
    fields: "nom,code,codesPostaux,population,centre",
  });
  const commune = await fetchJson(
    `${COMMUNES_URL}/${code}?${params.toString()}`,
    communeResponseSchema,
    { signal },
  );
  const coordinates = commune.centre?.coordinates;
  return {
    code: commune.code,
    name: commune.nom,
    postcodes: commune.codesPostaux ?? [],
    population: commune.population ?? null,
    position:
      coordinates === undefined
        ? null
        : { lat: coordinates[1], lng: coordinates[0] },
  };
};
