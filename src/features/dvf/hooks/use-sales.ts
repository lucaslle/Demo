import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import type { LatLng } from "@/features/route/model/route";
import { fetchSales } from "../api/fetch-sales";
import {
  firstSaleYear,
  MIN_ZOOM_FOR_SALES,
  type PeriodYears,
  type PropertyFilter,
} from "../model/sale";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

// Le centre est calé sur une grille (≈ 400 m) : de petits déplacements de la
// carte réutilisent la même zone, donc la même réponse en cache.
const GRID_STEP_IN_DEGREES = 0.004;

const snapToGrid = (value: number): number =>
  Math.round(value / GRID_STEP_IN_DEGREES) * GRID_STEP_IN_DEGREES;

export const snapSalesCenter = ({ lat, lng }: LatLng): LatLng => ({
  lat: snapToGrid(lat),
  lng: snapToGrid(lng),
});

export const salesKeys = {
  all: ["dvf"] as const,
  area: (center: LatLng, property: PropertyFilter, sinceYear: number) =>
    [
      ...salesKeys.all,
      "area",
      center.lat.toFixed(4),
      center.lng.toFixed(4),
      property,
      sinceYear,
    ] as const,
};

type UseSalesParams = {
  center: LatLng | null;
  zoom: number | null;
  property: PropertyFilter;
  years: PeriodYears;
};

export const useSales = ({ center, zoom, property, years }: UseSalesParams) => {
  const isZoomSufficient = zoom !== null && zoom >= MIN_ZOOM_FOR_SALES;
  const snappedCenter =
    center === null || !isZoomSufficient ? null : snapSalesCenter(center);
  const sinceYear = firstSaleYear(years, new Date());

  const salesQuery = useQuery({
    queryKey: salesKeys.area(
      snappedCenter ?? { lat: 0, lng: 0 },
      property,
      sinceYear,
    ),
    queryFn:
      snappedCenter === null
        ? skipToken
        : ({ signal }) =>
            fetchSales({ center: snappedCenter, property, sinceYear, signal }),
    staleTime: ONE_HOUR_IN_MS,
    placeholderData: keepPreviousData,
  });

  return { salesQuery, isZoomSufficient };
};
