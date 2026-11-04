import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vehicleSchema, type Vehicle } from "../lib/vehicle";

export type ThemePreference = "system" | "light" | "dark";

export const PREFERENCES_STORAGE_KEY = "autour-de-moi-preferences";

type PreferencesState = {
  theme: ThemePreference;
  preferredFuel: string | null;
  vehicle: Vehicle | null;
  setTheme: (theme: ThemePreference) => void;
  setPreferredFuel: (fuel: string) => void;
  setVehicle: (vehicle: Vehicle | null) => void;
};

// Le stockage local est modifiable par l'utilisateur ou par une ancienne
// version : chaque champ est validé séparément, un champ invalide retombe sur
// sa valeur par défaut sans écarter les autres.
const persistedPreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).catch("system"),
  preferredFuel: z.string().nullable().catch(null),
  vehicle: vehicleSchema.nullable().catch(null),
});

// La réhydratation est déclenchée côté client (PreferencesSync) pour que le
// premier rendu corresponde au HTML pré-généré.
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      preferredFuel: null,
      vehicle: null,
      setTheme: (theme) => set({ theme }),
      setPreferredFuel: (preferredFuel) => set({ preferredFuel }),
      setVehicle: (vehicle) => set({ vehicle }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      skipHydration: true,
      partialize: ({ theme, preferredFuel, vehicle }) => ({
        theme,
        preferredFuel,
        vehicle,
      }),
      merge: (persistedState, currentState) => {
        const parsed = persistedPreferencesSchema.safeParse(persistedState);
        return parsed.success
          ? { ...currentState, ...parsed.data }
          : currentState;
      },
    },
  ),
);

export const THEME_CYCLE: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};
