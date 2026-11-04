import {
  mapViewToParams,
  parseMapView,
  type SearchParamsReader,
} from "@/features/map/model/map-view-url";
import type { MapView } from "@/features/map/model/viewport";
import { isPowerFilter, type PowerFilter } from "./power";

export type ChargingUrlState = {
  view: MapView;
  powerFilter: PowerFilter;
};

export const parseChargingUrlState = (
  params: SearchParamsReader,
): ChargingUrlState => {
  const rawFilter = params.get("puissance");

  return {
    view: parseMapView(params),
    powerFilter: isPowerFilter(rawFilter) ? rawFilter : "all",
  };
};

export const buildChargingSearch = ({
  view,
  powerFilter,
}: ChargingUrlState): string => {
  const params = new URLSearchParams({
    ...mapViewToParams(view),
    puissance: powerFilter,
  });
  return `?${params.toString()}`;
};
