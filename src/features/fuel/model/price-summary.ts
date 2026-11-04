export type PriceSummary = {
  lowest: number;
  average: number;
  highest: number;
  spread: number;
};

export const FULL_TANK_LITERS = 50;

// Économie réalisée sur un plein en choisissant le prix le plus bas plutôt que
// le prix moyen de la zone.
export const computeFullTankSavings = (
  summary: PriceSummary,
  liters = FULL_TANK_LITERS,
): number => (summary.average - summary.lowest) * liters;

export const summarizePrices = (
  amounts: readonly number[],
): PriceSummary | null => {
  if (amounts.length === 0) {
    return null;
  }

  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  const total = amounts.reduce(
    (runningTotal, amount) => runningTotal + amount,
    0,
  );

  return {
    lowest,
    average: total / amounts.length,
    highest,
    spread: highest - lowest,
  };
};
