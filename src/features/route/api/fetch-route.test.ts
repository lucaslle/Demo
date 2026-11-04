import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http-client";
import { describeRouteError, fetchRoute } from "./fetch-route";

const origin = { lat: 48.8566, lng: 2.3522 };
const destination = { lat: 48.8397, lng: 2.3978 };

const apiResponse = {
  distance: 5222.97,
  duration: 951.3,
  geometry: {
    type: "LineString",
    coordinates: [
      [2.35257, 48.85727],
      [2.3978, 48.8397],
    ],
  },
  portions: [
    {
      steps: [{ distance: 98, duration: 9, instruction: { type: "depart" } }],
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRoute", () => {
  it("envoie longitude puis latitude, comme l'attend l'API", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(apiResponse)),
    );
    vi.stubGlobal("fetch", fetchMock);

    const route = await fetchRoute({ origin, destination });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("start")).toBe("2.3522,48.8566");
    expect(url.searchParams.get("end")).toBe("2.3978,48.8397");
    expect(url.searchParams.get("resource")).toBe("bdtopo-valhalla");
    expect(route.steps[0]?.label).toBe("Démarrer");
  });

  it("refuse une réponse inattendue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ distance: "loin" }))),
    );

    await expect(fetchRoute({ origin, destination })).rejects.toMatchObject({
      kind: "invalid-data",
    });
  });
});

describe("describeRouteError", () => {
  it("explique qu'un point est hors de la zone couverte", () => {
    const error = new ApiError("http", "Bad request", 400);

    expect(describeRouteError(error)).toBe(
      "Cet itinéraire sort de la zone couverte par le service.",
    );
  });

  it("garde le message générique pour les autres erreurs", () => {
    const error = new ApiError("timeout", "Trop long");

    expect(describeRouteError(error)).toContain("trop de temps");
  });
});
