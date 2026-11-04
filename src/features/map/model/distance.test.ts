import { describe, expect, it } from "vitest";
import { distanceInKm } from "./distance";

describe("distanceInKm", () => {
  it("vaut zéro entre un point et lui-même", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };

    expect(distanceInKm(paris, paris)).toBe(0);
  });

  it("donne la distance Paris – Lyon à quelques kilomètres près", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const lyon = { lat: 45.764, lng: 4.8357 };

    expect(distanceInKm(paris, lyon)).toBeCloseTo(392, -1);
  });

  it("est symétrique", () => {
    const a = { lat: 43.2965, lng: 5.3698 };
    const b = { lat: 50.6292, lng: 3.0573 };

    expect(distanceInKm(a, b)).toBeCloseTo(distanceInKm(b, a), 10);
  });
});
