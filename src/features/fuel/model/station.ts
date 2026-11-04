import type { FuelType } from "./fuel-types";

export type FuelPrice = {
  amount: number;
  updatedAt: string | null;
};

export type Station = {
  id: number;
  position: { lat: number; lng: number };
  address: string;
  postalCode: string;
  city: string;
  prices: Partial<Record<FuelType, FuelPrice>>;
};
