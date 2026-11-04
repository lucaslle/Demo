import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { fetchDpeSummary } from "../api/fetch-dpe";
import type { Kind, Parc } from "../model/dpe";
import {
  buildDpeSearch,
  parseDpeUrlState,
  type DpeUrlState,
} from "../model/url-state";

// Les diagnostics s'ajoutent chaque jour, mais les répartitions bougent peu.
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

export const dpeKeys = {
  all: ["dpe"] as const,
  summary: (communeCode: string | null, parc: Parc, kind: Kind) =>
    [...dpeKeys.all, "summary", communeCode, parc, kind] as const,
};

export const useDpeSummary = (
  communeCode: string | null,
  parc: Parc,
  kind: Kind,
) =>
  useQuery({
    queryKey: dpeKeys.summary(communeCode, parc, kind),
    queryFn:
      communeCode === null
        ? skipToken
        : ({ signal }) => fetchDpeSummary({ communeCode, parc, kind, signal }),
    staleTime: SIX_HOURS_IN_MS,
    placeholderData: keepPreviousData,
  });

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation.
export const useDpeUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseDpeUrlState(searchParams));

  const writeState = useCallback((state: DpeUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildDpeSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
