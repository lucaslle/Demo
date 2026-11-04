import { describe, expect, it } from "vitest";
import {
  BEST_LABELS,
  computeShare,
  DPE_LABELS,
  formatShare,
  getReadableTextColor,
  isDpeLabel,
  isKind,
  isParc,
  LABEL_COLORS,
  PERIOD_ORDER,
  sortPeriods,
  sumCounts,
  THERMAL_SIEVE_LABELS,
  type LabelCount,
} from "./dpe";

const counts: LabelCount[] = [
  { label: "A", count: 10 },
  { label: "B", count: 10 },
  { label: "C", count: 40 },
  { label: "D", count: 20 },
  { label: "E", count: 10 },
  { label: "F", count: 5 },
  { label: "G", count: 5 },
];

describe("parts d'étiquettes", () => {
  it("additionne les diagnostics d'un sous-ensemble d'étiquettes", () => {
    expect(sumCounts(counts, THERMAL_SIEVE_LABELS)).toBe(10);
    expect(sumCounts(counts, DPE_LABELS)).toBe(100);
  });

  it("calcule la part des passoires thermiques (F et G) et des A-B", () => {
    expect(computeShare(counts, THERMAL_SIEVE_LABELS)).toBe(10);
    expect(computeShare(counts, BEST_LABELS)).toBe(20);
  });

  it("renvoie null sans aucun diagnostic", () => {
    const empty = DPE_LABELS.map((label) => ({ label, count: 0 }));

    expect(computeShare(empty, THERMAL_SIEVE_LABELS)).toBeNull();
  });
});

describe("formatShare", () => {
  it("écrit une décimale, une virgule et une espace insécable avant %", () => {
    expect(formatShare(6.234)).toBe("6,2 %");
    expect(formatShare(0)).toBe("0,0 %");
  });

  it("affiche un tiret quand la part est inconnue", () => {
    expect(formatShare(null)).toBe("—");
  });
});

describe("couleurs des étiquettes", () => {
  it("donne une couleur à chaque étiquette de A à G", () => {
    expect(Object.keys(LABEL_COLORS)).toEqual([...DPE_LABELS]);
  });

  it("choisit un texte lisible : noir sur fond clair, blanc sur fond sombre", () => {
    expect(getReadableTextColor("#fbfe06")).toBe("#000000");
    expect(getReadableTextColor("#003300")).toBe("#ffffff");
  });

  it("assure un contraste d'au moins 4,5 sur chaque étiquette", () => {
    const luminance = (hex: string) => {
      const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) => {
        const ratio = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
        return ratio <= 0.03928
          ? ratio / 12.92
          : ((ratio + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    for (const color of Object.values(LABEL_COLORS)) {
      const text = getReadableTextColor(color);
      const first = luminance(color);
      const second = luminance(text);
      const ratio =
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("gardes de type", () => {
  it("reconnaît les étiquettes, parcs et types connus", () => {
    expect(isDpeLabel("C")).toBe(true);
    expect(isDpeLabel("H")).toBe(false);
    expect(isParc("tertiaire")).toBe(true);
    expect(isParc("autre")).toBe(false);
    expect(isKind("ges")).toBe(true);
    expect(isKind(null)).toBe(false);
  });
});

describe("sortPeriods", () => {
  it("classe les périodes de la plus ancienne à la plus récente", () => {
    const sorted = sortPeriods([
      { period: "après 2021", count: 1 },
      { period: "avant 1948", count: 5 },
      { period: "1989-2000", count: 3 },
    ]);

    expect(sorted.map(({ period }) => period)).toEqual([
      "avant 1948",
      "1989-2000",
      "après 2021",
    ]);
  });

  it("place une période inconnue en dernier", () => {
    const sorted = sortPeriods([
      { period: "inconnue", count: 1 },
      { period: PERIOD_ORDER[0] ?? "", count: 1 },
    ]);

    expect(sorted.at(-1)?.period).toBe("inconnue");
  });
});
