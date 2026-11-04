import { describe, expect, it } from "vitest";
import { buildDvfSearch, parseDvfUrlState } from "./url-state";

const parse = (search: string) => parseDvfUrlState(new URLSearchParams(search));

describe("parseDvfUrlState", () => {
  it("lit la vue, le type de bien et la période", () => {
    expect(parse("?lat=44.84&lng=-0.58&z=17&bien=houses&periode=5")).toEqual({
      view: { lat: 44.84, lng: -0.58, zoom: 17 },
      property: "houses",
      years: 5,
    });
  });

  it("ouvre assez près pour interroger les ventes quand le zoom manque", () => {
    expect(parse("").view.zoom).toBe(16);
    expect(parse("?z=13").view.zoom).toBe(13);
  });

  it("revient aux valeurs par défaut quand l'URL est invalide", () => {
    const state = parse("?bien=terrains&periode=2");

    expect(state.property).toBe("apartments");
    expect(state.years).toBe(3);
  });
});

describe("buildDvfSearch", () => {
  it("produit une query string relue à l'identique", () => {
    const state = {
      view: { lat: 44.84, lng: -0.58, zoom: 17 },
      property: "all" as const,
      years: 1 as const,
    };

    expect(buildDvfSearch(state)).toBe(
      "?lat=44.84000&lng=-0.58000&z=17&bien=all&periode=1",
    );
    expect(parse(buildDvfSearch(state))).toEqual(state);
  });
});
