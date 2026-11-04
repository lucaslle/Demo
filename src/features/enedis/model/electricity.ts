import { formatDecimal, formatInteger } from "@/shared/lib/format";

export const SECTOR_CODES = [
  "RESIDENTIEL",
  "TERTIAIRE",
  "INDUSTRIE",
  "PETIT_PROFESSIONNEL",
  "AGRICULTURE",
  "INCONNU",
] as const;

export type SectorCode = (typeof SECTOR_CODES)[number];

export const SECTOR_LABELS: Record<SectorCode, string> = {
  RESIDENTIEL: "Résidentiel",
  TERTIAIRE: "Tertiaire",
  INDUSTRIE: "Industrie",
  PETIT_PROFESSIONNEL: "Petits professionnels",
  AGRICULTURE: "Agriculture",
  INCONNU: "Non classé",
};

export const isSectorCode = (value: string): value is SectorCode =>
  SECTOR_CODES.some((code) => code === value);

// Une ligne = une année et un grand secteur, sommés sur la commune.
export type SectorYearRow = {
  year: number;
  sector: SectorCode;
  mwh: number;
  sites: number;
};

export type YearPoint = {
  year: number;
  total: number;
  residential: number;
  residentialSites: number;
  // Consommation moyenne d'un site résidentiel (point de livraison), en MWh.
  perResidentialSite: number | null;
  bySector: Record<SectorCode, number>;
};

const emptySectorTotals = (): Record<SectorCode, number> => ({
  RESIDENTIEL: 0,
  TERTIAIRE: 0,
  INDUSTRIE: 0,
  PETIT_PROFESSIONNEL: 0,
  AGRICULTURE: 0,
  INCONNU: 0,
});

// Regroupe les lignes par année, de la plus ancienne à la plus récente.
export const buildYearPoints = (
  rows: readonly SectorYearRow[],
): YearPoint[] => {
  const byYear = new Map<
    number,
    { bySector: Record<SectorCode, number>; residentialSites: number }
  >();

  for (const { year, sector, mwh, sites } of rows) {
    const entry = byYear.get(year) ?? {
      bySector: emptySectorTotals(),
      residentialSites: 0,
    };
    entry.bySector[sector] += mwh;
    if (sector === "RESIDENTIEL") {
      entry.residentialSites += sites;
    }
    byYear.set(year, entry);
  }

  return [...byYear.entries()]
    .map(([year, { bySector, residentialSites }]) => {
      const total = Object.values(bySector).reduce(
        (sum, value) => sum + value,
        0,
      );
      const residential = bySector.RESIDENTIEL;
      return {
        year,
        total,
        residential,
        residentialSites,
        perResidentialSite:
          residentialSites > 0 ? residential / residentialSites : null,
        bySector,
      };
    })
    .sort((first, second) => first.year - second.year);
};

type YearMetric = "total" | "residential" | "perResidentialSite";

// Variation en pourcentage par rapport à l'année précédente. Null si l'année
// précédente est absente ou nulle.
export const computeYearChange = (
  points: readonly YearPoint[],
  year: number,
  metric: YearMetric,
): number | null => {
  const current = points.find((point) => point.year === year)?.[metric];
  const previous = points.find((point) => point.year === year - 1)?.[metric];
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
};

export type SectorShare = {
  sector: SectorCode;
  mwh: number;
  ratio: number;
};

// Répartition d'une année par grand secteur, du plus consommateur au moins
// consommateur ; les secteurs sans consommation sont omis.
export const buildSectorShares = (point: YearPoint): SectorShare[] =>
  SECTOR_CODES.map((sector) => ({
    sector,
    mwh: point.bySector[sector],
    ratio: point.total === 0 ? 0 : point.bySector[sector] / point.total,
  }))
    .filter(({ mwh }) => mwh > 0)
    .sort((first, second) => second.mwh - first.mwh);

export type IrisRow = {
  code: string;
  name: string;
  mwh: number;
  housing: number;
};

export type IrisConsumption = IrisRow & {
  perHousing: number;
};

// En dessous, la moyenne par logement n'est pas représentative.
export const MIN_HOUSING_FOR_RANKING = 50;

const FICTITIOUS_IRIS_PREFIX = "fictif";

// Classe les quartiers du plus gros au plus petit consommateur par logement.
// Les quartiers « fictifs » (regroupements techniques) et ceux qui comptent trop
// peu de logements sont écartés.
export const rankIris = (rows: readonly IrisRow[]): IrisConsumption[] =>
  rows
    .filter(
      ({ name, housing }) =>
        housing >= MIN_HOUSING_FOR_RANKING &&
        !name.trim().toLowerCase().startsWith(FICTITIOUS_IRIS_PREFIX),
    )
    .map((row) => ({ ...row, perHousing: row.mwh / row.housing }))
    .sort((first, second) => second.perHousing - first.perHousing);

const MWH_PER_GWH = 1000;
const MWH_PER_TWH = 1_000_000;
const GWH_THRESHOLD_IN_MWH = 10_000;

// MWh jusqu'à 10 000, puis GWh, puis TWh : garde des nombres lisibles.
export const formatEnergy = (mwh: number): string => {
  if (mwh >= MWH_PER_TWH) {
    return `${formatDecimal(Number((mwh / MWH_PER_TWH).toFixed(2)))} TWh`;
  }
  if (mwh >= GWH_THRESHOLD_IN_MWH) {
    return `${formatDecimal(Number((mwh / MWH_PER_GWH).toFixed(1)))} GWh`;
  }
  return `${formatInteger(Math.round(mwh))} MWh`;
};

export const formatMwhPerSite = (mwh: number): string =>
  `${formatDecimal(Number(mwh.toFixed(2)))} MWh`;
