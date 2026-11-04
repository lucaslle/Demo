import { describe, expect, it } from "vitest";
import { buildFuelSearch, DEFAULT_VIEW, parseFuelUrlState } from "./url-state";

const parse = (search: string) =>
  parseFuelUrlState(new URLSearchParams(search));

describe("parseFuelUrlState", () => {
  it("lit la position, le zoom et le carburant", () => {
    expect(parse("?lat=45.76&lng=4.83&z=14&carburant=gazole")).toEqual({
      view: { lat: 45.76, lng: 4.83, zoom: 14 },
      fuel: "gazole",
    });
  });

  it("revient aux valeurs par défaut quand l'URL est vide", () => {
    expect(parse("")).toEqual({ view: DEFAULT_VIEW, fuel: "e10" });
  });

  it("ignore les valeurs invalides ou hors limites", () => {
    expect(parse("?lat=abc&lng=999&z=40&carburant=kerosene")).toEqual({
      view: DEFAULT_VIEW,
      fuel: "e10",
    });
  });

  it("utilise le carburant de repli quand l'URL n'en précise pas", () => {
    expect(parseFuelUrlState(new URLSearchParams(""), "gazole").fuel).toBe(
      "gazole",
    );
    expect(
      parseFuelUrlState(new URLSearchParams("?carburant=sp98"), "gazole").fuel,
    ).toBe("sp98");
  });

  it("ignore les paramètres vides", () => {
    expect(parse("?lat=&lng=&z=").view).toEqual(DEFAULT_VIEW);
  });
});

describe("buildFuelSearch", () => {
  it("produit une query string relue à l'identique", () => {
    const state = {
      view: { lat: 45.76, lng: 4.83, zoom: 14 },
      fuel: "sp98" as const,
    };

    expect(buildFuelSearch(state)).toBe(
      "?lat=45.76000&lng=4.83000&z=14&carburant=sp98",
    );
    expect(parse(buildFuelSearch(state))).toEqual(state);
  });
});
