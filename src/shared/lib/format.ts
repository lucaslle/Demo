const priceFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("fr", {
  numeric: "auto",
});

const MINUTE_IN_MS = 60_000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export const STALE_PRICE_THRESHOLD_IN_DAYS = 7;

export const formatPrice = (amount: number): string =>
  `${priceFormatter.format(amount)} €`;

// Découpe un prix en « 1,62 » et « 9 » pour mettre la dernière décimale en exposant.
export const splitPrice = (
  amount: number,
): { main: string; lastDigit: string } => {
  const formatted = priceFormatter.format(amount);
  return { main: formatted.slice(0, -1), lastDigit: formatted.slice(-1) };
};

const wholeEuroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  useGrouping: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Nombre saisi dans un champ : virgule décimale française, sans séparateur de
// milliers pour rester facile à retaper.
export const formatDecimal = (value: number): string =>
  String(value).replace(".", ",");

const integerFormatter = new Intl.NumberFormat("fr-FR", {
  useGrouping: "always",
  maximumFractionDigits: 0,
});

// Le séparateur de milliers français est une espace fine insécable (U+202F),
// presque invisible avec la plupart des polices : on la remplace par une espace
// insécable ordinaire pour que « 9 823 » ne se lise pas « 9823 ».
const NARROW_NO_BREAK_SPACE = /\u202f/g;
const NO_BREAK_SPACE = "\u00a0";
const withReadableSpaces = (text: string): string =>
  text.replace(NARROW_NO_BREAK_SPACE, NO_BREAK_SPACE);

export const formatInteger = (value: number): string =>
  withReadableSpaces(integerFormatter.format(value));

export const formatEuros = (amount: number): string =>
  withReadableSpaces(wholeEuroFormatter.format(amount));

export const formatRelativeTime = (isoDate: string, now: Date): string => {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return "date inconnue";
  }

  const elapsed = timestamp - now.getTime();
  const absoluteElapsed = Math.abs(elapsed);

  // Une date de mise à jour ne peut pas être dans le futur : on tolère un
  // léger décalage d'horloge entre le serveur et l'appareil.
  if (absoluteElapsed < MINUTE_IN_MS || elapsed > 0) {
    return "à l'instant";
  }
  if (absoluteElapsed < HOUR_IN_MS) {
    return relativeTimeFormatter.format(
      Math.round(elapsed / MINUTE_IN_MS),
      "minute",
    );
  }
  if (absoluteElapsed < DAY_IN_MS) {
    return relativeTimeFormatter.format(
      Math.round(elapsed / HOUR_IN_MS),
      "hour",
    );
  }
  return relativeTimeFormatter.format(Math.round(elapsed / DAY_IN_MS), "day");
};

export const isStaleDate = (
  isoDate: string,
  now: Date,
  thresholdInDays = STALE_PRICE_THRESHOLD_IN_DAYS,
): boolean => {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return true;
  }
  return now.getTime() - timestamp > thresholdInDays * DAY_IN_MS;
};
