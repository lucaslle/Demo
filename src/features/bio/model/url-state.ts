import {
  mapViewToParams,
  parseMapView,
  type SearchParamsReader,
} from "@/features/map/model/map-view-url";
import type { MapView } from "@/features/map/model/viewport";
import {
  isActivityFilter,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  type ActivityFilter,
} from "./operator";

export type BioUrlState = {
  view: MapView;
  activity: ActivityFilter;
  query: string;
};

export const parseBioUrlState = (params: SearchParamsReader): BioUrlState => {
  const rawActivity = params.get("activite");

  return {
    view: parseMapView(params),
    activity: isActivityFilter(rawActivity) ? rawActivity : "all",
    query: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
  };
};

// Seul ce qui s'écarte des valeurs par défaut est écrit dans l'URL.
export const buildBioSearch = ({
  view,
  activity,
  query,
}: BioUrlState): string => {
  const params = new URLSearchParams(mapViewToParams(view));
  if (activity !== "all") {
    params.set("activite", activity);
  }
  const trimmedQuery = query.trim();
  if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
    params.set("q", trimmedQuery);
  }
  return `?${params.toString()}`;
};
