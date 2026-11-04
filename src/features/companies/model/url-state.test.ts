import { describe, expect, it } from "vitest";
import { buildCompanySearch, parseCompanyUrlState } from "./url-state";

const parse = (search: string) =>
  parseCompanyUrlState(new URLSearchParams(search));

describe("parseCompanyUrlState", () => {
  it("lit la recherche, le filtre, la page et le SIREN", () => {
    expect(parse("?q=danone&actives=0&page=3&siren=552032534")).toEqual({
      query: "danone",
      onlyActive: false,
      page: 3,
      siren: "552032534",
    });
  });

  it("revient aux valeurs par défaut quand l'URL est vide", () => {
    expect(parse("")).toEqual({
      query: "",
      onlyActive: true,
      page: 1,
      siren: null,
    });
  });

  it("ignore un SIREN invalide ou une page hors limites", () => {
    const state = parse("?siren=../../x&page=-4");

    expect(state.siren).toBeNull();
    expect(state.page).toBe(1);
    expect(parse("?page=99999").page).toBe(1);
    expect(parse("?page=2.5").page).toBe(1);
  });

  it("borne la longueur de la recherche", () => {
    expect(parse(`?q=${"a".repeat(500)}`).query).toHaveLength(100);
  });
});

describe("buildCompanySearch", () => {
  it("ne garde dans l'URL que ce qui s'écarte des valeurs par défaut", () => {
    expect(
      buildCompanySearch({
        query: "danone",
        onlyActive: true,
        page: 1,
        siren: null,
      }),
    ).toBe("?q=danone");
    expect(
      buildCompanySearch({ query: "", onlyActive: true, page: 1, siren: null }),
    ).toBe("");
  });

  it("produit une query string relue à l'identique", () => {
    const state = {
      query: "boulangerie paris",
      onlyActive: false,
      page: 2,
      siren: "403052111",
    };

    expect(parse(buildCompanySearch(state))).toEqual(state);
  });

  it("n'écrit pas une recherche trop courte", () => {
    expect(
      buildCompanySearch({
        query: "ab",
        onlyActive: true,
        page: 1,
        siren: null,
      }),
    ).toBe("");
  });
});
