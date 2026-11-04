import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOperatorsUrl, fetchNearbyOperators } from "./fetch-operators";

const PARIS = { lat: 48.86, lng: 2.35 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildOperatorsUrl", () => {
  it("demande les 40 opérateurs les plus proches du centre", () => {
    const url = new URL(
      buildOperatorsUrl({ center: PARIS, activity: "all", query: "" }),
    );

    expect(url.origin + url.pathname).toBe(
      "https://opendata.agencebio.org/api/gouv/operateurs/",
    );
    expect(url.searchParams.get("lat")).toBe("48.8600");
    expect(url.searchParams.get("lng")).toBe("2.3500");
    expect(url.searchParams.get("nb")).toBe("40");
    expect(url.searchParams.has("activite")).toBe(false);
    expect(url.searchParams.has("q")).toBe(false);
  });

  it("ajoute l'activité et la recherche quand elles sont renseignées", () => {
    const url = new URL(
      buildOperatorsUrl({
        center: PARIS,
        activity: "preparation",
        query: "  pâtes ",
      }),
    );

    expect(url.searchParams.get("activite")).toBe("Préparation");
    expect(url.searchParams.get("q")).toBe("pâtes");
  });

  it("ignore une recherche trop courte", () => {
    const url = new URL(
      buildOperatorsUrl({ center: PARIS, activity: "all", query: "ab" }),
    );

    expect(url.searchParams.has("q")).toBe(false);
  });
});

describe("fetchNearbyOperators", () => {
  it("valide la réponse et renvoie les opérateurs classés avec le total", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({
              nbTotal: "2",
              items: [
                {
                  id: 1,
                  raisonSociale: "FERME DU PARC",
                  adressesOperateurs: [
                    {
                      lieu: "1 chemin",
                      ville: "Paris",
                      lat: 48.86,
                      long: 2.35,
                    },
                  ],
                },
                {
                  id: 2,
                  raisonSociale: "SANS ADRESSE",
                  adressesOperateurs: [],
                },
              ],
            }),
          ),
      ),
    );

    const result = await fetchNearbyOperators({
      center: PARIS,
      activity: "all",
      query: "",
    });

    expect(result.totalCount).toBe(2);
    expect(result.operators.map(({ name }) => name)).toEqual(["FERME DU PARC"]);
  });

  it("échoue quand la réponse n'a pas la forme attendue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () => new Response(JSON.stringify({ oups: 1 })),
      ),
    );

    await expect(
      fetchNearbyOperators({ center: PARIS, activity: "all", query: "" }),
    ).rejects.toThrow();
  });
});
