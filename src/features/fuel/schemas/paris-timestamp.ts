const WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/;

const parisPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const readParisWallClockAsUtc = (timestamp: number): number => {
  const parts = new Map(
    parisPartsFormatter
      .formatToParts(new Date(timestamp))
      .map(({ type, value }) => [type, Number(value)]),
  );
  return Date.UTC(
    parts.get("year") ?? 0,
    (parts.get("month") ?? 1) - 1,
    parts.get("day") ?? 1,
    parts.get("hour") ?? 0,
    parts.get("minute") ?? 0,
    parts.get("second") ?? 0,
  );
};

// Le flux « prix des carburants » donne l'heure de Paris, mais l'API la publie
// avec un suffixe « +00:00 » trompeur. On relit l'heure affichée comme une heure
// de Paris pour obtenir le véritable instant UTC.
export const normalizeParisTimestamp = (
  rawTimestamp: string | null,
): string | null => {
  if (rawTimestamp === null) {
    return null;
  }
  const match = WALL_CLOCK_PATTERN.exec(rawTimestamp);
  if (match === null) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const wallClockAsUtc = Date.UTC(
    year ?? 0,
    (month ?? 1) - 1,
    day ?? 1,
    hour ?? 0,
    minute ?? 0,
    second ?? 0,
  );

  let instant = wallClockAsUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offset = readParisWallClockAsUtc(instant) - instant;
    instant = wallClockAsUtc - offset;
  }

  return new Date(instant).toISOString();
};
