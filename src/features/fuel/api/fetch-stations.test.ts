import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStationsInArea, MAX_STATIONS, PAGE_SIZE } from "./fetch-stations";

const AREA = { south: 48.82, west: 2.29, north: 48.9, east: 2.41 };

const buildRecord = (id: number) => ({
  id,
  geom: { lon: 2.35, lat: 48.85 },
  adresse: `${id} rue de test`,
  ville: "Paris",
  cp: "75001",
  gazole_prix: null,
  gazole_maj: null,
  e10_prix: 1.9 + id / 10_000,
  e10_maj: "2026-11-04T07:31:00+00:00",
  sp98_prix: null,
  sp98_maj: null,
  sp95_prix: null,
  sp95_maj: null,
  e85_prix: null,
  e85_maj: null,
  gplc_prix: null,
  gplc_maj: null,
});

const stubPagedApi = (totalCount: number) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const count = Math.max(0, Math.min(limit, totalCount - offset));
    const results = Array.from({ length: count }, (_, index) =>
      buildRecord(offset + index),
    );
    return new Response(JSON.stringify({ total_count: totalCount, results }), {
      status: 200,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchStationsInArea", () => {
  it("interroge l'API avec la zone, le carburant et un tri par prix", async () => {
    const fetchMock = stubPagedApi(3);

    await fetchStationsInArea({ area: AREA, fuel: "e10" });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("where")).toBe(
      "in_bbox(geom,48.82,2.29,48.9,2.41) and e10_prix is not null",
    );
    expect(url.searchParams.get("order_by")).toBe("e10_prix,id");
    expect(url.searchParams.get("limit")).toBe(String(PAGE_SIZE));
  });

  it("fait une seule requête quand la zone tient dans une page", async () => {
    const fetchMock = stubPagedApi(42);

    const result = await fetchStationsInArea({ area: AREA, fuel: "e10" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.stations).toHaveLength(42);
    expect(result.totalCount).toBe(42);
    expect(result.isTruncated).toBe(false);
  });

  it("récupère toutes les pages nécessaires", async () => {
    const fetchMock = stubPagedApi(250);

    const result = await fetchStationsInArea({ area: AREA, fuel: "e10" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.stations).toHaveLength(250);
    expect(result.isTruncated).toBe(false);
  });

  it("plafonne le nombre de stations et signale la troncature", async () => {
    const fetchMock = stubPagedApi(1245);

    const result = await fetchStationsInArea({ area: AREA, fuel: "e10" });

    expect(fetchMock).toHaveBeenCalledTimes(MAX_STATIONS / PAGE_SIZE);
    expect(result.stations).toHaveLength(MAX_STATIONS);
    expect(result.totalCount).toBe(1245);
    expect(result.isTruncated).toBe(true);
  });

  it("compte les enregistrements invalides écartés", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              total_count: 2,
              results: [buildRecord(1), { id: 2 }],
            }),
          ),
      ),
    );

    const result = await fetchStationsInArea({ area: AREA, fuel: "e10" });

    expect(result.stations).toHaveLength(1);
    expect(result.rejectedCount).toBe(1);
  });
});
