"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  THEME_CYCLE,
  usePreferencesStore,
  type ThemePreference,
} from "../stores/preferences-store";
import styles from "./theme-toggle.module.css";

const THEME_ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "automatique",
  light: "clair",
  dark: "sombre",
};

const subscribeToNothing = () => () => {};

export const ThemeToggle = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  // Le HTML pré-généré ne connaît pas la préférence : on affiche l'icône
  // « automatique » jusqu'à l'hydratation pour éviter un écart de rendu.
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const visibleTheme = isClient ? theme : "system";
  const Icon = THEME_ICONS[visibleTheme];

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setTheme(THEME_CYCLE[theme])}
      aria-label={`Thème ${THEME_LABELS[visibleTheme]}. Changer de thème`}
      title={`Thème ${THEME_LABELS[visibleTheme]}`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
};
