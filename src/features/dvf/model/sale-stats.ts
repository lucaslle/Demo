import type { Sale } from "./sale";

export type PriceStats = {
  // Nombre de ventes dont le prix au m² est exploitable.
  count: number;
  median: number;
  lowerQuartile: number;
  upperQuartile: number;
};

// Interpolation linéaire entre les deux valeurs voisines (méthode usuelle).
const quantile = (sortedValues: readonly number[], ratio: number): number => {
  const position = (sortedValues.length - 1) * ratio;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sortedValues[lowerIndex] ?? 0;
  const upper = sortedValues[upperIndex] ?? lower;
  return lower + (upper - lower) * (position - lowerIndex);
};

export const summarizePricePerSqm = (
  sales: readonly Sale[],
): PriceStats | null => {
  const values = sales
    .flatMap(({ pricePerSqm }) => (pricePerSqm === null ? [] : [pricePerSqm]))
    .sort((first, second) => first - second);
  if (values.length === 0) {
    return null;
  }
  return {
    count: values.length,
    median: quantile(values, 0.5),
    lowerQuartile: quantile(values, 0.25),
    upperQuartile: quantile(values, 0.75),
  };
};

export type PriceTier = "low" | "mid" | "high" | "unknown";

const LOW_RATIO = 0.85;
const HIGH_RATIO = 1.15;

// Situe une vente par rapport au prix médian de la zone affichée.
export const getPriceTier = (
  pricePerSqm: number | null,
  median: number | null,
): PriceTier => {
  if (pricePerSqm === null || median === null) {
    return "unknown";
  }
  if (pricePerSqm < median * LOW_RATIO) {
    return "low";
  }
  return pricePerSqm > median * HIGH_RATIO ? "high" : "mid";
};
