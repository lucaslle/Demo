import { describe, expect, it } from "vitest";
import { buildBioSearch, parseBioUrlState } from "./url-state";

const parse = (search: string) => parseBioUrlState(new URLSearchParams(search));

const VIEW = { lat: 45.764, lng: 4.8357, zoom: 12 };

describe("parseBioUrlState", () => {
  it("lit la vue, l'activité et la recherche", () => {
    expect(
      parse("?lat=45.764&lng=4.8357&z=12&activite=production&q=miel"),
    ).toEqual({
      view: VIEW,
      activity: "production",
      query: "miel",
    });
  });

  it("revient aux valeurs par défaut sur une URL vide ou invalide", () => {
    const state = parse("?activite=nimporte&lat=abc");

    expect(state.activity).toBe("all");
    expect(state.query).toBe("");
    expect(state.view.lat).toBe(48.8566);
  });

  it("borne la longueur de la recherche", () => {
    expect(parse(`?q=${"a".repeat(500)}`).query).toHaveLength(100);
  });
});

describe("buildBioSearch", () => {
  it("n'écrit que ce qui s'écarte des valeurs par défaut", () => {
    const search = buildBioSearch({ view: VIEW, activity: "all", query: "" });

    expect(search).toBe("?lat=45.76400&lng=4.83570&z=12");
  });

  it("produit une query string relue à l'identique", () => {
    const state = {
      view: VIEW,
      activity: "distribution" as const,
      query: "pain",
    };

    expect(parse(buildBioSearch(state))).toEqual(state);
  });

  it("n'écrit pas une recherche trop courte", () => {
    expect(
      buildBioSearch({ view: VIEW, activity: "all", query: "ab" }),
    ).not.toContain("q=");
  });
});
