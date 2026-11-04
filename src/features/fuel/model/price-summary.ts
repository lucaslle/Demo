export type PriceSummary = {
  lowest: number;
  average: number;
  highest: number;
  spread: number;
};

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
