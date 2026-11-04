export type ScenarioId = "fuel" | "home" | "normal" | "fast";

export type ScenarioInput = {
  fuelLabel: string;
  fuelPricePerLiter: number;
  litersPer100Km: number;
  kwhPer100Km: number;
  annualKm: number;
  homePricePerKwh: number;
  normalPricePerKwh: number;
  fastPricePerKwh: number;
};

export type Scenario = {
  id: ScenarioId;
  label: string;
  unitPrice: number;
  unit: "€/L" | "€/kWh";
  costPer100Km: number;
  annualCost: number;
  // Positif : moins cher que le carburant ; négatif : plus cher.
  annualSavingsVsFuel: number;
  savingsRatioVsFuel: number;
  isCheapest: boolean;
};

const KM_PER_COST_BASIS = 100;

export const costPer100Km = (
  unitPrice: number,
  consumptionPer100Km: number,
): number => unitPrice * consumptionPer100Km;

export const annualCost = (costPer100: number, annualKm: number): number =>
  (costPer100 * annualKm) / KM_PER_COST_BASIS;

// Prix du kWh à partir duquel recharger coûte autant que faire le plein.
export const breakEvenPricePerKwh = (
  fuelCostPer100Km: number,
  kwhPer100Km: number,
): number | null => (kwhPer100Km > 0 ? fuelCostPer100Km / kwhPer100Km : null);

export const buildScenarios = (input: ScenarioInput): Scenario[] => {
  const fuelCost = costPer100Km(input.fuelPricePerLiter, input.litersPer100Km);
  const fuelAnnual = annualCost(fuelCost, input.annualKm);

  const definitions: Omit<
    Scenario,
    "annualSavingsVsFuel" | "savingsRatioVsFuel" | "isCheapest"
  >[] = [
    {
      id: "fuel",
      label: input.fuelLabel,
      unitPrice: input.fuelPricePerLiter,
      unit: "€/L",
      costPer100Km: fuelCost,
      annualCost: fuelAnnual,
    },
    ...(
      [
        ["home", "Recharge à domicile", input.homePricePerKwh],
        ["normal", "Borne publique normale", input.normalPricePerKwh],
        ["fast", "Borne publique rapide", input.fastPricePerKwh],
      ] as const
    ).map(([id, label, unitPrice]) => {
      const cost = costPer100Km(unitPrice, input.kwhPer100Km);
      return {
        id,
        label,
        unitPrice,
        unit: "€/kWh" as const,
        costPer100Km: cost,
        annualCost: annualCost(cost, input.annualKm),
      };
    }),
  ];

  const lowestCost = Math.min(...definitions.map((d) => d.costPer100Km));

  return definitions.map((definition) => ({
    ...definition,
    annualSavingsVsFuel: fuelAnnual - definition.annualCost,
    savingsRatioVsFuel:
      fuelAnnual === 0 ? 0 : (fuelAnnual - definition.annualCost) / fuelAnnual,
    isCheapest: definition.costPer100Km === lowestCost,
  }));
};
