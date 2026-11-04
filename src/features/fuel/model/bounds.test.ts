import { describe, expect, it } from "vitest";
import {
  areBoundsEqual,
  containsBounds,
  isPositionInBounds,
  needsNewFetchArea,
  padAndSnapBounds,
  type Bounds,
} from "./bounds";

const PARIS_VIEWPORT: Bounds = {
  south: 48.84,
  west: 2.31,
  north: 48.88,
  east: 2.39,
};

describe("padAndSnapBounds", () => {
  it("agrandit la zone et l'aligne sur la grille de 0,02°", () => {
    const area = padAndSnapBounds(PARIS_VIEWPORT);

    expect(containsBounds(area, PARIS_VIEWPORT)).toBe(true);
    expect(area).toEqual({ south: 48.82, west: 2.28, north: 48.9, east: 2.42 });
  });

  it("donne la même zone pour deux vues très proches", () => {
    const shifted: Bounds = {
      south: 48.841,
      west: 2.312,
      north: 48.881,
      east: 2.392,
    };

    expect(
      areBoundsEqual(
        padAndSnapBounds(PARIS_VIEWPORT),
        padAndSnapBounds(shifted),
      ),
    ).toBe(true);
  });
});

describe("isPositionInBounds", () => {
  it("détecte les positions à l'intérieur et à l'extérieur", () => {
    expect(isPositionInBounds({ lat: 48.86, lng: 2.35 }, PARIS_VIEWPORT)).toBe(
      true,
    );
    expect(isPositionInBounds({ lat: 45.76, lng: 4.83 }, PARIS_VIEWPORT)).toBe(
      false,
    );
  });
});

describe("needsNewFetchArea", () => {
  const fetchArea = padAndSnapBounds(PARIS_VIEWPORT);

  it("ne recharge pas tant que la vue reste dans la zone chargée", () => {
    expect(needsNewFetchArea(PARIS_VIEWPORT, fetchArea, false)).toBe(false);
  });

  it("recharge quand la vue sort de la zone chargée", () => {
    const farAway: Bounds = { south: 45.7, west: 4.8, north: 45.8, east: 4.9 };

    expect(needsNewFetchArea(farAway, fetchArea, false)).toBe(true);
  });

  it("recharge un zoom net seulement si la liste était tronquée", () => {
    const zoomedIn: Bounds = {
      south: 48.855,
      west: 2.34,
      north: 48.865,
      east: 2.36,
    };

    expect(needsNewFetchArea(zoomedIn, fetchArea, false)).toBe(false);
    expect(needsNewFetchArea(zoomedIn, fetchArea, true)).toBe(true);
  });
});
