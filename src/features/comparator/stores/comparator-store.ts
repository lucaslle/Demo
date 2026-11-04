import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { FUEL_TYPES } from "@/features/fuel/model/fuel-types";
import {
  DEFAULT_ANNUAL_KM,
  DEFAULT_FUEL_FOR_COMPARISON,
  DEFAULT_KWH_PER_100_KM,
  DEFAULT_LITERS_PER_100_KM,
  LIMITS,
} from "../model/defaults";

export const COMPARATOR_STORAGE_KEY = "autour-de-moi-comparateur";

const nullablePrice = z
  .number()
  .min(LIMITS.pricePerKwh.min)
  .max(LIMITS.pricePerKwh.max)
  .nullable();

// Les réglages relus du stockage local sont validés : une valeur altérée ou
// d'une ancienne version retombe sur les valeurs par défaut.
const settingsSchema = z.object({
  fuel: z.enum(FUEL_TYPES),
  litersPer100Km: z
    .number()
    .min(LIMITS.litersPer100Km.min)
    .max(LIMITS.litersPer100Km.max),
  kwhPer100Km: z
    .number()
    .min(LIMITS.kwhPer100Km.min)
    .max(LIMITS.kwhPer100Km.max),
  annualKm: z.number().min(LIMITS.annualKm.min).max(LIMITS.annualKm.max),
  fuelPriceOverride: z
    .number()
    .min(LIMITS.fuelPricePerLiter.min)
    .max(LIMITS.fuelPricePerLiter.max)
    .nullable(),
  homePriceOverride: nullablePrice,
  normalPriceOverride: nullablePrice,
  fastPriceOverride: nullablePrice,
});

export type ComparatorSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: ComparatorSettings = {
  fuel: DEFAULT_FUEL_FOR_COMPARISON,
  litersPer100Km: DEFAULT_LITERS_PER_100_KM,
  kwhPer100Km: DEFAULT_KWH_PER_100_KM,
  annualKm: DEFAULT_ANNUAL_KM,
  fuelPriceOverride: null,
  homePriceOverride: null,
  normalPriceOverride: null,
  fastPriceOverride: null,
};

type ComparatorState = ComparatorSettings & {
  update: (changes: Partial<ComparatorSettings>) => void;
  reset: () => void;
};

export const useComparatorStore = create<ComparatorState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (changes) => set(changes),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: COMPARATOR_STORAGE_KEY,
      partialize: (state): ComparatorSettings => ({
        fuel: state.fuel,
        litersPer100Km: state.litersPer100Km,
        kwhPer100Km: state.kwhPer100Km,
        annualKm: state.annualKm,
        fuelPriceOverride: state.fuelPriceOverride,
        homePriceOverride: state.homePriceOverride,
        normalPriceOverride: state.normalPriceOverride,
        fastPriceOverride: state.fastPriceOverride,
      }),
      merge: (persisted, current) => {
        const parsed = settingsSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);
