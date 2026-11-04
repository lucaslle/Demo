import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatPercent,
  formatEuros,
  formatPrice,
  formatRelativeTime,
  isStaleDate,
  splitPrice,
} from "./format";

const NOW = new Date("2026-11-04T12:00:00Z");

describe("formatPrice", () => {
  it("affiche trois décimales, la virgule française et le symbole euro", () => {
    expect(formatPrice(1.987).replace(/\s/g, " ")).toBe("1,987 €");
    expect(formatPrice(2.1).replace(/\s/g, " ")).toBe("2,100 €");
  });
});

describe("splitPrice", () => {
  it("sépare la dernière décimale pour l'afficher en exposant", () => {
    expect(splitPrice(1.629)).toEqual({ main: "1,62", lastDigit: "9" });
    expect(splitPrice(2.1)).toEqual({ main: "2,10", lastDigit: "0" });
  });
});

describe("formatCompact et formatPercent", () => {
  it("abrège les grands nombres", () => {
    expect(formatCompact(1_631_106).replace(/\s/g, " ")).toBe("1,63 M");
    expect(formatCompact(21_907_246_320).replace(/\s/g, " ")).toBe("21,91 Md");
  });

  it("affiche une variation avec son signe", () => {
    // Le signe moins peut être le « − » typographique (U+2212) selon l'ICU.
    const normalize = (text: string) =>
      text.replace(/\s/g, " ").replace("−", "-");

    expect(normalize(formatPercent(3.24))).toBe("+3,2 %");
    expect(normalize(formatPercent(-0.56))).toBe("-0,6 %");
    expect(normalize(formatPercent(0))).toBe("0,0 %");
  });
});

describe("formatEuros", () => {
  it("affiche un montant en euros avec deux décimales", () => {
    expect(formatEuros(4).replace(/\s/g, " ")).toBe("4,00 €");
  });
});

describe("formatRelativeTime", () => {
  it("indique une mise à jour très récente", () => {
    expect(formatRelativeTime("2026-11-04T11:59:40Z", NOW)).toBe("à l'instant");
  });

  it("traite une date légèrement dans le futur comme immédiate", () => {
    expect(formatRelativeTime("2026-11-04T12:24:00Z", NOW)).toBe("à l'instant");
  });

  it("exprime l'écart en minutes, en heures puis en jours", () => {
    expect(formatRelativeTime("2026-11-04T11:30:00Z", NOW)).toBe(
      "il y a 30 minutes",
    );
    expect(formatRelativeTime("2026-11-04T09:00:00Z", NOW)).toBe(
      "il y a 3 heures",
    );
    expect(formatRelativeTime("2026-11-01T12:00:00Z", NOW)).toBe(
      "il y a 3 jours",
    );
  });

  it("gère une date illisible", () => {
    expect(formatRelativeTime("pas une date", NOW)).toBe("date inconnue");
  });
});

describe("isStaleDate", () => {
  it("considère ancien un prix de plus de 7 jours", () => {
    expect(isStaleDate("2026-10-27T12:00:00Z", NOW)).toBe(true);
    expect(isStaleDate("2026-10-30T12:00:00Z", NOW)).toBe(false);
  });

  it("considère ancienne une date illisible", () => {
    expect(isStaleDate("???", NOW)).toBe(true);
  });
});
