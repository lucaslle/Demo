import { describe, expect, it } from "vitest";
import { buildDisplayedStations } from "./displayed-station";
import type { Station } from "./station";

const buildStation = (
  id: number,
  position: { lat: number; lng: number },
  prices: Station["prices"],
): Station => ({
  id,
  position,
  address: `${id} rue de test`,
  postalCode: "75001",
  city: "Paris",
  prices,
});

const price = (amount: number) => ({ amount, updatedAt: null });

const STATIONS: Station[] = [
  buildStation(1, { lat: 48.85, lng: 2.35 }, { e10: price(2.05) }),
  buildStation(2, { lat: 48.86, lng: 2.36 }, { e10: price(1.95) }),
  buildStation(3, { lat: 48.87, lng: 2.37 }, { gazole: price(1.8) }),
  buildStation(4, { lat: 45.76, lng: 4.83 }, { e10: price(1.9) }),
  buildStation(5, { lat: 48.84, lng: 2.34 }, { e10: price(2.2) }),
];

const PARIS_BOUNDS = { south: 48.8, west: 2.3, north: 48.9, east: 2.4 };

describe("buildDisplayedStations", () => {
  it("trie du moins cher au plus cher pour le carburant choisi", () => {
    const displayed = buildDisplayedStations(STATIONS, "e10", PARIS_BOUNDS);

    expect(displayed.map(({ station }) => station.id)).toEqual([2, 1, 5]);
  });

  it("écarte les stations hors de la zone visible ou sans ce carburant", () => {
    const displayed = buildDisplayedStations(STATIONS, "e10", PARIS_BOUNDS);

    const ids = displayed.map(({ station }) => station.id);
    expect(ids).not.toContain(3);
    expect(ids).not.toContain(4);
  });

  it("attribue les paliers relativement aux stations affichées", () => {
    const displayed = buildDisplayedStations(STATIONS, "e10", PARIS_BOUNDS);

    expect(displayed.map(({ tier }) => tier)).toEqual([
      "cheapest",
      "medium",
      "high",
    ]);
  });

  it("garde toutes les stations quand aucune zone n'est fournie", () => {
    expect(buildDisplayedStations(STATIONS, "e10", null)).toHaveLength(4);
  });

  it("renvoie une liste vide quand aucune station ne convient", () => {
    expect(buildDisplayedStations(STATIONS, "gplc", PARIS_BOUNDS)).toEqual([]);
  });
});
