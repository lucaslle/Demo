import { beforeEach, describe, expect, it } from "vitest";
import {
  PREFERENCES_STORAGE_KEY,
  THEME_CYCLE,
  usePreferencesStore,
} from "./preferences-store";

beforeEach(() => {
  localStorage.clear();
  usePreferencesStore.setState({
    theme: "system",
    preferredFuel: null,
    vehicle: null,
  });
});

const storeSavedState = (state: unknown) =>
  localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({ state, version: 0 }),
  );

describe("usePreferencesStore", () => {
  it("démarre avec le thème du système, sans carburant favori ni véhicule", () => {
    const { theme, preferredFuel, vehicle } = usePreferencesStore.getState();

    expect(theme).toBe("system");
    expect(preferredFuel).toBeNull();
    expect(vehicle).toBeNull();
  });

  it("enregistre les préférences dans le stockage local", () => {
    usePreferencesStore.getState().setTheme("dark");
    usePreferencesStore.getState().setPreferredFuel("gazole");
    usePreferencesStore
      .getState()
      .setVehicle({ label: "Renault Clio V", tankLiters: 42 });

    const stored = JSON.parse(
      localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}",
    );
    expect(stored.state).toEqual({
      theme: "dark",
      preferredFuel: "gazole",
      vehicle: { label: "Renault Clio V", tankLiters: 42 },
    });
  });

  it("restaure les préférences enregistrées à la réhydratation", async () => {
    storeSavedState({
      theme: "light",
      preferredFuel: "sp98",
      vehicle: { label: "Dacia Sandero", tankLiters: 50 },
    });

    await usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.theme).toBe("light");
    expect(state.preferredFuel).toBe("sp98");
    expect(state.vehicle).toEqual({ label: "Dacia Sandero", tankLiters: 50 });
  });

  it("écarte un véhicule invalide sans perdre les autres préférences", async () => {
    storeSavedState({
      theme: "dark",
      preferredFuel: "gazole",
      vehicle: { label: "Camion", tankLiters: 9000 },
    });

    await usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.vehicle).toBeNull();
    expect(state.theme).toBe("dark");
    expect(state.preferredFuel).toBe("gazole");
  });

  it("accepte l'ancien format enregistré sans véhicule", async () => {
    storeSavedState({ theme: "light", preferredFuel: "e10" });

    await usePreferencesStore.persist.rehydrate();

    const state = usePreferencesStore.getState();
    expect(state.theme).toBe("light");
    expect(state.vehicle).toBeNull();
  });

  it("retombe sur un thème par défaut quand la valeur est inconnue", async () => {
    storeSavedState({ theme: "violet", preferredFuel: null, vehicle: null });

    await usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState().theme).toBe("system");
  });
});

describe("THEME_CYCLE", () => {
  it("fait défiler système, clair puis sombre", () => {
    expect(THEME_CYCLE.system).toBe("light");
    expect(THEME_CYCLE.light).toBe("dark");
    expect(THEME_CYCLE.dark).toBe("system");
  });
});
