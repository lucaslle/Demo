import { describe, expect, it } from "vitest";
import type { Sale } from "./sale";
import { getPriceTier, summarizePricePerSqm } from "./sale-stats";

const buildSale = (pricePerSqm: number | null): Sale => ({
  id: String(pricePerSqm),
  date: "2025-01-01",
  price: 100_000,
  builtSurface: 50,
  landSurface: null,
  pricePerSqm,
  typeCode: "121",
  typeLabel: "UN APPARTEMENT",
  nature: "Vente",
  isOffPlan: false,
  lotCount: 1,
  parcel: null,
  position: { lat: 44.84, lng: -0.58 },
});

describe("summarizePricePerSqm", () => {
  it("renvoie null sans vente exploitable", () => {
    expect(summarizePricePerSqm([])).toBeNull();
    expect(summarizePricePerSqm([buildSale(null)])).toBeNull();
  });

  it("calcule la médiane et les quartiles en ignorant les ventes sans prix au m²", () => {
    const stats = summarizePricePerSqm([
      buildSale(5000),
      buildSale(null),
      buildSale(3000),
      buildSale(4000),
      buildSale(6000),
      buildSale(7000),
    ]);

    expect(stats).toEqual({
      count: 5,
      median: 5000,
      lowerQuartile: 4000,
      upperQuartile: 6000,
    });
  });

  it("interpole quand le nombre de ventes est pair", () => {
    const stats = summarizePricePerSqm([buildSale(4000), buildSale(6000)]);

    expect(stats?.median).toBe(5000);
    expect(stats?.lowerQuartile).toBe(4500);
    expect(stats?.upperQuartile).toBe(5500);
  });

  it("gère une vente unique", () => {
    expect(summarizePricePerSqm([buildSale(4200)])).toEqual({
      count: 1,
      median: 4200,
      lowerQuartile: 4200,
      upperQuartile: 4200,
    });
  });
});

describe("getPriceTier", () => {
  it("situe le prix par rapport à la médiane, à 15 % près", () => {
    expect(getPriceTier(4000, 5000)).toBe("low");
    expect(getPriceTier(5000, 5000)).toBe("mid");
    expect(getPriceTier(5700, 5000)).toBe("mid");
    expect(getPriceTier(6000, 5000)).toBe("high");
  });

  it("reste inconnu sans prix au m² ou sans médiane", () => {
    expect(getPriceTier(null, 5000)).toBe("unknown");
    expect(getPriceTier(5000, null)).toBe("unknown");
  });
});
