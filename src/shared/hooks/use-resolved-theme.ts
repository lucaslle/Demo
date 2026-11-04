import { useSyncExternalStore } from "react";
import { usePreferencesStore } from "../stores/preferences-store";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const subscribeToSystemScheme = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

const readSystemPrefersDark = () =>
  window.matchMedia(DARK_SCHEME_QUERY).matches;

export const useResolvedTheme = (): "light" | "dark" => {
  const themePreference = usePreferencesStore((state) => state.theme);
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemScheme,
    readSystemPrefersDark,
    () => false,
  );

  if (themePreference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return themePreference;
};
