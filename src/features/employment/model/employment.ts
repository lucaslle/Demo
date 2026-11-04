export type QuarterPoint = {
  // Dernier jour du trimestre, au format AAAA-MM-JJ.
  date: string;
  year: number;
  quarter: number;
  label: string;
  employees: number | null;
  payroll: number | null;
};

export type Indicator = "employees" | "payroll";

export const INDICATORS: readonly Indicator[] = ["employees", "payroll"];

export const INDICATOR_LABELS: Record<Indicator, string> = {
  employees: "Effectifs salariés",
  payroll: "Masse salariale",
};

export const isIndicator = (value: unknown): value is Indicator =>
  INDICATORS.some((indicator) => indicator === value);

export type Sector = {
  // Valeur exacte du champ `grand_secteur_d_activite` dans les données.
  value: string;
  key: string;
  label: string;
};

export const SECTORS: readonly Sector[] = [
  { value: "GS1 Industrie", key: "gs1", label: "Industrie" },
  { value: "GS2 Construction", key: "gs2", label: "Construction" },
  { value: "GS3 Commerce", key: "gs3", label: "Commerce" },
  {
    value: "GS4 Hôtellerie-restauration",
    key: "gs4",
    label: "Hôtellerie-restauration",
  },
  {
    value: "GS5 Autres services marchands hors intérim",
    key: "gs5",
    label: "Autres services marchands",
  },
  { value: "GS6 Intérim", key: "gs6", label: "Intérim" },
  {
    value: "GS7 Services non marchands",
    key: "gs7",
    label: "Services non marchands",
  },
];

export const findSectorByKey = (key: string | null): Sector | undefined =>
  SECTORS.find((sector) => sector.key === key);

export const findSectorByValue = (value: string): Sector | undefined =>
  SECTORS.find((sector) => sector.value === value);

export const formatQuarterLabel = (year: number, quarter: number): string =>
  `T${quarter} ${year}`;

// Variation en pourcentage entre le dernier point et celui d'il y a
// `quartersBack` trimestres. Null si l'un des deux manque.
export const computeChange = (
  points: readonly QuarterPoint[],
  indicator: Indicator,
  quartersBack: number,
): number | null => {
  const latest = points[points.length - 1];
  const previous = points[points.length - 1 - quartersBack];
  const latestValue = latest?.[indicator];
  const previousValue = previous?.[indicator];
  if (
    latestValue === null ||
    latestValue === undefined ||
    previousValue === null ||
    previousValue === undefined ||
    previousValue === 0
  ) {
    return null;
  }
  return ((latestValue - previousValue) / previousValue) * 100;
};

export type SectorShare = {
  sector: Sector;
  employees: number;
  payroll: number;
};

export const QUARTERS_PER_YEAR = 4;
export const QUARTERS_IN_FIVE_YEARS = 20;
