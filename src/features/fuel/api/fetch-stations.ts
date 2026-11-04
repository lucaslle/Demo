import { fetchJson } from "@/shared/api/http-client";
import type { Bounds } from "@/features/map/model/bounds";
import type { FuelType } from "../model/fuel-types";
import type { Station } from "../model/station";
import {
  parseStationRecords,
  STATION_SELECT_FIELDS,
} from "../schemas/station-record";
import { recordsResponseSchema } from "../schemas/records-response";
import { FUEL_PRICES_RECORDS_URL } from "./endpoints";

// L'API plafonne `limit` à 100 par requête.
export const PAGE_SIZE = 100;
export const MAX_STATIONS = 300;

export type StationsResult = {
  stations: Station[];
  totalCount: number;
  isTruncated: boolean;
  rejectedCount: number;
};

type FetchStationsParams = {
  area: Bounds;
  fuel: FuelType;
  signal?: AbortSignal;
};

const buildPageUrl = (area: Bounds, fuel: FuelType, offset: number): string => {
  const { south, west, north, east } = area;
  const params = new URLSearchParams({
    select: STATION_SELECT_FIELDS,
    where: `in_bbox(geom,${south},${west},${north},${east}) and ${fuel}_prix is not null`,
    order_by: `${fuel}_prix,id`,
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  return `${FUEL_PRICES_RECORDS_URL}?${params.toString()}`;
};

// Les stations sont triées par prix croissant : si la zone en contient plus que
// MAX_STATIONS, ce sont les moins chères qui sont conservées.
export const fetchStationsInArea = async ({
  area,
  fuel,
  signal,
}: FetchStationsParams): Promise<StationsResult> => {
  const fetchPage = (offset: number) =>
    fetchJson(buildPageUrl(area, fuel, offset), recordsResponseSchema, {
      signal,
    });

  const firstPage = await fetchPage(0);
  const stationsToFetch = Math.min(firstPage.total_count, MAX_STATIONS);

  const nextOffsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < stationsToFetch; offset += PAGE_SIZE) {
    nextOffsets.push(offset);
  }
  const nextPages = await Promise.all(nextOffsets.map(fetchPage));

  const rawRecords = [firstPage, ...nextPages].flatMap((page) => page.results);
  const { stations, rejectedCount } = parseStationRecords(rawRecords);

  return {
    stations,
    totalCount: firstPage.total_count,
    isTruncated: firstPage.total_count > MAX_STATIONS,
    rejectedCount,
  };
};
