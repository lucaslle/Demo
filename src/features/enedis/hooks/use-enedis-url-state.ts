import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildElectricitySearch,
  parseElectricityUrlState,
  type ElectricityUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation à chaque changement de sélection.
export const useEnedisUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseElectricityUrlState(searchParams));

  const writeState = useCallback((state: ElectricityUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildElectricitySearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
