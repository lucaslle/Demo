import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPlacesUrl, fetchCommune, searchPlaces } from "./places-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildPlacesUrl", () => {
  it("limite la recherche aux communes quand on le demande", () => {
    const url = new URL(
      buildPlacesUrl({ query: " bordeaux ", scope: "municipality" }),
    );

    expect(url.origin + url.pathname).toBe(
      "https://data.geopf.fr/geocodage/search",
    );
    expect(url.searchParams.get("q")).toBe("bordeaux");
    expect(url.searchParams.get("type")).toBe("municipality");
  });

  it("ne filtre pas le type pour une recherche d'adresse", () => {
    const url = new URL(
      buildPlacesUrl({ query: "8 rue du port", scope: "any" }),
    );

    expect(url.searchParams.has("type")).toBe(false);
  });
});

describe("searchPlaces", () => {
  it("ne contacte pas le service sous trois caractères", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchPlaces({ query: "bo", scope: "municipality" })).toEqual(
      [],
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valide et convertit les résultats", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({
              features: [
                {
                  geometry: { coordinates: [-0.58, 44.86] },
                  properties: {
                    label: "Bordeaux",
                    type: "municipality",
                    citycode: "33063",
                  },
                },
              ],
            }),
          ),
      ),
    );

    const places = await searchPlaces({
      query: "bordeaux",
      scope: "municipality",
    });

    expect(places).toHaveLength(1);
    expect(places[0]?.citycode).toBe("33063");
  });
});

describe("fetchCommune", () => {
  it("refuse un code qui n'est pas un code INSEE sans appeler le service", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchCommune("../../x")).toBeNull();
    expect(await fetchCommune("123")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie la commune avec sa position", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({
              code: "33063",
              nom: "Bordeaux",
              codesPostaux: ["33000"],
              population: 267991,
              centre: { type: "Point", coordinates: [-0.5848, 44.8624] },
            }),
          ),
      ),
    );

    expect(await fetchCommune("33063")).toEqual({
      code: "33063",
      name: "Bordeaux",
      postcodes: ["33000"],
      population: 267991,
      position: { lat: 44.8624, lng: -0.5848 },
    });
  });

  it("accepte un code corse", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ code: "2A004", nom: "Ajaccio" })),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect((await fetchCommune("2A004"))?.name).toBe("Ajaccio");
  });
});
