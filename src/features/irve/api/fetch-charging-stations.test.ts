import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchChargingStationsInArea,
  MAX_GROUPS,
  PAGE_SIZE,
} from "./fetch-charging-stations";

const AREA = { south: 48.8, west: 2.25, north: 48.92, east: 2.45 };

const buildGroup = (index: number) => ({
  id_station_itinerance: `FR${index}`,
  nom_station: `Station ${index}`,
  nom_enseigne: null,
  nom_operateur: "OP",
  adresse_station: `${index} rue de test`,
  condition_acces: null,
  horaires: null,
  gratuit: "false",
  prise_type_2: "true",
  prise_type_combo_ccs: "false",
  prise_type_chademo: "false",
  prise_type_ef: "false",
  pdc: 2,
  max_kw: 22,
  lat: 48.85,
  lon: 2.35,
  maj: null,
});

const stubPagedApi = (totalGroups: number) => {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const count = Math.max(0, Math.min(limit, totalGroups - offset));
    const results = Array.from({ length: count }, (_, index) =>
      buildGroup(offset + index),
    );
    return new Response(JSON.stringify({ total_count: count, results }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchChargingStationsInArea", () => {
  it("filtre sur les coordonnées consolidées et trie par puissance", async () => {
    const fetchMock = stubPagedApi(3);

    await fetchChargingStationsInArea({ area: AREA, minPowerKw: 0 });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("where")).toBe(
      "consolidated_latitude >= 48.8 and consolidated_latitude <= 48.92 and consolidated_longitude >= 2.25 and consolidated_longitude <= 2.45",
    );
    expect(url.searchParams.get("order_by")).toBe(
      "max_kw desc, id_station_itinerance",
    );
    expect(url.searchParams.get("group_by")).toContain("id_station_itinerance");
  });

  it("ajoute la puissance minimale au filtre", async () => {
    const fetchMock = stubPagedApi(1);

    await fetchChargingStationsInArea({ area: AREA, minPowerKw: 50 });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("where")).toContain("puissance_nominale >= 50");
  });

  it("fait une seule requête quand la première page n'est pas pleine", async () => {
    const fetchMock = stubPagedApi(40);

    const result = await fetchChargingStationsInArea({
      area: AREA,
      minPowerKw: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.stations).toHaveLength(40);
    expect(result.isTruncated).toBe(false);
  });

  it("poursuit tant que les pages sont pleines et signale la troncature", async () => {
    const fetchMock = stubPagedApi(1000);

    const result = await fetchChargingStationsInArea({
      area: AREA,
      minPowerKw: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(MAX_GROUPS / PAGE_SIZE);
    expect(result.stations).toHaveLength(MAX_GROUPS);
    expect(result.isTruncated).toBe(true);
  });

  it("propose les stations fusionnées même si plusieurs groupes en font partie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              total_count: 2,
              results: [buildGroup(1), buildGroup(1)],
            }),
          ),
      ),
    );

    const result = await fetchChargingStationsInArea({
      area: AREA,
      minPowerKw: 0,
    });

    expect(result.stations).toHaveLength(1);
    expect(result.stations[0]?.pointCount).toBe(4);
  });
});
