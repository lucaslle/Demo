export type PriceSummary = {
  lowest: number;
  average: number;
  highest: number;
  spread: number;
};

export type TankCosts = {
  cheapest: number;
  priciest: number;
  gap: number;
};

// Coût d'un plein dans la station la moins chère et dans la plus chère de la
// zone, et écart entre les deux.
export const computeTankCosts = (
  summary: PriceSummary,
  liters: number,
): TankCosts => ({
  cheapest: summary.lowest * liters,
  priciest: summary.highest * liters,
  gap: summary.spread * liters,
});

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
