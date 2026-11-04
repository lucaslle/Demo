import { describe, expect, it } from "vitest";
import { buildDpeSearch, parseDpeUrlState } from "./url-state";

const parse = (search: string) => parseDpeUrlState(new URLSearchParams(search));

describe("parseDpeUrlState", () => {
  it("lit la commune, le parc et l'étiquette", () => {
    expect(parse("?commune=33063&parc=tertiaire&etiquette=ges")).toEqual({
      communeCode: "33063",
      parc: "tertiaire",
      kind: "ges",
    });
  });

  it("accepte un code de commune corse", () => {
    expect(parse("?commune=2A004").communeCode).toBe("2A004");
  });

  it("revient aux valeurs par défaut quand l'URL est vide ou invalide", () => {
    const defaults = { communeCode: null, parc: "logements", kind: "dpe" };

    expect(parse("")).toEqual(defaults);
    expect(parse("?commune=../x&parc=maisons&etiquette=co2")).toEqual(defaults);
  });
});

describe("buildDpeSearch", () => {
  it("n'écrit rien quand tout est par défaut", () => {
    expect(
      buildDpeSearch({ communeCode: null, parc: "logements", kind: "dpe" }),
    ).toBe("");
  });

  it("ne garde que ce qui s'écarte des valeurs par défaut", () => {
    expect(
      buildDpeSearch({ communeCode: "33063", parc: "logements", kind: "dpe" }),
    ).toBe("?commune=33063");
  });

  it("produit une query string relue à l'identique", () => {
    const state = {
      communeCode: "59350",
      parc: "tertiaire" as const,
      kind: "ges" as const,
    };

    expect(parse(buildDpeSearch(state))).toEqual(state);
  });
});
