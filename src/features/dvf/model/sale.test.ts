import { describe, expect, it } from "vitest";
import {
  computePricePerSqm,
  describeParcel,
  firstSaleYear,
  isPeriodYears,
  isPropertyFilter,
} from "./sale";
import {
  formatMarkerLabel,
  formatPricePerSqm,
  formatSaleDate,
} from "./sale-format";

describe("computePricePerSqm", () => {
  it("divise le prix par la surface bâtie d'un appartement ou d'une maison", () => {
    expect(computePricePerSqm("121", 300_000, 60)).toBe(5000);
    expect(computePricePerSqm("111", 450_000, 150)).toBe(3000);
  });

  it("ignore les biens qui ne sont pas un logement seul", () => {
    expect(computePricePerSqm("14", 300_000, 60)).toBeNull();
    expect(computePricePerSqm("122", 300_000, 60)).toBeNull();
  });

  it("ignore une surface absente ou trop petite", () => {
    expect(computePricePerSqm("121", 300_000, null)).toBeNull();
    expect(computePricePerSqm("121", 300_000, 5)).toBeNull();
  });

  it("écarte un prix au m² aberrant", () => {
    expect(computePricePerSqm("121", 1000, 50)).toBeNull();
    expect(computePricePerSqm("121", 5_000_000, 50)).toBeNull();
    expect(computePricePerSqm("121", 0, 50)).toBeNull();
  });
});

describe("describeParcel", () => {
  it("donne la section et le numéro du cadastre", () => {
    expect(describeParcel("33063000MB0014")).toBe("MB 14");
    expect(describeParcel("33063000PO0017")).toBe("PO 17");
  });

  it("renvoie null pour un identifiant inattendu", () => {
    expect(describeParcel("n'importe quoi")).toBeNull();
  });
});

describe("filtres", () => {
  it("reconnaît les types de bien et les périodes connus", () => {
    expect(isPropertyFilter("houses")).toBe(true);
    expect(isPropertyFilter("terrains")).toBe(false);
    expect(isPropertyFilter(null)).toBe(false);
    expect(isPeriodYears(3)).toBe(true);
    expect(isPeriodYears(2)).toBe(false);
  });

  it("calcule la première année incluse dans la période", () => {
    const now = new Date("2026-11-04T10:00:00Z");

    expect(firstSaleYear(1, now)).toBe(2026);
    expect(firstSaleYear(3, now)).toBe(2024);
    expect(firstSaleYear(5, now)).toBe(2022);
  });
});

const NO_BREAK_SPACE = String.fromCharCode(0xa0);
const readable = (text: string): string => text.replaceAll(/\s/g, " ");

describe("formats", () => {
  it("écrit le prix au m² avec des espaces insécables", () => {
    const label = formatPricePerSqm(4850.4);

    expect(readable(label)).toBe("4 850 €/m²");
    expect(label).toContain(`${NO_BREAK_SPACE}€/m²`);
  });

  it("préfère le prix au m² sur les repères, sinon le prix total", () => {
    expect(readable(formatMarkerLabel(4850, 300_000))).toBe("4 850 €/m²");
    expect(formatMarkerLabel(null, 250_000)).toMatch(/^250\D*k?\D*€$/);
  });

  it("met la date en toutes lettres", () => {
    expect(formatSaleDate("2025-12-23")).toBe("23 décembre 2025");
    expect(formatSaleDate("pas une date")).toBe("pas une date");
  });
});
