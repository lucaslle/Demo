import type { LatLng } from "@/features/route/model/route";

export type PlugType = "type2" | "ccs" | "chademo" | "domestic";

export const PLUG_LABELS: Record<PlugType, string> = {
  ccs: "CCS Combo",
  type2: "Type 2",
  chademo: "CHAdeMO",
  domestic: "Prise domestique",
};

export type ChargingStation = {
  id: string;
  name: string;
  operator: string;
  address: string;
  position: LatLng;
  pointCount: number;
  maxPowerKw: number | null;
  plugs: PlugType[];
  isFree: boolean;
  access: string | null;
  hours: string | null;
  updatedAt: string | null;
};
