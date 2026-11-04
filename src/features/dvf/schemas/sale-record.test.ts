import { describe, expect, it } from "vitest";
import {
  findRepresentativePoint,
  parseSales,
  salesResponseSchema,
} from "./sale-record";

const ORIGIN = { lat: 44.84, lng: -0.58 };

const square = (lng: number, lat: number, size = 0.0002) => [
  [
    [lng, lat],
    [lng + size, lat],
    [lng + size, lat + size],
    [lng, lat + size],
    [lng, lat],
  ],
];

const buildFeature = (properties: Record<string, unknown> = {}) => ({
  id: 14558336,
  type: "Feature",
  geometry: { type: "MultiPolygon", coordinates: [square(-0.58, 44.84)] },
  properties: {
    idmutinvar: "476cdb1b",
    datemut: "2025-12-23",
    valeurfonc: "300000.00",
    sbati: "60.00",
    sterr: "0.00",
    codtypbien: "121",
    libtypbien: "UN APPARTEMENT",
    libnatmut: "Vente",
    vefa: false,
    nblocmut: 2,
    l_idparmut: ["33063000PO0017"],
    ...properties,
  },
});

describe("salesResponseSchema", () => {
  it("lit le total et les ventes", () => {
    expect(salesResponseSchema.parse({ count: 482, features: [] })).toEqual({
      count: 482,
      features: [],
    });
  });
});

describe("findRepresentativePoint", () => {
  it("choisit la parcelle la plus proche du centre de la recherche", () => {
    const point = findRepresentativePoint(
      {
        type: "MultiPolygon",
        coordinates: [square(-0.56, 44.785), square(-0.5801, 44.8399)],
      },
      ORIGIN,
    );

    expect(point?.lat).toBeCloseTo(44.84, 3);
    expect(point?.lng).toBeCloseTo(-0.58, 3);
  });

  it("accepte un simple polygone", () => {
    const point = findRepresentativePoint(
      { type: "Polygon", coordinates: square(-0.58, 44.84) },
      ORIGIN,
    );

    expect(point).not.toBeNull();
  });

  it("renvoie null pour une géométrie vide", () => {
    expect(
      findRepresentativePoint(
        { type: "MultiPolygon", coordinates: [] },
        ORIGIN,
      ),
    ).toBeNull();
  });
});

describe("parseSales", () => {
  it("convertit une vente avec son prix au m², sa parcelle et son repère", () => {
    const [sale] = parseSales([buildFeature()], ORIGIN);

    expect(sale).toMatchObject({
      id: "14558336",
      date: "2025-12-23",
      price: 300000,
      builtSurface: 60,
      landSurface: null,
      pricePerSqm: 5000,
      typeLabel: "UN APPARTEMENT",
      isOffPlan: false,
      lotCount: 2,
      parcel: "PO 17",
    });
    expect(sale?.position.lat).toBeCloseTo(44.84, 3);
  });

  it("classe les ventes de la plus récente à la plus ancienne", () => {
    const sales = parseSales(
      [
        buildFeature({ datemut: "2024-01-05" }),
        { ...buildFeature({ datemut: "2025-06-01" }), id: 2 },
      ],
      ORIGIN,
    );

    expect(sales.map(({ date }) => date)).toEqual(["2025-06-01", "2024-01-05"]);
  });

  it("écarte les ventes sans prix, sans date valide ou de forme inattendue", () => {
    const sales = parseSales(
      [
        buildFeature({ valeurfonc: null }),
        buildFeature({ valeurfonc: "0.00" }),
        buildFeature({ datemut: "hier" }),
        { geometry: null },
        "texte",
        { ...buildFeature(), id: 99 },
      ],
      ORIGIN,
    );

    expect(sales.map(({ id }) => id)).toEqual(["99"]);
  });

  it("n'invente pas de prix au m² pour un bien qui n'est pas un logement seul", () => {
    const [sale] = parseSales(
      [buildFeature({ codtypbien: "14", libtypbien: "ACTIVITE" })],
      ORIGIN,
    );

    expect(sale?.pricePerSqm).toBeNull();
  });
});
