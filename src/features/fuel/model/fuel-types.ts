export const FUEL_TYPES = [
  "gazole",
  "e10",
  "sp98",
  "sp95",
  "e85",
  "gplc",
] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const DEFAULT_FUEL: FuelType = "e10";

export const FUEL_LABELS: Record<FuelType, string> = {
  gazole: "Gazole",
  e10: "SP95-E10",
  sp98: "SP98",
  sp95: "SP95",
  e85: "E85",
  gplc: "GPLc",
};

export const isFuelType = (value: unknown): value is FuelType =>
  FUEL_TYPES.some((fuel) => fuel === value);
