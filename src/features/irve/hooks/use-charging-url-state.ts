import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildChargingSearch,
  parseChargingUrlState,
  type ChargingUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis on la
// met à jour sans navigation à chaque mouvement de la carte.
export const useChargingUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseChargingUrlState(searchParams));

  const writeState = useCallback((state: ChargingUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildChargingSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
