import { describe, expect, it } from "vitest";
import { summarizePrices } from "./price-summary";

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
