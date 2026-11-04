import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchObservedTariffs, fetchStationTariffs } from "./fetch-tariffs";

const stubGroups = (groups: { tarification: string | null; n: number }[]) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(
        JSON.stringify({ total_count: groups.length, results: groups }),
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchStationTariffs", () => {
  it("interroge la station demandée et lit les prix au kWh", async () => {
    const fetchMock = stubGroups([
      { tarification: "0,39 € / kWh", n: 3 },
      { tarification: "https://exemple.test/tarifs", n: 1 },
    ]);

    const tariffs = await fetchStationTariffs("FRELCPCOUHI");

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("where")).toContain(
      'id_station_itinerance = "FRELCPCOUHI"',
    );
    expect(tariffs).toEqual([
      { text: "0,39 € / kWh", pricePerKwh: 0.39 },
      { text: "https://exemple.test/tarifs", pricePerKwh: null },
    ]);
  });

  it("refuse un identifiant qui pourrait fausser la requête", async () => {
    const fetchMock = stubGroups([]);

    await expect(fetchStationTariffs('X" or 1=1 or "')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchObservedTariffs", () => {
  it("calcule le tarif médian pondéré à partir des textes lisibles", async () => {
    stubGroups([
      { tarification: "0,29€ / kWh", n: 100 },
      { tarification: "0,59€ / kWh", n: 10 },
      { tarification: "https://exemple.test", n: 500 },
    ]);

    const observed = await fetchObservedTariffs();

    expect(observed.normal).toEqual({ medianPerKwh: 0.29, sampleSize: 110 });
    expect(observed.fast).toEqual({ medianPerKwh: 0.29, sampleSize: 110 });
  });

  it("renvoie null quand aucun texte n'est lisible", async () => {
    stubGroups([{ tarification: "https://exemple.test", n: 5 }]);

    await expect(fetchObservedTariffs()).resolves.toEqual({
      normal: null,
      fast: null,
    });
  });
});
