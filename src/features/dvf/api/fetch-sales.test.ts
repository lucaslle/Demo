import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSalesUrl, fetchSales } from "./fetch-sales";

const CENTER = { lat: 44.84, lng: -0.58 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildSalesUrl", () => {
  it("interroge une zone qui respecte la limite de 0,02° de l'API", () => {
    const url = new URL(
      buildSalesUrl({ center: CENTER, property: "all", sinceYear: 2023 }),
    );
    const [west, south, east, north] = (url.searchParams.get("in_bbox") ?? "")
      .split(",")
      .map(Number);

    expect((east ?? 0) - (west ?? 0)).toBeLessThanOrEqual(0.02);
    expect((north ?? 0) - (south ?? 0)).toBeLessThanOrEqual(0.02);
    expect(url.searchParams.get("anneemut_min")).toBe("2023");
    expect(url.searchParams.get("page_size")).toBe("500");
    expect(url.searchParams.has("codtypbien")).toBe(false);
  });

  it("filtre sur le type de bien choisi", () => {
    const url = (property: "apartments" | "houses") =>
      new URL(buildSalesUrl({ center: CENTER, property, sinceYear: 2023 }));

    expect(url("apartments").searchParams.get("codtypbien")).toBe("121");
    expect(url("houses").searchParams.get("codtypbien")).toBe("111");
  });
});

describe("fetchSales", () => {
  it("valide la réponse et signale une zone plafonnée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({
              count: 1200,
              features: [
                {
                  id: 1,
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [-0.58, 44.84],
                        [-0.5798, 44.84],
                        [-0.5798, 44.8402],
                        [-0.58, 44.84],
                      ],
                    ],
                  },
                  properties: {
                    datemut: "2025-03-01",
                    valeurfonc: "250000",
                    sbati: "50",
                    codtypbien: "121",
                  },
                },
              ],
            }),
          ),
      ),
    );

    const result = await fetchSales({
      center: CENTER,
      property: "all",
      sinceYear: 2023,
    });

    expect(result.sales).toHaveLength(1);
    expect(result.totalCount).toBe(1200);
    expect(result.isTruncated).toBe(true);
  });

  it("échoue quand la réponse n'a pas la forme attendue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () =>
          new Response(JSON.stringify({ detail: "Emprise trop grande" })),
      ),
    );

    await expect(
      fetchSales({ center: CENTER, property: "all", sinceYear: 2023 }),
    ).rejects.toThrow();
  });
});
