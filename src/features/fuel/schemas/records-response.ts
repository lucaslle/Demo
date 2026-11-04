import { z } from "zod";

// Enveloppe commune des réponses « records » de l'API : chaque enregistrement
// est validé séparément par le schéma de sa ressource.
export const recordsResponseSchema = z.object({
  total_count: z.number(),
  results: z.array(z.unknown()),
});
