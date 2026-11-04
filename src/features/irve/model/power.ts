export type PowerCategory = "unknown" | "normal" | "fast" | "ultra";

// Seuils usuels : charge normale jusqu'à 22 kW (courant alternatif), rapide à
// partir de 50 kW (courant continu), ultra-rapide à partir de 150 kW.
export const NORMAL_MAX_KW = 22;
export const FAST_MIN_KW = 50;
export const ULTRA_MIN_KW = 150;

export const getPowerCategory = (powerKw: number | null): PowerCategory => {
  if (powerKw === null || powerKw <= 0) {
    return "unknown";
  }
  if (powerKw >= ULTRA_MIN_KW) {
    return "ultra";
  }
  if (powerKw >= FAST_MIN_KW) {
    return "fast";
  }
  return "normal";
};

export const POWER_CATEGORY_LABELS: Record<PowerCategory, string> = {
  unknown: "Puissance inconnue",
  normal: "Charge normale",
  fast: "Charge rapide",
  ultra: "Ultra-rapide",
};

export type PowerFilter = "all" | "fast" | "ultra";

export const POWER_FILTERS: readonly PowerFilter[] = ["all", "fast", "ultra"];

export const POWER_FILTER_LABELS: Record<PowerFilter, string> = {
  all: "Toutes",
  fast: "Rapides · 50 kW +",
  ultra: "Ultra-rapides · 150 kW +",
};

export const POWER_FILTER_MIN_KW: Record<PowerFilter, number> = {
  all: 0,
  fast: FAST_MIN_KW,
  ultra: ULTRA_MIN_KW,
};

export const isPowerFilter = (value: unknown): value is PowerFilter =>
  POWER_FILTERS.some((filter) => filter === value);

export const formatPower = (powerKw: number | null): string =>
  powerKw === null ? "— kW" : `${Math.round(powerKw * 10) / 10} kW`;
