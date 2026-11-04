import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buildFuelSearch,
  parseFuelUrlState,
  type FuelUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable) ; ensuite on
// la met à jour sans navigation pour ne pas recréer la page à chaque mouvement.
export const useFuelUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseFuelUrlState(searchParams));

  const writeState = useCallback((state: FuelUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildFuelSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
