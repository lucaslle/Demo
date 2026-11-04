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
