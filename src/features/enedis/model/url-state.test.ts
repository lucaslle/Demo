import { describe, expect, it } from "vitest";
import { buildElectricitySearch, parseElectricityUrlState } from "./url-state";

const parse = (search: string) =>
  parseElectricityUrlState(new URLSearchParams(search));

describe("parseElectricityUrlState", () => {
  it("lit la commune et l'année", () => {
    expect(parse("?commune=33063&annee=2024")).toEqual({
      communeCode: "33063",
      year: 2024,
    });
  });

  it("accepte un code de commune corse", () => {
    expect(parse("?commune=2A004").communeCode).toBe("2A004");
  });

  it("revient à l'état vide sur une URL vide", () => {
    expect(parse("")).toEqual({ communeCode: null, year: null });
  });

  it("ignore un code de commune ou une année invalide", () => {
    expect(parse("?commune=33063%22%20or%201=1&annee=20x4")).toEqual({
      communeCode: null,
      year: null,
    });
    expect(parse("?commune=123&annee=1850").year).toBeNull();
    expect(parse("?annee=2024.5").year).toBeNull();
  });
});

describe("buildElectricitySearch", () => {
  it("n'écrit rien sans commune", () => {
    expect(buildElectricitySearch({ communeCode: null, year: 2024 })).toBe("");
  });

  it("écrit la commune, puis l'année quand elle est choisie", () => {
    expect(buildElectricitySearch({ communeCode: "33063", year: null })).toBe(
      "?commune=33063",
    );
    expect(buildElectricitySearch({ communeCode: "33063", year: 2024 })).toBe(
      "?commune=33063&annee=2024",
    );
  });

  it("produit une query string relue à l'identique", () => {
    const state = { communeCode: "2B033", year: 2021 };

    expect(parse(buildElectricitySearch(state))).toEqual(state);
  });
});
