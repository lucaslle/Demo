import type { LatLng } from "@/features/route/model/route";

export const PROPERTY_FILTERS = ["apartments", "houses", "all"] as const;

export type PropertyFilter = (typeof PROPERTY_FILTERS)[number];

export const PROPERTY_FILTER_LABELS: Record<PropertyFilter, string> = {
  apartments: "Appartements",
  houses: "Maisons",
  all: "Tous les biens",
};

// Valeur attendue par le paramètre `codtypbien` de l'API ; null = pas de filtre.
export const PROPERTY_API_CODES: Record<PropertyFilter, string | null> = {
  apartments: "121",
  houses: "111",
  all: null,
};

export const isPropertyFilter = (
  value: string | null,
): value is PropertyFilter =>
  PROPERTY_FILTERS.some((filter) => filter === value);

export const PERIOD_YEARS = [1, 3, 5] as const;

export type PeriodYears = (typeof PERIOD_YEARS)[number];

export const DEFAULT_PERIOD_YEARS: PeriodYears = 3;

export const PERIOD_LABELS: Record<PeriodYears, string> = {
  1: "1 an",
  3: "3 ans",
  5: "5 ans",
};

export const isPeriodYears = (value: number): value is PeriodYears =>
  PERIOD_YEARS.some((years) => years === value);

// L'API refuse les zones de plus de 0,02° : la carte n'interroge qu'à fort zoom.
export const MIN_ZOOM_FOR_SALES = 16;
export const DEFAULT_SALES_ZOOM = 16;

// Codes de type de bien d'un logement seul, dont le prix au m² a un sens.
const SINGLE_DWELLING_CODES: readonly string[] = ["111", "121"];

const MIN_BUILT_SURFACE_IN_SQM = 9;
// Hors de cette fourchette, le prix au m² vient presque toujours d'un acte
// atypique (vente partielle, surface erronée) et fausserait les statistiques.
const MIN_PRICE_PER_SQM = 300;
const MAX_PRICE_PER_SQM = 30_000;

export type Sale = {
  id: string;
  // AAAA-MM-JJ
  date: string;
  price: number;
  builtSurface: number | null;
  landSurface: number | null;
  pricePerSqm: number | null;
  typeCode: string;
  typeLabel: string;
  nature: string;
  isOffPlan: boolean;
  lotCount: number;
  parcel: string | null;
  position: LatLng;
};

export const computePricePerSqm = (
  typeCode: string,
  price: number,
  builtSurface: number | null,
): number | null => {
  if (
    !SINGLE_DWELLING_CODES.includes(typeCode) ||
    builtSurface === null ||
    builtSurface < MIN_BUILT_SURFACE_IN_SQM ||
    price <= 0
  ) {
    return null;
  }
  const pricePerSqm = price / builtSurface;
  return pricePerSqm >= MIN_PRICE_PER_SQM && pricePerSqm <= MAX_PRICE_PER_SQM
    ? pricePerSqm
    : null;
};

const PARCEL_PATTERN = /^\d{5}\d{3}([A-Z0-9]{1,2})(\d{4})$/;

// « 33063000MB0014 » → « MB 14 » : section et numéro du cadastre.
export const describeParcel = (parcelId: string): string | null => {
  const match = PARCEL_PATTERN.exec(parcelId);
  return match === null ? null : `${match[1]} ${Number(match[2])}`;
};

export const firstSaleYear = (years: PeriodYears, now: Date): number =>
  now.getFullYear() - (years - 1);
