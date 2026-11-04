import { describe, expect, it } from "vitest";
import {
  formatPower,
  getPowerCategory,
  isPowerFilter,
  POWER_FILTER_MIN_KW,
} from "./power";

describe("getPowerCategory", () => {
  it("classe les puissances selon les seuils usuels", () => {
    expect(getPowerCategory(7.4)).toBe("normal");
    expect(getPowerCategory(22)).toBe("normal");
    expect(getPowerCategory(50)).toBe("fast");
    expect(getPowerCategory(149)).toBe("fast");
    expect(getPowerCategory(150)).toBe("ultra");
    expect(getPowerCategory(400)).toBe("ultra");
  });

  it("signale une puissance inconnue ou nulle", () => {
    expect(getPowerCategory(null)).toBe("unknown");
    expect(getPowerCategory(0)).toBe("unknown");
  });
});

describe("filtres de puissance", () => {
  it("associe chaque filtre à une puissance minimale", () => {
    expect(POWER_FILTER_MIN_KW).toEqual({ all: 0, fast: 50, ultra: 150 });
  });

  it("reconnaît uniquement les filtres valides", () => {
    expect(isPowerFilter("fast")).toBe(true);
    expect(isPowerFilter("turbo")).toBe(false);
    expect(isPowerFilter(null)).toBe(false);
  });
});

describe("formatPower", () => {
  it("affiche la puissance en kilowatts", () => {
    expect(formatPower(7.4)).toBe("7.4 kW");
    expect(formatPower(150)).toBe("150 kW");
    expect(formatPower(null)).toBe("— kW");
  });
});
