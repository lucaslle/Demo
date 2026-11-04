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

// Branche d'activité fine (nomenclature NAF niveau 38), disponible pour la
// France entière seulement : les données par département s'arrêtent aux grands
// secteurs.
export type Branch = {
  code: string;
  // Intitulé exact dans les données, utilisé pour filtrer.
  name: string;
  // Intitulé affiché, avec une majuscule.
  label: string;
};

const BRANCH_NAMES: ReadonlyArray<readonly [code: string, name: string]> = [
  ["BZ", "Industries extractives"],
  ["CA", "Industries agro-alimentaires"],
  ["CB", "Habillement, textile et cuir"],
  ["CC", "Bois et papier"],
  ["CD", "Cokéfaction et raffinage"],
  ["CE", "Industrie chimique"],
  ["CF", "Industrie pharmaceutique"],
  ["CG", "Industrie des plastiques et autres produits non minéraux"],
  ["CH", "Métallurgie et fabrication de produits métalliques"],
  ["CI", "Fabrication de produits informatiques, électroniques et optiques"],
  ["CJ", "Fabrication d'équipements électriques"],
  ["CK", "Fabrication de machines et équipements n.c.a."],
  ["CL", "Fabrication de matériels de transport"],
  [
    "CM",
    "Industrie du meuble et diverses ; réparation et installation de machines",
  ],
  [
    "DZ",
    "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  ],
  [
    "EZ",
    "Production et distribution d'eau, assainissement, gestion des déchets et dépollution",
  ],
  ["FZ", "Construction"],
  ["GZ", "Commerce, réparation d'automobiles et de motocycles"],
  ["HZ", "Transports et entreposage"],
  ["IZ", "Hébergement et restauration"],
  ["JA", "Edition et audiovisuel"],
  ["JB", "Télécommunications"],
  ["JC", "Activités informatiques"],
  ["KZ", "Activités financières et d'assurance"],
  ["LZ", "Activités immobilières"],
  ["MA", "Activités juridiques, de conseil et d'ingénierie"],
  ["MB", "Recherche et développement"],
  ["MC", "autres activités scientifiques et techniques"],
  ["NZa", "Intérimaires"],
  [
    "NZb",
    "Activités de services administratifs et de soutien [hors intérimaires]",
  ],
  ["OZ", "Administration publique"],
  ["PZ", "Education"],
  ["QA", "Activités pour la santé humaine"],
  ["QB", "Action sociale et hébergement médico-social"],
  ["RZ", "Arts, spectacles et activités récréatives"],
  ["SZ", "autres activités de services"],
];

const capitalizeFirst = (text: string): string =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export const BRANCHES: readonly Branch[] = BRANCH_NAMES.map(([code, name]) => ({
  code,
  name,
  label: capitalizeFirst(name),
}));

export const INFORMATICS_BRANCH_CODE = "JC";

export const findBranchByCode = (code: string | null): Branch | undefined =>
  BRANCHES.find((branch) => branch.code === code);

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
