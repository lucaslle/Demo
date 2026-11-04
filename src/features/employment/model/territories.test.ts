import { describe, expect, it } from "vitest";
import {
  DEFAULT_TERRITORY,
  findTerritory,
  formatTerritoryLabel,
  FRANCE_CODE,
  TERRITORIES,
} from "./territories";

describe("TERRITORIES", () => {
  it("commence par la France entière puis liste les départements par code", () => {
    expect(TERRITORIES[0]).toEqual(DEFAULT_TERRITORY);
    const codes = TERRITORIES.map(({ code }) => code);

    expect(codes.slice(1, 4)).toEqual(["01", "02", "03"]);
    expect(codes).toContain("2A");
    expect(codes).toContain("2B");
  });

  it("inclut les quatre départements d'outre-mer", () => {
    const codes = TERRITORIES.map(({ code }) => code);

    for (const code of ["971", "972", "973", "974"]) {
      expect(codes).toContain(code);
    }
  });

  it("couvre les 100 territoires des données Urssaf, sans doublon", () => {
    const codes = TERRITORIES.map(({ code }) => code);

    // 96 départements métropolitains + 4 outre-mer + France entière.
    expect(codes).toHaveLength(101);
    expect(new Set(codes).size).toBe(101);
  });
});

describe("findTerritory et formatTerritoryLabel", () => {
  it("retrouve un territoire par son code", () => {
    expect(findTerritory("75")?.name).toBe("Paris");
    expect(findTerritory("zz")).toBeUndefined();
    expect(findTerritory(null)).toBeUndefined();
  });

  it("ajoute le code aux départements, pas à la France entière", () => {
    expect(formatTerritoryLabel({ code: "75", name: "Paris" })).toBe(
      "Paris (75)",
    );
    expect(
      formatTerritoryLabel({ code: FRANCE_CODE, name: "France entière" }),
    ).toBe("France entière");
  });
});
