import { describe, expect, it } from "vitest";
import { computeFullTankSavings, summarizePrices } from "./price-summary";

describe("computeFullTankSavings", () => {
  it("multiplie l'écart à la moyenne par la contenance du réservoir", () => {
    const summary = { lowest: 1.9, average: 1.98, highest: 2.1, spread: 0.2 };

    expect(computeFullTankSavings(summary)).toBeCloseTo(4, 10);
    expect(computeFullTankSavings(summary, 40)).toBeCloseTo(3.2, 10);
  });

  it("ne donne aucune économie quand tous les prix sont identiques", () => {
    const summary = { lowest: 2, average: 2, highest: 2, spread: 0 };

    expect(computeFullTankSavings(summary)).toBe(0);
  });
});

describe("summarizePrices", () => {
  it("renvoie null sans prix", () => {
    expect(summarizePrices([])).toBeNull();
  });

  it("calcule le minimum, la moyenne, le maximum et l'écart", () => {
    const summary = summarizePrices([1.9, 2.0, 2.2]);

    expect(summary?.lowest).toBe(1.9);
    expect(summary?.highest).toBe(2.2);
    expect(summary?.average).toBeCloseTo(2.0333, 4);
    expect(summary?.spread).toBeCloseTo(0.3, 10);
  });

  it("gère un prix unique", () => {
    expect(summarizePrices([1.95])).toEqual({
      lowest: 1.95,
      average: 1.95,
      highest: 1.95,
      spread: 0,
    });
  });
});
