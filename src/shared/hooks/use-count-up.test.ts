import { describe, expect, it } from "vitest";
import { interpolateCountUp } from "./use-count-up";

describe("interpolateCountUp", () => {
  it("part de zéro et arrive exactement à la valeur cible", () => {
    expect(interpolateCountUp(1.99, 0)).toBe(0);
    expect(interpolateCountUp(1.99, 1)).toBeCloseTo(1.99, 10);
  });

  it("ralentit en fin de course", () => {
    const firstHalf = interpolateCountUp(100, 0.5) - interpolateCountUp(100, 0);
    const secondHalf =
      interpolateCountUp(100, 1) - interpolateCountUp(100, 0.5);

    expect(firstHalf).toBeGreaterThan(secondHalf);
  });

  it("borne la progression entre 0 et 1", () => {
    expect(interpolateCountUp(10, -1)).toBe(0);
    expect(interpolateCountUp(10, 3)).toBeCloseTo(10, 10);
  });
});
