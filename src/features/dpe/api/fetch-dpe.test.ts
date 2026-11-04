import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildLabelsUrl,
  buildLastDateUrl,
  buildPeriodsUrl,
  fetchDpeSummary,
} from "./fetch-dpe";

const LOGEMENTS = "meg-83tjwtg8dyz4vv7h1dqe";
const TERTIAIRE = "j9ol0fwjqckyf49vr29nknbu";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("construction des URL", () => {
  it("demande uniquement des comptes et une moyenne, sans lignes de diagnostics", () => {
    const url = new URL(
      buildLabelsUrl({ communeCode: "33063", parc: "logements" }, "dpe"),
    );

    expect(url.pathname).toBe(
      `/data-fair/api/v1/datasets/${LOGEMENTS}/values_agg`,
    );
    expect(url.searchParams.get("field")).toBe("etiquette_dpe");
    expect(url.searchParams.get("size")).toBe("0");
    expect(url.searchParams.get("qs")).toBe('code_insee_ban:"33063"');
    expect(url.searchParams.get("metric")).toBe("avg");
    expect(url.searchParams.get("metric_field")).toBe(
      "conso_5_usages_par_m2_ep",
    );
  });

  it("utilise le champ climat et le jeu tertiaire quand on le demande", () => {
    const url = new URL(
      buildLabelsUrl({ communeCode: "2A004", parc: "tertiaire" }, "ges"),
    );

    expect(url.pathname).toContain(TERTIAIRE);
    expect(url.searchParams.get("field")).toBe("etiquette_ges");
    expect(url.searchParams.get("metric_field")).toBe("conso_kwhep_m2_an");
    expect(url.searchParams.get("qs")).toBe('code_insee_ban:"2A004"');
  });

  it("ne propose les périodes de construction que pour les logements", () => {
    expect(
      buildPeriodsUrl({ communeCode: "33063", parc: "tertiaire" }),
    ).toBeNull();
    const url = new URL(
      buildPeriodsUrl({ communeCode: "33063", parc: "logements" }) ?? "",
    );
    expect(url.searchParams.get("field")).toBe("periode_construction");
  });

  it("cherche la date du diagnostic le plus récent", () => {
    const url = new URL(
      buildLastDateUrl({ communeCode: "33063", parc: "logements" }),
    );

    expect(url.pathname.endsWith("/metric_agg")).toBe(true);
    expect(url.searchParams.get("metric")).toBe("max");
    expect(url.searchParams.get("field")).toBe("date_etablissement_dpe");
  });

  it("refuse un code de commune qui pourrait fausser le filtre", () => {
    for (const communeCode of [
      '33063" OR code_insee_ban:"75056',
      "../x",
      "abc",
    ]) {
      expect(() =>
        buildLabelsUrl({ communeCode, parc: "logements" }, "dpe"),
      ).toThrow("Code de commune invalide");
    }
  });
});

describe("fetchDpeSummary", () => {
  const stubApi = () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      const field = url.searchParams.get("field");
      if (url.pathname.endsWith("/metric_agg")) {
        return new Response(
          JSON.stringify({ total: 10, metric: "2026-10-25" }),
        );
      }
      if (field === "periode_construction") {
        return new Response(
          JSON.stringify({
            total: 10,
            aggs: [{ total: 10, value: "avant 1948" }],
          }),
        );
      }
      return new Response(
        JSON.stringify({
          total: 10,
          aggs: [
            { total: 6, value: "C", metric: 100 },
            { total: 4, value: "F", metric: 300 },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("assemble le résumé des logements avec trois requêtes", async () => {
    const fetchMock = stubApi();

    const summary = await fetchDpeSummary({
      communeCode: "33063",
      parc: "logements",
      kind: "dpe",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(summary.total).toBe(10);
    expect(summary.averageConsumption).toBeCloseTo(180, 10);
    expect(summary.lastDiagnosticDate).toBe("2026-10-25");
    expect(summary.periods).toEqual([{ period: "avant 1948", count: 10 }]);
    expect(summary.counts.find(({ label }) => label === "F")?.count).toBe(4);
  });

  it("n'interroge pas les périodes pour le tertiaire", async () => {
    const fetchMock = stubApi();

    const summary = await fetchDpeSummary({
      communeCode: "33063",
      parc: "tertiaire",
      kind: "dpe",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(summary.periods).toEqual([]);
  });

  it("échoue quand le service répond en erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("oups", { status: 500 })),
    );

    await expect(
      fetchDpeSummary({ communeCode: "33063", parc: "logements", kind: "dpe" }),
    ).rejects.toThrow();
  });
});
