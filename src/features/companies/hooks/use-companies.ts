import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { fetchCompanyBySiren, searchCompanies } from "../api/fetch-companies";
import { MIN_QUERY_LENGTH } from "../model/company";
import {
  buildCompanySearch,
  parseCompanyUrlState,
  type CompanyUrlState,
} from "../model/url-state";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export const companyKeys = {
  all: ["companies"] as const,
  search: (query: string, onlyActive: boolean, page: number) =>
    [...companyKeys.all, "search", query, onlyActive, page] as const,
  bySiren: (siren: string | null) =>
    [...companyKeys.all, "siren", siren] as const,
};

type UseCompanySearchParams = {
  query: string;
  onlyActive: boolean;
  page: number;
};

export const useCompanySearch = ({
  query,
  onlyActive,
  page,
}: UseCompanySearchParams) => {
  const trimmedQuery = query.trim();
  const isSearchable = trimmedQuery.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: companyKeys.search(trimmedQuery, onlyActive, page),
    queryFn: isSearchable
      ? ({ signal }) =>
          searchCompanies({ query: trimmedQuery, onlyActive, page, signal })
      : skipToken,
    staleTime: FIVE_MINUTES_IN_MS,
    placeholderData: keepPreviousData,
  });
};

export const useCompanyBySiren = (siren: string | null) =>
  useQuery({
    queryKey: companyKeys.bySiren(siren),
    queryFn:
      siren === null
        ? skipToken
        : ({ signal }) => fetchCompanyBySiren(siren, signal),
    staleTime: FIVE_MINUTES_IN_MS,
  });

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation.
export const useCompanyUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseCompanyUrlState(searchParams));

  const writeState = useCallback((state: CompanyUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildCompanySearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
