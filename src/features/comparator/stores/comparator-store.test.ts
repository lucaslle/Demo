import { beforeEach, describe, expect, it } from "vitest";
import {
  COMPARATOR_STORAGE_KEY,
  DEFAULT_SETTINGS,
  useComparatorStore,
} from "./comparator-store";

beforeEach(() => {
  localStorage.clear();
  useComparatorStore.setState(DEFAULT_SETTINGS);
});

describe("useComparatorStore", () => {
  it("démarre avec les hypothèses par défaut", () => {
    const { litersPer100Km, kwhPer100Km, annualKm } =
      useComparatorStore.getState();

    expect({ litersPer100Km, kwhPer100Km, annualKm }).toEqual({
      litersPer100Km: 6.5,
      kwhPer100Km: 17,
      annualKm: 12_000,
    });
  });

  it("mémorise les changements dans le stockage local", () => {
    useComparatorStore.getState().update({ annualKm: 20_000, fuel: "gazole" });

    const stored = JSON.parse(
      localStorage.getItem(COMPARATOR_STORAGE_KEY) ?? "{}",
    );
    expect(stored.state).toMatchObject({ annualKm: 20_000, fuel: "gazole" });
  });

  it("restaure des réglages valides à la réhydratation", async () => {
    localStorage.setItem(
      COMPARATOR_STORAGE_KEY,
      JSON.stringify({
        state: { ...DEFAULT_SETTINGS, annualKm: 8_000, fuel: "sp98" },
        version: 0,
      }),
    );

    await useComparatorStore.persist.rehydrate();

    expect(useComparatorStore.getState().annualKm).toBe(8_000);
    expect(useComparatorStore.getState().fuel).toBe("sp98");
  });

  it("ignore des réglages altérés et garde les valeurs par défaut", async () => {
    localStorage.setItem(
      COMPARATOR_STORAGE_KEY,
      JSON.stringify({
        state: { ...DEFAULT_SETTINGS, annualKm: -5, fuel: "kerosene" },
        version: 0,
      }),
    );

    await useComparatorStore.persist.rehydrate();

    expect(useComparatorStore.getState().annualKm).toBe(12_000);
    expect(useComparatorStore.getState().fuel).toBe("e10");
  });

  it("revient aux hypothèses par défaut sur demande", () => {
    useComparatorStore.getState().update({ annualKm: 30_000 });

    useComparatorStore.getState().reset();

    expect(useComparatorStore.getState().annualKm).toBe(12_000);
  });
});
