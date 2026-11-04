import { DEFAULT_FUEL, type FuelType } from "@/features/fuel/model/fuel-types";

// Hypothèses de départ, modifiables par l'utilisateur.
export const DEFAULT_LITERS_PER_100_KM = 6.5;
export const DEFAULT_KWH_PER_100_KM = 17;
export const DEFAULT_ANNUAL_KM = 12_000;
export const DEFAULT_FUEL_FOR_COMPARISON: FuelType = DEFAULT_FUEL;

// Tarif de l'électricité au domicile : valeur indicative (le prix réel dépend du
// contrat). Les tarifs de bornes publiques viennent des données ouvertes ; les
// valeurs ci-dessous ne servent que si elles sont indisponibles.
export const DEFAULT_HOME_PRICE_PER_KWH = 0.25;
export const FALLBACK_NORMAL_PRICE_PER_KWH = 0.31;
export const FALLBACK_FAST_PRICE_PER_KWH = 0.49;
export const FALLBACK_FUEL_PRICE_PER_LITER = 2;

export const LIMITS = {
  litersPer100Km: { min: 1, max: 30 },
  kwhPer100Km: { min: 5, max: 50 },
  annualKm: { min: 1_000, max: 100_000 },
  fuelPricePerLiter: { min: 0.5, max: 4 },
  pricePerKwh: { min: 0.05, max: 1.5 },
} as const;
