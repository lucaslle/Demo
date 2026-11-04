import { formatCompact, formatInteger } from "@/shared/lib/format";

const NO_BREAK_SPACE = String.fromCharCode(0xa0);

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export const formatPriceInEuros = (price: number): string =>
  `${formatInteger(Math.round(price))}${NO_BREAK_SPACE}€`;

export const formatPricePerSqm = (pricePerSqm: number): string =>
  `${formatInteger(Math.round(pricePerSqm))}${NO_BREAK_SPACE}€/m²`;

export const formatSurface = (surface: number): string =>
  `${formatInteger(Math.round(surface))}${NO_BREAK_SPACE}m²`;

// Étiquette courte des repères de la carte : prix au m², à défaut le prix total.
export const formatMarkerLabel = (
  pricePerSqm: number | null,
  price: number,
): string =>
  pricePerSqm === null
    ? `${formatCompact(price)}${NO_BREAK_SPACE}€`
    : formatPricePerSqm(pricePerSqm);

export const formatSaleDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? isoDate : dateFormatter.format(date);
};
