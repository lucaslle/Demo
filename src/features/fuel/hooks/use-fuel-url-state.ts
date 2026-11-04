import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { usePreferencesStore } from "@/shared/stores/preferences-store";
import { DEFAULT_FUEL, isFuelType } from "../model/fuel-types";
import {
  buildFuelSearch,
  parseFuelUrlState,
  type FuelUrlState,
} from "../model/url-state";

// L'URL est la source de vérité au chargement (lien partageable), puis le
// carburant favori enregistré ; ensuite on met l'URL à jour sans navigation
// pour ne pas recréer la page à chaque mouvement de la carte.
export const useFuelUrlState = () => {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => {
    const { preferredFuel } = usePreferencesStore.getState();
    const fallbackFuel = isFuelType(preferredFuel)
      ? preferredFuel
      : DEFAULT_FUEL;
    return parseFuelUrlState(searchParams, fallbackFuel);
  });

  const writeState = useCallback((state: FuelUrlState) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${buildFuelSearch(state)}`,
    );
  }, []);

  return { initialState, writeState };
};
