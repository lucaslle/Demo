import { fetchJson } from "@/shared/api/http-client";
import type { LatLng } from "@/features/route/model/route";
import {
  ACTIVITY_API_VALUES,
  MIN_QUERY_LENGTH,
  NEAREST_COUNT,
  type ActivityFilter,
  type BioOperator,
} from "../model/operator";
import {
  operatorsResponseSchema,
  parseOperatorRecords,
} from "../schemas/operator-record";

// API Professionnels bio (Agence Bio) : gratuite, sans clé, CORS ouvert. Elle
// classe les opérateurs par proximité d'un point, sans notion de zone visible.
const OPERATORS_URL = "https://opendata.agencebio.org/api/gouv/operateurs/";

const COORDINATE_DECIMALS = 4;

export type NearbyOperators = {
  operators: BioOperator[];
  totalCount: number;
};

type FetchNearbyOperatorsParams = {
  center: LatLng;
  activity: ActivityFilter;
  query: string;
  signal?: AbortSignal;
};

export const buildOperatorsUrl = ({
  center,
  activity,
  query,
}: Omit<FetchNearbyOperatorsParams, "signal">): string => {
  const params = new URLSearchParams({
    lat: center.lat.toFixed(COORDINATE_DECIMALS),
    lng: center.lng.toFixed(COORDINATE_DECIMALS),
    nb: String(NEAREST_COUNT),
  });
  if (activity !== "all") {
    params.set("activite", ACTIVITY_API_VALUES[activity]);
  }
  const trimmedQuery = query.trim();
  if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
    params.set("q", trimmedQuery);
  }
  return `${OPERATORS_URL}?${params.toString()}`;
};

export const fetchNearbyOperators = async ({
  signal,
  ...search
}: FetchNearbyOperatorsParams): Promise<NearbyOperators> => {
  const response = await fetchJson(
    buildOperatorsUrl(search),
    operatorsResponseSchema,
    { signal },
  );

  return {
    operators: parseOperatorRecords(response.items, search.center),
    totalCount: response.nbTotal,
  };
};
