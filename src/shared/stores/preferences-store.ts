import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

export const PREFERENCES_STORAGE_KEY = "autour-de-moi-preferences";

type PreferencesState = {
  theme: ThemePreference;
  preferredFuel: string | null;
  setTheme: (theme: ThemePreference) => void;
  setPreferredFuel: (fuel: string) => void;
};

// La réhydratation est déclenchée côté client (PreferencesSync) pour que le
// premier rendu corresponde au HTML pré-généré.
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      preferredFuel: null,
      setTheme: (theme) => set({ theme }),
      setPreferredFuel: (preferredFuel) => set({ preferredFuel }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      skipHydration: true,
      partialize: ({ theme, preferredFuel }) => ({ theme, preferredFuel }),
    },
  ),
);

export const THEME_CYCLE: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};
