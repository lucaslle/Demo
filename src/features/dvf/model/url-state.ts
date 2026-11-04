import {
  mapViewToParams,
  parseMapView,
  type SearchParamsReader,
} from "@/features/map/model/map-view-url";
import type { MapView } from "@/features/map/model/viewport";
import {
  DEFAULT_PERIOD_YEARS,
  DEFAULT_SALES_ZOOM,
  isPeriodYears,
  isPropertyFilter,
  type PeriodYears,
  type PropertyFilter,
} from "./sale";

export type DvfUrlState = {
  view: MapView;
  property: PropertyFilter;
  years: PeriodYears;
};

const DEFAULT_PROPERTY: PropertyFilter = "apartments";

export const parseDvfUrlState = (params: SearchParamsReader): DvfUrlState => {
  const rawProperty = params.get("bien");
  const rawYears = Number(params.get("periode"));
  const view = parseMapView(params);

  return {
    // Sans zoom dans l'URL, on ouvre assez près pour interroger les ventes.
    view:
      params.get("z") === null ? { ...view, zoom: DEFAULT_SALES_ZOOM } : view,
    property: isPropertyFilter(rawProperty) ? rawProperty : DEFAULT_PROPERTY,
    years: isPeriodYears(rawYears) ? rawYears : DEFAULT_PERIOD_YEARS,
  };
};

export const buildDvfSearch = ({
  view,
  property,
  years,
}: DvfUrlState): string => {
  const params = new URLSearchParams(mapViewToParams(view));
  params.set("bien", property);
  params.set("periode", String(years));
  return `?${params.toString()}`;
};
