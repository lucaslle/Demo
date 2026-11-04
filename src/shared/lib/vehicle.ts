import { z } from "zod";

export const DEFAULT_TANK_LITERS = 50;
export const MIN_TANK_LITERS = 10;
export const MAX_TANK_LITERS = 200;
export const MAX_VEHICLE_LABEL_LENGTH = 60;

// Le véhicule de l'utilisateur : un nom libre (facultatif) et la capacité de
// son réservoir, qui sert à chiffrer l'écart de prix sur un plein.
export const vehicleSchema = z.object({
  label: z.string().max(MAX_VEHICLE_LABEL_LENGTH),
  tankLiters: z.number().min(MIN_TANK_LITERS).max(MAX_TANK_LITERS),
});

export type Vehicle = z.infer<typeof vehicleSchema>;
