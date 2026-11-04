import { describe, expect, it } from "vitest";
import {
  annualCost,
  breakEvenPricePerKwh,
  buildScenarios,
  costPer100Km,
  type ScenarioInput,
} from "./cost";

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

describe("costPer100Km et annualCost", () => {
  it("multiplie le prix unitaire par la consommation", () => {
    expect(costPer100Km(2, 6.5)).toBeCloseTo(13, 10);
    expect(costPer100Km(0.25, 17)).toBeCloseTo(4.25, 10);
  });

  it("ramène le coût à l'année", () => {
    expect(annualCost(13, 12_000)).toBeCloseTo(1560, 10);
  });
});

describe("breakEvenPricePerKwh", () => {
  it("donne le prix du kWh pour lequel l'électrique coûte autant que le carburant", () => {
    expect(breakEvenPricePerKwh(13, 17)).toBeCloseTo(0.7647, 4);
  });

  it("renvoie null sans consommation électrique", () => {
    expect(breakEvenPricePerKwh(13, 0)).toBeNull();
  });
});

describe("buildScenarios", () => {
  const scenarios = buildScenarios(input);
  const byId = (id: string) => scenarios.find((scenario) => scenario.id === id);

  it("propose le carburant puis trois façons de recharger", () => {
    expect(scenarios.map(({ id }) => id)).toEqual([
      "fuel",
      "home",
      "normal",
      "fast",
    ]);
    expect(byId("fuel")?.label).toBe("SP95-E10");
  });

  it("calcule le coût aux 100 km et par an de chaque scénario", () => {
    expect(byId("fuel")?.costPer100Km).toBeCloseTo(13, 10);
    expect(byId("home")?.costPer100Km).toBeCloseTo(4.25, 10);
    expect(byId("fast")?.annualCost).toBeCloseTo(999.6, 6);
  });

  it("mesure l'économie par rapport au carburant", () => {
    const home = byId("home");

    expect(home?.annualSavingsVsFuel).toBeCloseTo(1050, 6);
    expect(home?.savingsRatioVsFuel).toBeCloseTo(0.6731, 4);
    expect(byId("fuel")?.annualSavingsVsFuel).toBe(0);
  });

  it("repère le scénario le moins cher", () => {
    expect(scenarios.filter(({ isCheapest }) => isCheapest)).toHaveLength(1);
    expect(byId("home")?.isCheapest).toBe(true);
  });

  it("signale une recharge plus chère que le carburant par une économie négative", () => {
    const expensive = buildScenarios({ ...input, fastPricePerKwh: 1.2 });

    expect(
      expensive.find(({ id }) => id === "fast")?.annualSavingsVsFuel,
    ).toBeLessThan(0);
  });
});
