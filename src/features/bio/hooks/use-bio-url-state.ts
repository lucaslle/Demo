import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildBioSearch,
  parseBioUrlState,
  type BioUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation à chaque mouvement de la carte.
export const useBioUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseBioUrlState(searchParams));

  const writeState = useCallback((state: BioUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildBioSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
