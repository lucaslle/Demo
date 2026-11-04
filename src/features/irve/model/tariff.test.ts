import { describe, expect, it } from "vitest";
import { parseKwhPrice, weightedMedian } from "./tariff";

describe("parseKwhPrice", () => {
  it.each([
    ["0,29€ / kWh", 0.29],
    ["0,39 € / kWh", 0.39],
    ["0,45 € TTC/kWh", 0.45],
    ["59 cts/kWh", 0.59],
    ["AC 36cts/KWh", 0.36],
    [
      "entre 08:00 et 20:00 : 0.30916667€ par kwh de charge, 3.75€ par heure d'occupation",
      0.30916667,
    ],
  ])("lit le prix au kWh dans « %s »", (text, expected) => {
    expect(parseKwhPrice(text)).toBeCloseTo(expected, 8);
  });

  it.each([
    "https://belib.paris",
    "Les tarifs de recharge peuvent varier en fonction de plusieurs facteurs",
    "Tarification au kWh plus frais de connexion éventuels",
    "2,5€ / heure",
    "",
  ])("ignore « %s »", (text) => {
    expect(parseKwhPrice(text)).toBeNull();
  });

  it("écarte un prix invraisemblable", () => {
    expect(parseKwhPrice("0,001€ / kWh")).toBeNull();
    expect(parseKwhPrice("35€ / kWh")).toBeNull();
  });
});

describe("weightedMedian", () => {
  it("renvoie null sans valeur", () => {
    expect(weightedMedian([])).toBeNull();
  });

  it("tient compte du poids de chaque valeur", () => {
    expect(
      weightedMedian([
        { value: 0.5, weight: 1 },
        { value: 0.3, weight: 10 },
        { value: 0.7, weight: 1 },
      ]),
    ).toBe(0.3);
  });

  it("renvoie la valeur centrale à poids égaux", () => {
    expect(
      weightedMedian([
        { value: 0.6, weight: 1 },
        { value: 0.2, weight: 1 },
        { value: 0.4, weight: 1 },
      ]),
    ).toBe(0.4);
  });
});
