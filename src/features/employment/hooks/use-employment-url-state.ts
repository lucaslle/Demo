import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildEmploymentSearch,
  parseEmploymentUrlState,
  type EmploymentUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation à chaque changement de sélection.
export const useEmploymentUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseEmploymentUrlState(searchParams));

  const writeState = useCallback((state: EmploymentUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildEmploymentSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
