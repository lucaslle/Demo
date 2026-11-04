import { isCommuneCode } from "@/features/places/model/place";
import { fetchJson } from "@/shared/api/http-client";
import { recordsResponseSchema } from "@/shared/api/records-response";
import type { IrisRow, SectorYearRow } from "../model/electricity";
import { isYear } from "../model/url-state";
import {
  IRIS_GROUP_BY,
  IRIS_SELECT,
  parseIrisRows,
  parseSectorRows,
  SECTOR_GROUP_BY,
  SECTOR_SELECT,
} from "../schemas/enedis-rows";

// Open data d'Enedis (Opendatasoft) : gratuit, sans clé, CORS ouvert. Le domaine
// data.enedis.fr redirige désormais vers opendata.enedis.fr.
const DATASETS_URL =
  "https://opendata.enedis.fr/api/explore/v2.1/catalog/datasets";
const SECTOR_DATASET = "consommation-electrique-par-secteur-dactivite-commune";
const RESIDENTIAL_DATASET = "consommation-annuelle-residentielle-par-adresse";

// 15 années × 6 secteurs tiennent dans une page de 100 lignes.
const SECTOR_ROWS_LIMIT = 100;
// Limite d'une page de l'API : les plus gros quartiers d'abord.
export const IRIS_ROWS_LIMIT = 100;

const YEAR_PATTERN = /^\d{4}$/;

// Les valeurs insérées dans le filtre sont vérifiées : un code de commune doit
// ressembler à un code INSEE et une année à quatre chiffres.
const assertCommuneCode = (communeCode: string): void => {
  if (!isCommuneCode(communeCode)) {
    throw new Error(`Code de commune invalide : ${communeCode}`);
  }
};

const assertYear = (year: number): void => {
  if (!YEAR_PATTERN.test(String(year)) || !isYear(year)) {
    throw new Error(`Année invalide : ${year}`);
  }
};

const buildUrl = (dataset: string, params: Record<string, string>): string =>
  `${DATASETS_URL}/${dataset}/records?${new URLSearchParams(params).toString()}`;

export const buildSectorUrl = (communeCode: string): string => {
  assertCommuneCode(communeCode);
  return buildUrl(SECTOR_DATASET, {
    select: SECTOR_SELECT,
    group_by: SECTOR_GROUP_BY,
    where: `code_commune = "${communeCode}"`,
    order_by: "annee desc",
    limit: String(SECTOR_ROWS_LIMIT),
  });
};

export const buildIrisUrl = (communeCode: string, year: number): string => {
  assertCommuneCode(communeCode);
  assertYear(year);
  return buildUrl(RESIDENTIAL_DATASET, {
    select: IRIS_SELECT,
    group_by: IRIS_GROUP_BY,
    where: `code_commune = "${communeCode}" and annee = "${year}"`,
    order_by: "mwh desc",
    limit: String(IRIS_ROWS_LIMIT),
  });
};

export const fetchSectorSeries = async (
  communeCode: string,
  signal?: AbortSignal,
): Promise<SectorYearRow[]> => {
  const response = await fetchJson(
    buildSectorUrl(communeCode),
    recordsResponseSchema,
    { signal },
  );
  return parseSectorRows(response.results);
};

export type IrisConsumptions = {
  rows: IrisRow[];
  // Nombre total de quartiers de la commune ; plus grand que `rows` quand la
  // commune en compte plus que la limite d'une page.
  totalCount: number;
};

export const fetchIrisConsumption = async (
  communeCode: string,
  year: number,
  signal?: AbortSignal,
): Promise<IrisConsumptions> => {
  const response = await fetchJson(
    buildIrisUrl(communeCode, year),
    recordsResponseSchema,
    { signal },
  );
  return {
    rows: parseIrisRows(response.results),
    totalCount: response.total_count,
  };
};
