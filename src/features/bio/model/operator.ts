import type { LatLng } from "@/features/route/model/route";
import { formatDecimal } from "@/shared/lib/format";

export const ACTIVITY_FILTERS = [
  "all",
  "production",
  "preparation",
  "distribution",
] as const;

export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number];

export const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: "Tous",
  production: "Producteurs",
  preparation: "Transformateurs",
  distribution: "Distributeurs",
};

// Valeur attendue par le paramètre `activite` de l'API.
export const ACTIVITY_API_VALUES: Record<
  Exclude<ActivityFilter, "all">,
  string
> = {
  production: "Production",
  preparation: "Préparation",
  distribution: "Distribution",
};

export const isActivityFilter = (
  value: string | null,
): value is ActivityFilter =>
  ACTIVITY_FILTERS.some((filter) => filter === value);

// Nombre d'opérateurs demandés : les plus proches du centre de la carte.
export const NEAREST_COUNT = 40;
export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 100;

export type BioCertification = {
  body: string;
  status: string | null;
  url: string | null;
};

export type BioOperator = {
  id: string;
  name: string;
  categories: string[];
  activities: string[];
  address: string;
  position: LatLng;
  distanceKm: number;
  products: string[];
  certification: BioCertification | null;
  website: string | null;
  phone: string | null;
  salesChannels: string[];
};

export type BioKind = "production" | "preparation" | "distribution" | "other";

// Rôle principal affiché sur la carte : un producteur qui vend aussi en direct
// reste d'abord un producteur.
export const getPrimaryKind = (activities: readonly string[]): BioKind => {
  if (activities.includes("Production")) {
    return "production";
  }
  if (activities.includes("Distribution")) {
    return "distribution";
  }
  if (activities.includes("Préparation")) {
    return "preparation";
  }
  return "other";
};

export const KIND_LABELS: Record<BioKind, string> = {
  production: "Producteur",
  preparation: "Transformateur",
  distribution: "Distributeur",
  other: "Opérateur bio",
};

const METERS_PER_KM = 1000;

export const formatDistance = (distanceKm: number): string =>
  distanceKm < 1
    ? `${Math.round((distanceKm * METERS_PER_KM) / 10) * 10} m`
    : `${formatDecimal(Number(distanceKm.toFixed(1)))} km`;

const CERTIFICATION_STATUS_LABELS: Record<string, string> = {
  ENGAGEE: "Engagé en bio",
};

export const describeCertificationStatus = (
  status: string | null,
): string | null => {
  if (status === null || status.trim() === "") {
    return null;
  }
  const label = CERTIFICATION_STATUS_LABELS[status];
  if (label !== undefined) {
    return label;
  }
  const readable = status.replaceAll("_", " ").toLowerCase();
  return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
};

const FRENCH_PHONE_DIGITS = 10;

// « 0616294393 » → « 06 16 29 43 93 » ; tout autre format est gardé tel quel.
export const formatPhone = (phone: string): string => {
  const digits = phone.replaceAll(/\D/g, "");
  return digits.length === FRENCH_PHONE_DIGITS
    ? (digits.match(/\d{2}/g) ?? []).join(" ")
    : phone.trim();
};

export const buildPhoneHref = (phone: string): string | null => {
  const compact = phone.replaceAll(/[\s.()-]/g, "");
  return /^\+?\d{6,15}$/.test(compact) ? `tel:${compact}` : null;
};

// Seuls les liens http(s) sont proposés : les données viennent d'une saisie libre.
export const toSafeWebUrl = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const CENTER_DECIMALS = 2;
const CENTER_FACTOR = 10 ** CENTER_DECIMALS;

// Arrondir le centre (≈ 1 km) évite une nouvelle requête à chaque léger
// déplacement de la carte et fait partager le cache entre positions voisines.
export const snapCenter = ({ lat, lng }: LatLng): LatLng => ({
  lat: Math.round(lat * CENTER_FACTOR) / CENTER_FACTOR,
  lng: Math.round(lng * CENTER_FACTOR) / CENTER_FACTOR,
});
