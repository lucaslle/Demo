import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDepartmentPrices } from "./fetch-department-prices";

const record = {
  code_departement: "75",
  stations: 100,
  gazole: 2.2,
  e10: 2.0,
  sp98: 2.1,
  sp95: null,
  e85: null,
  gplc: null,
  n_gazole: 100,
  n_e10: 80,
  n_sp98: 50,
  n_sp95: 0,
  n_e85: 0,
  n_gplc: 0,
  last_update: "2026-11-04T11:39:58+00:00",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchDepartmentPrices", () => {
  it("interroge l'API avec un regroupement par département", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ total_count: 1, results: [record] })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const prices = await fetchDepartmentPrices();

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("group_by")).toBe("code_departement");
    expect(url.searchParams.get("select")).toContain("avg(e10_prix) as e10");
    expect(prices.departments).toHaveLength(1);
    expect(prices.totalStations).toBe(100);
  });

  it("propage une erreur HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );

    await expect(fetchDepartmentPrices()).rejects.toMatchObject({
      kind: "http",
      status: 503,
    });
  });
});
