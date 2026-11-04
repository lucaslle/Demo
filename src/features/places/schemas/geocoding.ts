import { z } from "zod";
import type { Place, PlaceKind } from "../model/place";

const featureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    id: z.string().nullish(),
    label: z.string(),
    type: z.string().nullish(),
    city: z.string().nullish(),
    postcode: z.string().nullish(),
    citycode: z.string().nullish(),
  }),
});

export const geocodingResponseSchema = z.object({
  features: z.array(z.unknown()),
});

const KIND_BY_TYPE: Record<string, PlaceKind> = {
  municipality: "municipality",
  housenumber: "address",
  street: "address",
};

// Chaque résultat est validé séparément : un résultat inattendu est écarté sans
// faire échouer la liste.
export const parsePlaces = (rawFeatures: readonly unknown[]): Place[] =>
  rawFeatures.flatMap((rawFeature, index) => {
    const parsed = featureSchema.safeParse(rawFeature);
    if (!parsed.success) {
      return [];
    }
    const { geometry, properties } = parsed.data;
    const [lng, lat] = geometry.coordinates;
    return [
      {
        id: `${properties.id ?? properties.label}-${index}`,
        label: properties.label,
        kind: KIND_BY_TYPE[properties.type ?? ""] ?? "other",
        position: { lat, lng },
        citycode: properties.citycode ?? null,
        city: properties.city ?? null,
        postcode: properties.postcode ?? null,
      },
    ];
  });

// Fiche commune de geo.api.gouv.fr.
export const communeResponseSchema = z.object({
  code: z.string(),
  nom: z.string(),
  codesPostaux: z.array(z.string()).nullish(),
  population: z.number().nullish(),
  centre: z
    .object({ coordinates: z.tuple([z.number(), z.number()]) })
    .nullish(),
});
