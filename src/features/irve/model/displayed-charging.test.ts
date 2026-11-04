import { describe, expect, it } from "vitest";
import type { ChargingStation } from "./charging-station";
import {
  buildDisplayedChargingStations,
  summarizeChargingStations,
} from "./displayed-charging";

const buildStation = (
  id: string,
  maxPowerKw: number | null,
  position = { lat: 48.85, lng: 2.35 },
): ChargingStation => ({
  id,
  name: `Station ${id}`,
  operator: "OP",
  address: "1 rue de test",
  position,
  pointCount: 2,
  maxPowerKw,
  plugs: [],
  isFree: false,
  access: null,
  hours: null,
  updatedAt: null,
});

const BOUNDS = { south: 48.8, west: 2.3, north: 48.9, east: 2.4 };

describe("buildDisplayedChargingStations", () => {
  it("trie les bornes de la plus puissante à la moins puissante", () => {
    const displayed = buildDisplayedChargingStations(
      [buildStation("A", 22), buildStation("B", 150), buildStation("C", null)],
      BOUNDS,
    );

    expect(displayed.map(({ id }) => id)).toEqual(["B", "A", "C"]);
  });

  it("écarte les bornes hors de la zone visible", () => {
    const displayed = buildDisplayedChargingStations(
      [
        buildStation("A", 22),
        buildStation("B", 150, { lat: 45.76, lng: 4.83 }),
      ],
      BOUNDS,
    );

    expect(displayed.map(({ id }) => id)).toEqual(["A"]);
  });

  it("garde toutes les bornes quand aucune zone n'est fournie", () => {
    expect(
      buildDisplayedChargingStations(
        [buildStation("A", 22), buildStation("B", 150, { lat: 0, lng: 0 })],
        null,
      ),
    ).toHaveLength(2);
  });
});

describe("summarizeChargingStations", () => {
  it("renvoie null sans borne", () => {
    expect(summarizeChargingStations([])).toBeNull();
  });

  it("compte les bornes rapides et ultra-rapides et retient la plus puissante", () => {
    const summary = summarizeChargingStations([
      buildStation("B", 150),
      buildStation("A", 50),
      buildStation("C", 22),
    ]);

    expect(summary?.stationCount).toBe(3);
    expect(summary?.fastCount).toBe(2);
    expect(summary?.ultraCount).toBe(1);
    expect(summary?.strongest.id).toBe("B");
  });
});
