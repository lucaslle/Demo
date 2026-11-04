import { describe, expect, it } from "vitest";
import { buildPriceHistogram } from "./price-histogram";

describe("buildPriceHistogram", () => {
  it("renvoie une liste vide sans prix", () => {
    expect(buildPriceHistogram([])).toEqual([]);
  });

  it("compte chaque prix dans une classe, extrêmes compris", () => {
    const bins = buildPriceHistogram([1.9, 1.95, 2.0, 2.1], 4);

    expect(bins).toHaveLength(4);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(4);
    expect(bins[0]?.count).toBe(1);
    expect(bins[3]?.count).toBe(1);
  });

  it("repère la classe du prix le plus bas", () => {
    const bins = buildPriceHistogram([1.9, 2.0, 2.1], 3);

    expect(bins.map((bin) => bin.containsLowest)).toEqual([true, false, false]);
  });

  it("met tous les prix identiques dans la première classe", () => {
    const bins = buildPriceHistogram([2, 2, 2], 3);

    expect(bins.map((bin) => bin.count)).toEqual([3, 0, 0]);
  });
});
