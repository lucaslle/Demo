import { fetchJson } from "@/shared/api/http-client";
import {
  COMPANY_PAGE_SIZE,
  isSiren,
  MIN_QUERY_LENGTH,
  type Company,
} from "../model/company";
import {
  companiesResponseSchema,
  parseCompanyRecords,
} from "../schemas/company-record";

// API Recherche d'entreprises (DINUM) : gratuite, sans clé, CORS ouvert.
const SEARCH_URL = "https://recherche-entreprises.api.gouv.fr/search";

// Au-delà, l'API refuse la page : on borne la pagination.
export const MAX_PAGES = 400;

export type CompaniesPage = {
  companies: Company[];
  totalResults: number;
  totalPages: number;
  page: number;
};

type SearchCompaniesParams = {
  query: string;
  onlyActive: boolean;
  page: number;
  signal?: AbortSignal;
};

export const searchCompanies = async ({
  query,
  onlyActive,
  page,
  signal,
}: SearchCompaniesParams): Promise<CompaniesPage> => {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    return { companies: [], totalResults: 0, totalPages: 0, page: 1 };
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    page: String(Math.min(Math.max(1, page), MAX_PAGES)),
    per_page: String(COMPANY_PAGE_SIZE),
  });
  if (onlyActive) {
    params.set("etat_administratif", "A");
  }

  const response = await fetchJson(
    `${SEARCH_URL}?${params.toString()}`,
    companiesResponseSchema,
    { signal },
  );

  return {
    companies: parseCompanyRecords(response.results),
    totalResults: response.total_results,
    totalPages: Math.min(response.total_pages, MAX_PAGES),
    page: response.page,
  };
};

// Fiche d'une entreprise connue par son SIREN (lien partagé, rechargement).
export const fetchCompanyBySiren = async (
  siren: string,
  signal?: AbortSignal,
): Promise<Company | null> => {
  if (!isSiren(siren)) {
    return null;
  }
  const response = await fetchJson(
    `${SEARCH_URL}?${new URLSearchParams({ q: siren, per_page: "1" }).toString()}`,
    companiesResponseSchema,
    { signal },
  );
  return (
    parseCompanyRecords(response.results).find(
      (company) => company.siren === siren,
    ) ?? null
  );
};
