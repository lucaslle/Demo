export type WeightedPrice = {
  value: number;
  weight: number;
};

const MIN_PLAUSIBLE_PRICE = 0.05;
const MAX_PLAUSIBLE_PRICE = 1.5;
const CENTS_PER_EURO = 100;

const toNumber = (text: string): number => Number(text.replace(",", "."));

const EURO_PER_KWH =
  /(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)\s*(?:ttc|ht)?\s*(?:\/|par|le|du)?\s*kwh/i;
const CENTS_PER_KWH =
  /(\d+(?:[.,]\d+)?)\s*(?:cts?|cents?|c)\s*(?:ttc|ht)?\s*(?:\/|par)?\s*kwh/i;

// Les tarifs sont saisis en texte libre par les opérateurs : on n'extrait un prix
// au kWh que lorsque la phrase est sans ambiguïté, et on ignore le reste
// (liens, textes génériques, tarifs à l'heure ou à la minute).
export const parseKwhPrice = (text: string): number | null => {
  const euroMatch = EURO_PER_KWH.exec(text);
  const centsMatch = CENTS_PER_KWH.exec(text);
  const price =
    euroMatch?.[1] !== undefined
      ? toNumber(euroMatch[1])
      : centsMatch?.[1] !== undefined
        ? toNumber(centsMatch[1]) / CENTS_PER_EURO
        : null;

  return price !== null &&
    price >= MIN_PLAUSIBLE_PRICE &&
    price <= MAX_PLAUSIBLE_PRICE
    ? price
    : null;
};

export const weightedMedian = (
  prices: readonly WeightedPrice[],
): number | null => {
  if (prices.length === 0) {
    return null;
  }

  const sorted = [...prices].sort(
    (first, second) => first.value - second.value,
  );
  const totalWeight = sorted.reduce((total, { weight }) => total + weight, 0);

  let cumulativeWeight = 0;
  for (const { value, weight } of sorted) {
    cumulativeWeight += weight;
    if (cumulativeWeight >= totalWeight / 2) {
      return value;
    }
  }
  return null;
};
