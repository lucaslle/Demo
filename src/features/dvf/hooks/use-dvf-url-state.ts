import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildDvfSearch,
  parseDvfUrlState,
  type DvfUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation à chaque mouvement de la carte.
export const useDvfUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseDvfUrlState(searchParams));

  const writeState = useCallback((state: DvfUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildDvfSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
