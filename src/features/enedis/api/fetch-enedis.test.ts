import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildIrisUrl,
  buildSectorUrl,
  fetchIrisConsumption,
  fetchSectorSeries,
} from "./fetch-enedis";

const stubResults = (results: unknown[], totalCount = results.length) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ total_count: totalCount, results })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildSectorUrl", () => {
  it("interroge le jeu par secteur d'activité pour la commune", () => {
    const url = new URL(buildSectorUrl("33063"));

    expect(url.origin).toBe("https://opendata.enedis.fr");
    expect(url.pathname).toBe(
      "/api/explore/v2.1/catalog/datasets/consommation-electrique-par-secteur-dactivite-commune/records",
    );
    expect(url.searchParams.get("where")).toBe('code_commune = "33063"');
    expect(url.searchParams.get("group_by")).toBe("annee,code_grand_secteur");
    expect(url.searchParams.get("limit")).toBe("100");
  });

  it("refuse un code qui pourrait fausser le filtre", () => {
    expect(() => buildSectorUrl('33063" or 1=1 or "')).toThrow(
      "Code de commune invalide",
    );
    expect(() => buildSectorUrl("123")).toThrow("Code de commune invalide");
  });
});

describe("buildIrisUrl", () => {
  it("filtre sur la commune et l'année, les plus gros quartiers d'abord", () => {
    const url = new URL(buildIrisUrl("75056", 2024));

    expect(url.pathname).toContain(
      "consommation-annuelle-residentielle-par-adresse",
    );
    expect(url.searchParams.get("where")).toBe(
      'code_commune = "75056" and annee = "2024"',
    );
    expect(url.searchParams.get("order_by")).toBe("mwh desc");
    expect(url.searchParams.get("group_by")).toBe("nom_iris,code_iris");
  });

  it("refuse une année invalide ou un code corse mal formé", () => {
    expect(() => buildIrisUrl("33063", 24)).toThrow("Année invalide");
    expect(() => buildIrisUrl("33063", 2024.5)).toThrow("Année invalide");
    expect(() => buildIrisUrl("2C001", 2024)).toThrow(
      "Code de commune invalide",
    );
    expect(() => buildIrisUrl("2A004", 2024)).not.toThrow();
  });
});

describe("fetchSectorSeries", () => {
  it("valide et convertit les lignes", async () => {
    stubResults([
      { annee: "2024", code_grand_secteur: "RESIDENTIEL", mwh: 10, sites: 2 },
      { annee: "nope" },
    ]);

    expect(await fetchSectorSeries("33063")).toEqual([
      { year: 2024, sector: "RESIDENTIEL", mwh: 10, sites: 2 },
    ]);
  });

  it("n'appelle pas le service pour un code invalide", async () => {
    const fetchMock = stubResults([]);

    await expect(fetchSectorSeries("abc")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("échoue quand la réponse n'a pas la forme attendue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () => new Response(JSON.stringify({ oups: 1 })),
      ),
    );

    await expect(fetchSectorSeries("33063")).rejects.toThrow();
  });
});

describe("fetchIrisConsumption", () => {
  it("renvoie les quartiers et leur nombre total", async () => {
    stubResults(
      [{ nom_iris: "Centre", code_iris: "1", mwh: 100, logements: 40 }],
      933,
    );

    expect(await fetchIrisConsumption("75056", 2024)).toEqual({
      rows: [{ code: "1", name: "Centre", mwh: 100, housing: 40 }],
      totalCount: 933,
    });
  });
});
