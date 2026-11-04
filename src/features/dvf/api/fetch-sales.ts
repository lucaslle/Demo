import { fetchJson } from "@/shared/api/http-client";
import type { LatLng } from "@/features/route/model/route";
import {
  PROPERTY_API_CODES,
  type PropertyFilter,
  type Sale,
} from "../model/sale";
import { parseSales, salesResponseSchema } from "../schemas/sale-record";

// API Données foncières DVF (Cerema) : gratuite, sans clé, CORS ouvert. Elle
// refuse toute zone de plus de 0,02° de côté.
const SALES_URL = "https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/";

// Demi-côté de la zone interrogée : juste sous la limite de 0,02°.
const HALF_SIDE_IN_DEGREES = 0.00995;
const PAGE_SIZE = 500;
const COORDINATE_DECIMALS = 5;
// L'API est parfois lente sur les zones denses.
const REQUEST_TIMEOUT_IN_MS = 30_000;

export type SalesInArea = {
  sales: Sale[];
  // Nombre de ventes dans la zone, avant plafonnement de la page.
  totalCount: number;
  isTruncated: boolean;
};

type FetchSalesParams = {
  center: LatLng;
  property: PropertyFilter;
  // Première année incluse.
  sinceYear: number;
  signal?: AbortSignal;
};

export const buildSalesUrl = ({
  center,
  property,
  sinceYear,
}: Omit<FetchSalesParams, "signal">): string => {
  const west = center.lng - HALF_SIDE_IN_DEGREES;
  const east = center.lng + HALF_SIDE_IN_DEGREES;
  const south = center.lat - HALF_SIDE_IN_DEGREES;
  const north = center.lat + HALF_SIDE_IN_DEGREES;

  const params = new URLSearchParams({
    in_bbox: [west, south, east, north]
      .map((value) => value.toFixed(COORDINATE_DECIMALS))
      .join(","),
    anneemut_min: String(sinceYear),
    page_size: String(PAGE_SIZE),
  });
  const typeCode = PROPERTY_API_CODES[property];
  if (typeCode !== null) {
    params.set("codtypbien", typeCode);
  }
  return `${SALES_URL}?${params.toString()}`;
};

export const fetchSales = async ({
  signal,
  ...search
}: FetchSalesParams): Promise<SalesInArea> => {
  const response = await fetchJson(buildSalesUrl(search), salesResponseSchema, {
    signal,
    timeoutInMs: REQUEST_TIMEOUT_IN_MS,
  });
  return {
    sales: parseSales(response.features, search.center),
    totalCount: response.count,
    isTruncated: response.count > response.features.length,
  };
};
