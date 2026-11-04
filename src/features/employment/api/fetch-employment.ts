import { fetchJson } from "@/shared/api/http-client";
import { recordsResponseSchema } from "@/shared/api/records-response";
import {
  FRANCE_CODE,
  findTerritory,
  type Territory,
} from "../model/territories";
import type { QuarterPoint, Sector, SectorShare } from "../model/employment";
import {
  parseQuarterRows,
  parseSectorRows,
  QUARTER_GROUP_BY,
  QUARTER_SELECT,
  SECTOR_SELECT,
} from "../schemas/employment-rows";

// Données ouvertes Urssaf (Open Database License) : effectifs salariés et
// masse salariale trimestriels du secteur privé, par département × grand secteur.
const DATASET_URL =
  "https://open.urssaf.fr/api/explore/v2.1/catalog/datasets/effectifs-salaries-et-masse-salariale-du-secteur-prive-par-departement-x-grand-s/records";

// 100 trimestres = 25 ans d'historique, la limite d'une page de l'API.
export const QUARTERS_TO_FETCH = 100;

const DEPARTMENT_CODE_PATTERN = /^(\d{2}|2A|2B|97[1-4])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type Scope = {
  territory: Territory;
  sector: Sector | null;
};

// Les valeurs insérées dans le filtre sont vérifiées : un code de département
// doit ressembler à un code, et un secteur vient d'une liste fermée.
const buildScopeConditions = ({ territory, sector }: Scope): string[] => {
  const conditions: string[] = [];
  if (territory.code !== FRANCE_CODE) {
    if (
      !DEPARTMENT_CODE_PATTERN.test(territory.code) ||
      findTerritory(territory.code) === undefined
    ) {
      throw new Error(`Code de département invalide : ${territory.code}`);
    }
    conditions.push(`code_departement = "${territory.code}"`);
  }
  if (sector !== null) {
    conditions.push(`grand_secteur_d_activite = "${sector.value}"`);
  }
  return conditions;
};

const buildUrl = (params: Record<string, string>): string =>
  `${DATASET_URL}?${new URLSearchParams(params).toString()}`;

type FetchSeriesParams = Scope & { signal?: AbortSignal };

export const fetchEmploymentSeries = async ({
  territory,
  sector,
  signal,
}: FetchSeriesParams): Promise<QuarterPoint[]> => {
  const conditions = buildScopeConditions({ territory, sector });
  const response = await fetchJson(
    buildUrl({
      select: QUARTER_SELECT,
      group_by: QUARTER_GROUP_BY,
      order_by: "dernier_jour_du_trimestre desc",
      limit: String(QUARTERS_TO_FETCH),
      ...(conditions.length > 0 ? { where: conditions.join(" and ") } : {}),
    }),
    recordsResponseSchema,
    { signal },
  );
  return parseQuarterRows(response.results);
};

type FetchBreakdownParams = {
  territory: Territory;
  // Dernier jour du trimestre, AAAA-MM-JJ.
  date: string;
  signal?: AbortSignal;
};

// Répartition par grand secteur d'un trimestre donné (tous secteurs confondus
// dans le filtre : on n'applique donc pas de secteur ici).
export const fetchSectorBreakdown = async ({
  territory,
  date,
  signal,
}: FetchBreakdownParams): Promise<SectorShare[]> => {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Date invalide : ${date}`);
  }
  const conditions = [
    ...buildScopeConditions({ territory, sector: null }),
    `dernier_jour_du_trimestre = date'${date}'`,
  ];
  const response = await fetchJson(
    buildUrl({
      select: SECTOR_SELECT,
      group_by: "grand_secteur_d_activite",
      order_by: "e desc",
      limit: "20",
      where: conditions.join(" and "),
    }),
    recordsResponseSchema,
    { signal },
  );
  return parseSectorRows(response.results);
};
