import { afterEach, describe, expect, it, vi } from "vitest";
import { findBranchByCode, findSectorByKey } from "../model/employment";
import { DEFAULT_TERRITORY, findTerritory } from "../model/territories";
import {
  fetchEmploymentSeries,
  fetchSectorBreakdown,
} from "./fetch-employment";

const stubResults = (results: unknown[]) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ total_count: results.length, results })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const urlOf = (fetchMock: ReturnType<typeof stubResults>) =>
  new URL(String(fetchMock.mock.calls[0]?.[0]));

const paris = findTerritory("75");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchEmploymentSeries", () => {
  it("n'applique aucun filtre pour la France entière", async () => {
    const fetchMock = stubResults([]);

    await fetchEmploymentSeries({ territory: DEFAULT_TERRITORY, sector: null });

    const url = urlOf(fetchMock);
    expect(url.searchParams.has("where")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("100");
    expect(url.searchParams.get("order_by")).toBe(
      "dernier_jour_du_trimestre desc",
    );
  });

  it("filtre sur le département et le secteur choisis", async () => {
    const fetchMock = stubResults([]);

    await fetchEmploymentSeries({
      territory: paris ?? DEFAULT_TERRITORY,
      sector: findSectorByKey("gs3") ?? null,
    });

    expect(urlOf(fetchMock).searchParams.get("where")).toBe(
      'code_departement = "75" and grand_secteur_d_activite = "GS3 Commerce"',
    );
  });

  it("interroge le jeu par branche pour l'informatique", async () => {
    const fetchMock = stubResults([]);

    await fetchEmploymentSeries({
      territory: DEFAULT_TERRITORY,
      sector: null,
      branch: findBranchByCode("JC") ?? null,
    });

    const url = urlOf(fetchMock);
    expect(url.pathname).toContain("france-entiere-x-na88");
    expect(url.searchParams.get("where")).toBe(
      'secteur_na38i = "JC Activités informatiques"',
    );
  });

  it("refuse une branche hors France entière ou inconnue", async () => {
    const fetchMock = stubResults([]);
    const informatics = findBranchByCode("JC") ?? null;

    await expect(
      fetchEmploymentSeries({
        territory: paris ?? DEFAULT_TERRITORY,
        sector: null,
        branch: informatics,
      }),
    ).rejects.toThrow("France entière");
    await expect(
      fetchEmploymentSeries({
        territory: DEFAULT_TERRITORY,
        sector: null,
        branch: { code: 'JC" or 1=1 or "', name: "x", label: "x" },
      }),
    ).rejects.toThrow("Branche invalide");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie la série triée du plus ancien au plus récent", async () => {
    stubResults([
      {
        dernier_jour_du_trimestre: "2026-06-30T00:00:00+00:00",
        annee: "2026-01-01T00:00:00+00:00",
        trimestre: 2,
        effectifs: 20,
        masse: 2,
      },
      {
        dernier_jour_du_trimestre: "2026-03-31T00:00:00+00:00",
        annee: "2026-01-01T00:00:00+00:00",
        trimestre: 1,
        effectifs: 10,
        masse: 1,
      },
    ]);

    const series = await fetchEmploymentSeries({
      territory: DEFAULT_TERRITORY,
      sector: null,
    });

    expect(series.map(({ label }) => label)).toEqual(["T1 2026", "T2 2026"]);
  });

  it("refuse un code de département qui pourrait fausser la requête", async () => {
    const fetchMock = stubResults([]);

    await expect(
      fetchEmploymentSeries({
        territory: { code: '75" or 1=1 or "', name: "Pirate" },
        sector: null,
      }),
    ).rejects.toThrow("Code de département invalide");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchSectorBreakdown", () => {
  it("interroge le trimestre demandé, groupé par secteur", async () => {
    const fetchMock = stubResults([
      { grand_secteur_d_activite: "GS3 Commerce", e: 10, m: 5 },
    ]);

    const shares = await fetchSectorBreakdown({
      territory: paris ?? DEFAULT_TERRITORY,
      date: "2026-06-30",
    });

    const url = urlOf(fetchMock);
    expect(url.searchParams.get("group_by")).toBe("grand_secteur_d_activite");
    expect(url.searchParams.get("where")).toBe(
      "code_departement = \"75\" and dernier_jour_du_trimestre = date'2026-06-30'",
    );
    expect(shares).toHaveLength(1);
  });

  it("refuse une date mal formée", async () => {
    stubResults([]);

    await expect(
      fetchSectorBreakdown({
        territory: DEFAULT_TERRITORY,
        date: "2026-06-30' or 1=1",
      }),
    ).rejects.toThrow("Date invalide");
  });
});
