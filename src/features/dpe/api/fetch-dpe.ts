import { fetchJson } from "@/shared/api/http-client";
import { isCommuneCode } from "@/features/places/model/place";
import type { DpeSummary, Kind, Parc } from "../model/dpe";
import {
  metricAggSchema,
  parseAverageConsumption,
  parseLabelCounts,
  parseLastDate,
  parsePeriodCounts,
  valuesAggSchema,
} from "../schemas/aggregations";

// Données ouvertes de l'ADEME (data-fair) : gratuites, sans clé, CORS ouvert.
const BASE_URL = "https://data.ademe.fr/data-fair/api/v1/datasets";

type DatasetConfig = {
  id: string;
  consumptionField: string;
  // Champ de période de construction (logements seulement).
  periodField: string | null;
};

const DATASETS: Record<Parc, DatasetConfig> = {
  logements: {
    id: "meg-83tjwtg8dyz4vv7h1dqe",
    consumptionField: "conso_5_usages_par_m2_ep",
    periodField: "periode_construction",
  },
  tertiaire: {
    id: "j9ol0fwjqckyf49vr29nknbu",
    consumptionField: "conso_kwhep_m2_an",
    periodField: null,
  },
};

const LABEL_FIELDS: Record<Kind, string> = {
  dpe: "etiquette_dpe",
  ges: "etiquette_ges",
};

const DATE_FIELD = "date_etablissement_dpe";
const MAX_BUCKETS = "20";

// Le code est vérifié avant d'être inséré dans la requête de filtre.
const buildCommuneFilter = (communeCode: string): string => {
  if (!isCommuneCode(communeCode)) {
    throw new Error(`Code de commune invalide : ${communeCode}`);
  }
  return `code_insee_ban:"${communeCode}"`;
};

type UrlParams = {
  communeCode: string;
  parc: Parc;
};

const buildUrl = (
  { parc }: UrlParams,
  endpoint: "values_agg" | "metric_agg",
  params: Record<string, string>,
): string =>
  `${BASE_URL}/${DATASETS[parc].id}/${endpoint}?${new URLSearchParams(params).toString()}`;

// `size=0` évite que chaque regroupement renvoie des lignes de diagnostics :
// seuls les comptes et la moyenne sont demandés, jamais une adresse.
export const buildLabelsUrl = (
  { communeCode, parc }: UrlParams,
  kind: Kind,
): string =>
  buildUrl({ communeCode, parc }, "values_agg", {
    field: LABEL_FIELDS[kind],
    qs: buildCommuneFilter(communeCode),
    agg_size: MAX_BUCKETS,
    size: "0",
    metric: "avg",
    metric_field: DATASETS[parc].consumptionField,
  });

export const buildPeriodsUrl = ({
  communeCode,
  parc,
}: UrlParams): string | null => {
  const periodField = DATASETS[parc].periodField;
  return periodField === null
    ? null
    : buildUrl({ communeCode, parc }, "values_agg", {
        field: periodField,
        qs: buildCommuneFilter(communeCode),
        agg_size: MAX_BUCKETS,
        size: "0",
      });
};

export const buildLastDateUrl = ({ communeCode, parc }: UrlParams): string =>
  buildUrl({ communeCode, parc }, "metric_agg", {
    field: DATE_FIELD,
    metric: "max",
    qs: buildCommuneFilter(communeCode),
  });

type FetchDpeSummaryParams = UrlParams & {
  kind: Kind;
  signal?: AbortSignal;
};

export const fetchDpeSummary = async ({
  communeCode,
  parc,
  kind,
  signal,
}: FetchDpeSummaryParams): Promise<DpeSummary> => {
  const scope = { communeCode, parc };
  const periodsUrl = buildPeriodsUrl(scope);

  const [labels, periods, lastDate] = await Promise.all([
    fetchJson(buildLabelsUrl(scope, kind), valuesAggSchema, { signal }),
    periodsUrl === null
      ? Promise.resolve(null)
      : fetchJson(periodsUrl, valuesAggSchema, { signal }),
    fetchJson(buildLastDateUrl(scope), metricAggSchema, { signal }),
  ]);

  return {
    total: labels.total,
    counts: parseLabelCounts(labels.aggs),
    averageConsumption: parseAverageConsumption(labels.aggs),
    lastDiagnosticDate: parseLastDate(lastDate.metric),
    periods: periods === null ? [] : parsePeriodCounts(periods.aggs),
  };
};
