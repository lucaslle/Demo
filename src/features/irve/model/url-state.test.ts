import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW } from "@/features/map/model/map-view-url";
import { buildChargingSearch, parseChargingUrlState } from "./url-state";

const parse = (search: string) =>
  parseChargingUrlState(new URLSearchParams(search));

describe("parseChargingUrlState", () => {
  it("lit la position, le zoom et le filtre de puissance", () => {
    expect(parse("?lat=45.76&lng=4.83&z=14&puissance=fast")).toEqual({
      view: { lat: 45.76, lng: 4.83, zoom: 14 },
      powerFilter: "fast",
    });
  });

  it("revient aux valeurs par défaut quand l'URL est vide ou invalide", () => {
    expect(parse("")).toEqual({ view: DEFAULT_VIEW, powerFilter: "all" });
    expect(parse("?puissance=turbo").powerFilter).toBe("all");
  });
});

describe("buildChargingSearch", () => {
  it("produit une query string relue à l'identique", () => {
    const state = {
      view: { lat: 45.76, lng: 4.83, zoom: 14 },
      powerFilter: "ultra" as const,
    };

    expect(buildChargingSearch(state)).toBe(
      "?lat=45.76000&lng=4.83000&z=14&puissance=ultra",
    );
    expect(parse(buildChargingSearch(state))).toEqual(state);
  });
});
