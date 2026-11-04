import type { Bounds } from "@/features/map/model/bounds";
import { fetchJson } from "@/shared/api/http-client";
import { recordsResponseSchema } from "@/shared/api/records-response";
import type { ChargingStation } from "../model/charging-station";
import {
  CHARGING_GROUP_BY,
  CHARGING_SELECT,
  parseChargingGroups,
} from "../schemas/charging-group";
import { IRVE_RECORDS_URL, LATITUDE_FIELD, LONGITUDE_FIELD } from "./endpoints";

// L'API plafonne `limit` à 100 par requête.
export const PAGE_SIZE = 100;
export const MAX_GROUPS = 300;

export type ChargingStationsResult = {
  stations: ChargingStation[];
  isTruncated: boolean;
  rejectedCount: number;
};

type FetchChargingStationsParams = {
  area: Bounds;
  minPowerKw: number;
  signal?: AbortSignal;
};

const buildWhere = (area: Bounds, minPowerKw: number): string => {
  const { south, west, north, east } = area;
  const conditions = [
    `${LATITUDE_FIELD} >= ${south}`,
    `${LATITUDE_FIELD} <= ${north}`,
    `${LONGITUDE_FIELD} >= ${west}`,
    `${LONGITUDE_FIELD} <= ${east}`,
  ];
  if (minPowerKw > 0) {
    conditions.push(`puissance_nominale >= ${minPowerKw}`);
  }
  return conditions.join(" and ");
};

const buildPageUrl = (
  area: Bounds,
  minPowerKw: number,
  offset: number,
): string => {
  const params = new URLSearchParams({
    select: CHARGING_SELECT,
    where: buildWhere(area, minPowerKw),
    group_by: CHARGING_GROUP_BY,
    // Les bornes les plus puissantes d'abord : si la zone en contient trop,
    // ce sont elles qui sont conservées.
    order_by: "max_kw desc, id_station_itinerance",
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  return `${IRVE_RECORDS_URL}?${params.toString()}`;
};

export const fetchChargingStationsInArea = async ({
  area,
  minPowerKw,
  signal,
}: FetchChargingStationsParams): Promise<ChargingStationsResult> => {
  const fetchPage = (offset: number) =>
    fetchJson(buildPageUrl(area, minPowerKw, offset), recordsResponseSchema, {
      signal,
    });

  const firstPage = await fetchPage(0);
  const pages = [firstPage];

  // Pour un groupement, l'API ne donne pas le total : on poursuit tant que les
  // pages sont pleines, dans la limite de MAX_GROUPS.
  if (firstPage.results.length === PAGE_SIZE) {
    const nextOffsets: number[] = [];
    for (let offset = PAGE_SIZE; offset < MAX_GROUPS; offset += PAGE_SIZE) {
      nextOffsets.push(offset);
    }
    pages.push(...(await Promise.all(nextOffsets.map(fetchPage))));
  }

  const rawGroups = pages.flatMap((page) => page.results);
  const { stations, rejectedCount } = parseChargingGroups(rawGroups);

  return {
    stations,
    isTruncated: rawGroups.length >= MAX_GROUPS,
    rejectedCount,
  };
};
