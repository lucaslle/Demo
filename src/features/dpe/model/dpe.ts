export const PARCS = ["logements", "tertiaire"] as const;
export type Parc = (typeof PARCS)[number];

export const PARC_LABELS: Record<Parc, string> = {
  logements: "Logements",
  tertiaire: "Tertiaire",
};

export const isParc = (value: string | null): value is Parc =>
  PARCS.some((parc) => parc === value);

export const KINDS = ["dpe", "ges"] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  dpe: "Énergie (DPE)",
  ges: "Climat (GES)",
};

export const isKind = (value: string | null): value is Kind =>
  KINDS.some((kind) => kind === value);

export const DPE_LABELS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type DpeLabel = (typeof DPE_LABELS)[number];

export const isDpeLabel = (value: string): value is DpeLabel =>
  DPE_LABELS.some((label) => label === value);

// Palette officielle des étiquettes énergie et climat.
export const LABEL_COLORS: Record<DpeLabel, string> = {
  A: "#319834",
  B: "#33cc31",
  C: "#cdfc34",
  D: "#fbfe06",
  E: "#fccc02",
  F: "#fc9935",
  G: "#fc0205",
};

const toLinearChannel = (channel: number): number => {
  const ratio = channel / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hexColor: string): number => {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) =>
    toLinearChannel(Number.parseInt(hexColor.slice(start, start + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (first: number, second: number): number =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

// Noir ou blanc, selon celui qui contraste le mieux avec le fond.
export const getReadableTextColor = (backgroundHex: string): string => {
  const luminance = relativeLuminance(backgroundHex);
  return contrastRatio(luminance, 0) >= contrastRatio(luminance, 1)
    ? "#000000"
    : "#ffffff";
};

export type LabelCount = {
  label: DpeLabel;
  count: number;
};

export type PeriodCount = {
  period: string;
  count: number;
};

export type DpeSummary = {
  total: number;
  counts: LabelCount[];
  // Consommation moyenne en kWh d'énergie primaire par m² et par an.
  averageConsumption: number | null;
  // Date du diagnostic le plus récent, AAAA-MM-JJ.
  lastDiagnosticDate: string | null;
  // Seulement pour les logements.
  periods: PeriodCount[];
};

export const sumCounts = (
  counts: readonly LabelCount[],
  labels: readonly DpeLabel[],
): number =>
  counts
    .filter(({ label }) => labels.includes(label))
    .reduce((total, { count }) => total + count, 0);

// Part (en %) d'un sous-ensemble d'étiquettes ; null s'il n'y a aucun diagnostic.
export const computeShare = (
  counts: readonly LabelCount[],
  labels: readonly DpeLabel[],
): number | null => {
  const total = sumCounts(counts, DPE_LABELS);
  return total === 0 ? null : (sumCounts(counts, labels) / total) * 100;
};

// Les « passoires thermiques » sont les logements classés F ou G.
export const THERMAL_SIEVE_LABELS: readonly DpeLabel[] = ["F", "G"];
export const BEST_LABELS: readonly DpeLabel[] = ["A", "B"];

const shareFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const NARROW_NO_BREAK_SPACE = / /g;
const NO_BREAK_SPACE = " ";

export const formatShare = (share: number | null): string =>
  share === null
    ? "—"
    : `${shareFormatter.format(share).replace(NARROW_NO_BREAK_SPACE, NO_BREAK_SPACE)}${NO_BREAK_SPACE}%`;

export const PERIOD_ORDER: readonly string[] = [
  "avant 1948",
  "1948-1974",
  "1975-1977",
  "1978-1982",
  "1983-1988",
  "1989-2000",
  "2001-2005",
  "2006-2012",
  "2013-2021",
  "après 2021",
];

// Du plus ancien au plus récent ; une période inconnue passe en dernier.
export const sortPeriods = (periods: readonly PeriodCount[]): PeriodCount[] =>
  [...periods].sort((first, second) => {
    const firstRank = PERIOD_ORDER.indexOf(first.period);
    const secondRank = PERIOD_ORDER.indexOf(second.period);
    return (
      (firstRank === -1 ? PERIOD_ORDER.length : firstRank) -
      (secondRank === -1 ? PERIOD_ORDER.length : secondRank)
    );
  });
