import { z } from "zod";

const positionSchema = z.tuple([z.number(), z.number()]);

const stepSchema = z.object({
  distance: z.number(),
  duration: z.number(),
  instruction: z.object({
    type: z.string(),
    modifier: z.string().nullish(),
  }),
});

// Réponse de l'API d'itinéraire de la Géoplateforme (IGN), champs utilisés.
export const routeResponseSchema = z.object({
  distance: z.number(),
  duration: z.number(),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(positionSchema).min(2),
  }),
  portions: z.array(z.object({ steps: z.array(stepSchema) })),
});

export type RouteResponse = z.infer<typeof routeResponseSchema>;
