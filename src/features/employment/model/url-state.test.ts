import { describe, expect, it } from "vitest";
import { findSectorByKey } from "./employment";
import { DEFAULT_TERRITORY, findTerritory } from "./territories";
import { buildEmploymentSearch, parseEmploymentUrlState } from "./url-state";

const parse = (search: string) =>
  parseEmploymentUrlState(new URLSearchParams(search));

describe("parseEmploymentUrlState", () => {
  it("lit le territoire, le secteur et l'indicateur", () => {
    expect(parse("?territoire=75&secteur=gs3&indicateur=payroll")).toEqual({
      territory: findTerritory("75"),
      sector: findSectorByKey("gs3"),
      indicator: "payroll",
    });
  });

  it("revient aux valeurs par défaut quand l'URL est vide ou invalide", () => {
    const defaults = {
      territory: DEFAULT_TERRITORY,
      sector: null,
      indicator: "employees",
    };

    expect(parse("")).toEqual(defaults);
    expect(parse("?territoire=99&secteur=xx&indicateur=pib")).toEqual(defaults);
  });

  it("comprend « tous » comme l'absence de secteur", () => {
    expect(parse("?secteur=tous").sector).toBeNull();
  });
});

describe("buildEmploymentSearch", () => {
  it("produit une query string relue à l'identique", () => {
    const state = {
      territory: findTerritory("2A") ?? DEFAULT_TERRITORY,
      sector: findSectorByKey("gs5") ?? null,
      indicator: "payroll" as const,
    };

    expect(buildEmploymentSearch(state)).toBe(
      "?territoire=2A&secteur=gs5&indicateur=payroll",
    );
    expect(parse(buildEmploymentSearch(state))).toEqual(state);
  });

  it("écrit « tous » quand aucun secteur n'est choisi", () => {
    expect(
      buildEmploymentSearch({
        territory: DEFAULT_TERRITORY,
        sector: null,
        indicator: "employees",
      }),
    ).toBe("?territoire=FR&secteur=tous&indicateur=employees");
  });
});
