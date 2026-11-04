import { z } from "zod";
import { distanceInKm } from "@/features/map/model/distance";
import type { LatLng } from "@/features/route/model/route";
import { computePricePerSqm, describeParcel, type Sale } from "../model/sale";

// L'API renvoie les montants et surfaces sous forme de chaînes (« 571100.00 »).
const decimalString = z.union([z.string(), z.number()]).nullish();

const positionSchema = z.array(z.number()).min(2);
const ringSchema = z.array(positionSchema);
const polygonSchema = z.array(ringSchema);

const geometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Polygon"), coordinates: polygonSchema }),
  z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(polygonSchema),
  }),
]);

const featureSchema = z.object({
  id: z.union([z.number(), z.string()]).nullish(),
  geometry: geometrySchema,
  properties: z.object({
    idmutinvar: z.string().nullish(),
    datemut: z.string(),
    valeurfonc: decimalString,
    sbati: decimalString,
    sterr: decimalString,
    codtypbien: z.string().nullish(),
    libtypbien: z.string().nullish(),
    libnatmut: z.string().nullish(),
    vefa: z.boolean().nullish(),
    nblocmut: z.number().nullish(),
    l_idparmut: z.array(z.string()).nullish(),
    l_idpar: z.array(z.string()).nullish(),
  }),
});

type Geometry = z.infer<typeof geometrySchema>;

export const salesResponseSchema = z.object({
  count: z.number(),
  features: z.array(z.unknown()),
});

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Zéro pour « inconnu » dans les données : on l'écarte plutôt que d'afficher 0 m².
const toSurface = (
  value: string | number | null | undefined,
): number | null => {
  const surface = toNumber(value);
  return surface === null || surface <= 0 ? null : surface;
};

const polygonsOf = (geometry: Geometry): number[][][][] =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

// Centre d'un polygone : moyenne des sommets de son contour extérieur (le
// dernier sommet répète le premier).
const centroidOf = (polygon: number[][][]): LatLng | null => {
  const ring = polygon[0]?.slice(0, -1) ?? [];
  if (ring.length === 0) {
    return null;
  }
  const total = ring.reduce(
    (sum, [lng = 0, lat = 0]) => ({ lat: sum.lat + lat, lng: sum.lng + lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: total.lat / ring.length, lng: total.lng / ring.length };
};

// Une vente peut porter sur plusieurs parcelles, parfois éloignées : on place
// le repère sur la parcelle la plus proche du centre de la recherche.
export const findRepresentativePoint = (
  geometry: Geometry,
  origin: LatLng,
): LatLng | null => {
  let best: { point: LatLng; distanceKm: number } | null = null;
  for (const polygon of polygonsOf(geometry)) {
    const point = centroidOf(polygon);
    if (point === null) {
      continue;
    }
    const distanceKm = distanceInKm(origin, point);
    if (best === null || distanceKm < best.distanceKm) {
      best = { point, distanceKm };
    }
  }
  return best?.point ?? null;
};

// Valide chaque vente séparément : une vente de forme inattendue est écartée
// seule. Les plus récentes viennent en premier.
export const parseSales = (
  rawFeatures: readonly unknown[],
  origin: LatLng,
): Sale[] =>
  rawFeatures
    .flatMap((rawFeature) => {
      const parsed = featureSchema.safeParse(rawFeature);
      if (!parsed.success) {
        return [];
      }
      const { id, geometry, properties } = parsed.data;
      const price = toNumber(properties.valeurfonc);
      const position = findRepresentativePoint(geometry, origin);
      if (
        price === null ||
        price <= 0 ||
        position === null ||
        !DATE_PATTERN.test(properties.datemut)
      ) {
        return [];
      }
      const typeCode = properties.codtypbien ?? "";
      const builtSurface = toSurface(properties.sbati);
      const parcelId =
        properties.l_idparmut?.[0] ?? properties.l_idpar?.[0] ?? null;

      return [
        {
          id: String(
            id ?? properties.idmutinvar ?? `${properties.datemut}-${price}`,
          ),
          date: properties.datemut,
          price,
          builtSurface,
          landSurface: toSurface(properties.sterr),
          pricePerSqm: computePricePerSqm(typeCode, price, builtSurface),
          typeCode,
          typeLabel: properties.libtypbien?.trim() || "Bien",
          nature: properties.libnatmut?.trim() || "Vente",
          isOffPlan: properties.vefa === true,
          lotCount: properties.nblocmut ?? 0,
          parcel: parcelId === null ? null : describeParcel(parcelId),
          position,
        },
      ];
    })
    .sort((first, second) => second.date.localeCompare(first.date));
