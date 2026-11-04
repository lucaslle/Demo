import type { LatLng } from "@/features/route/model/route";

export type PlaceKind = "municipality" | "address" | "other";

export type Place = {
  id: string;
  label: string;
  kind: PlaceKind;
  position: LatLng;
  // Code INSEE de la commune (Corse : 2A…, 2B…).
  citycode: string | null;
  city: string | null;
  postcode: string | null;
};

export const MIN_PLACE_QUERY_LENGTH = 3;
export const MAX_PLACE_QUERY_LENGTH = 100;

// Code INSEE d'une commune : 5 chiffres, ou 2A / 2B suivis de 3 chiffres.
const COMMUNE_CODE_PATTERN = /^(\d{5}|2[AB]\d{3})$/;

export const isCommuneCode = (value: string | null): value is string =>
  value !== null && COMMUNE_CODE_PATTERN.test(value);

export type Commune = {
  code: string;
  name: string;
  postcodes: string[];
  population: number | null;
  position: LatLng | null;
};
