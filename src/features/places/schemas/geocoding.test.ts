import { describe, expect, it } from "vitest";
import { parsePlaces } from "./geocoding";

const buildFeature = (overrides: Record<string, unknown> = {}) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [-0.587877, 44.851939] },
  properties: {
    id: "33063",
    label: "Bordeaux",
    type: "municipality",
    city: "Bordeaux",
    postcode: "33000",
    citycode: "33063",
    ...overrides,
  },
});

describe("parsePlaces", () => {
  it("lit la position (longitude, latitude), la commune et le type", () => {
    const [place] = parsePlaces([buildFeature()]);

    expect(place).toMatchObject({
      label: "Bordeaux",
      kind: "municipality",
      citycode: "33063",
      postcode: "33000",
      position: { lat: 44.851939, lng: -0.587877 },
    });
  });

  it("classe les adresses et les autres lieux", () => {
    const places = parsePlaces([
      buildFeature({ type: "housenumber" }),
      buildFeature({ type: "locality" }),
    ]);

    expect(places.map(({ kind }) => kind)).toEqual(["address", "other"]);
  });

  it("donne un identifiant distinct à deux résultats identiques", () => {
    const places = parsePlaces([buildFeature(), buildFeature()]);

    expect(new Set(places.map(({ id }) => id)).size).toBe(2);
  });

  it("écarte un résultat de forme inattendue sans perdre les autres", () => {
    const places = parsePlaces([
      { geometry: null },
      "texte",
      buildFeature({ label: "Pessac" }),
    ]);

    expect(places.map(({ label }) => label)).toEqual(["Pessac"]);
  });
});
