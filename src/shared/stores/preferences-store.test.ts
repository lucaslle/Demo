import { beforeEach, describe, expect, it } from "vitest";
import {
  PREFERENCES_STORAGE_KEY,
  THEME_CYCLE,
  usePreferencesStore,
} from "./preferences-store";

beforeEach(() => {
  localStorage.clear();
  usePreferencesStore.setState({ theme: "system", preferredFuel: null });
});

describe("usePreferencesStore", () => {
  it("démarre avec le thème du système et sans carburant favori", () => {
    const { theme, preferredFuel } = usePreferencesStore.getState();

    expect(theme).toBe("system");
    expect(preferredFuel).toBeNull();
  });

  it("enregistre les préférences dans le stockage local", () => {
    usePreferencesStore.getState().setTheme("dark");
    usePreferencesStore.getState().setPreferredFuel("gazole");

    const stored = JSON.parse(
      localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}",
    );
    expect(stored.state).toEqual({ theme: "dark", preferredFuel: "gazole" });
  });

  it("restaure les préférences enregistrées à la réhydratation", async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        state: { theme: "light", preferredFuel: "sp98" },
        version: 0,
      }),
    );

    await usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState().theme).toBe("light");
    expect(usePreferencesStore.getState().preferredFuel).toBe("sp98");
  });
});

describe("THEME_CYCLE", () => {
  it("fait défiler système, clair puis sombre", () => {
    expect(THEME_CYCLE.system).toBe("light");
    expect(THEME_CYCLE.light).toBe("dark");
    expect(THEME_CYCLE.dark).toBe("system");
  });
});
