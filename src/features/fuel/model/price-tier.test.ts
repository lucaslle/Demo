import { describe, expect, it } from "vitest";
import { getPriceRange, getPriceTier } from "./price-tier";

describe("getPriceRange", () => {
  it("renvoie null sans prix", () => {
    expect(getPriceRange([])).toBeNull();
  });

  it("renvoie le minimum et le maximum", () => {
    expect(getPriceRange([2.05, 1.9, 2.2])).toEqual({ min: 1.9, max: 2.2 });
  });
});

describe("getPriceTier", () => {
  const range = { min: 1.9, max: 2.2 };

  it("distingue la station la moins chère", () => {
    expect(getPriceTier(1.9, range)).toBe("cheapest");
  });

  it("répartit les autres prix en trois paliers", () => {
    expect(getPriceTier(1.95, range)).toBe("low");
    expect(getPriceTier(2.05, range)).toBe("medium");
    expect(getPriceTier(2.2, range)).toBe("high");
  });

  it("traite des prix tous identiques comme les moins chers", () => {
    expect(getPriceTier(2, { min: 2, max: 2 })).toBe("cheapest");
  });
});
