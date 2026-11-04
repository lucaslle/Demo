export type HistogramBin = {
  from: number;
  to: number;
  count: number;
  containsLowest: boolean;
};

export const DEFAULT_BIN_COUNT = 14;

// Répartit les prix en classes de même largeur entre le minimum et le maximum.
export const buildPriceHistogram = (
  amounts: readonly number[],
  binCount = DEFAULT_BIN_COUNT,
): HistogramBin[] => {
  if (amounts.length === 0 || binCount < 1) {
    return [];
  }

  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  const width = (highest - lowest) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, index) => ({
    from: lowest + index * width,
    to: lowest + (index + 1) * width,
    count: 0,
    containsLowest: index === 0,
  }));

  for (const amount of amounts) {
    const rawIndex = width === 0 ? 0 : Math.floor((amount - lowest) / width);
    const bin = bins[Math.min(binCount - 1, rawIndex)];
    if (bin !== undefined) {
      bin.count += 1;
    }
  }

  return bins;
};
