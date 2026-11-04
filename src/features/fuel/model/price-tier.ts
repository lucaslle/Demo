export type PriceTier = "cheapest" | "low" | "medium" | "high";

export type PriceRange = {
  min: number;
  max: number;
};

const LOW_TIER_UPPER_RATIO = 1 / 3;
const MEDIUM_TIER_UPPER_RATIO = 2 / 3;

export const getPriceRange = (
  amounts: readonly number[],
): PriceRange | null => {
  if (amounts.length === 0) {
    return null;
  }
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
};

export const getPriceTier = (amount: number, range: PriceRange): PriceTier => {
  const spread = range.max - range.min;
  if (amount === range.min || spread === 0) {
    return "cheapest";
  }

  const ratio = (amount - range.min) / spread;
  if (ratio < LOW_TIER_UPPER_RATIO) {
    return "low";
  }
  if (ratio < MEDIUM_TIER_UPPER_RATIO) {
    return "medium";
  }
  return "high";
};
