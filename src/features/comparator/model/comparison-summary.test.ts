import { describe, expect, it } from "vitest";
import { buildScenarios, type ScenarioInput } from "./cost";
import { describeComparison } from "./comparison-summary";

const input: ScenarioInput = {
  fuelLabel: "SP95-E10",
  fuelPricePerLiter: 2,
  litersPer100Km: 6.5,
  kwhPer100Km: 17,
  annualKm: 12_000,
  homePricePerKwh: 0.25,
  normalPricePerKwh: 0.31,
  fastPricePerKwh: 0.49,
};

const normalize = (text: string) => text.replace(/\s/g, " ");

describe("describeComparison", () => {
  it("chiffre la fourchette d'économie quand l'électrique est toujours moins cher", () => {
    const text = normalize(describeComparison(buildScenarios(input), 12_000));

    expect(text).toContain("12 000 km par an");
    expect(text).toContain("moins que le carburant");
    expect(text).toContain("recharge à domicile");
    expect(text).toContain("borne publique rapide");
  });

  it("explique quand le carburant reste moins cher partout", () => {
    const scenarios = buildScenarios({
      ...input,
      fuelPricePerLiter: 0.6,
      homePricePerKwh: 0.9,
      normalPricePerKwh: 0.9,
      fastPricePerKwh: 0.9,
    });

    expect(describeComparison(scenarios, 12_000)).toContain(
      "le carburant reste moins cher",
    );
  });

  it("distingue les formules rentables de celles qui ne le sont pas", () => {
    const scenarios = buildScenarios({ ...input, fastPricePerKwh: 1.2 });

    const text = normalize(describeComparison(scenarios, 12_000));

    expect(text).toContain("fait économiser");
    expect(text).toContain("borne publique rapide coûte");
    expect(text).toContain("de plus que le carburant");
  });
});
