"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "../stores/preferences-store";

// Restaure les préférences enregistrées et applique le thème choisi à <html>.
export const PreferencesSync = () => {
  const theme = usePreferencesStore((state) => state.theme);

  useEffect(() => {
    void usePreferencesStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return null;
};
