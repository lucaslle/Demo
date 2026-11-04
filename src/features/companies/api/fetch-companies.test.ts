import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCompanyBySiren, searchCompanies } from "./fetch-companies";

const record = (siren: string, name = "DANONE") => ({
  siren,
  nom_complet: name,
  etat_administratif: "A",
  nombre_etablissements: 1,
  nombre_etablissements_ouverts: 1,
});

const stubApi = (results: unknown[], totalResults = results.length) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(
        JSON.stringify({
          results,
          total_results: totalResults,
          page: 1,
          per_page: 10,
          total_pages: Math.ceil(totalResults / 10),
        }),
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchCompanies", () => {
  it("interroge l'API avec le terme, la page et le filtre d'activité", async () => {
    const fetchMock = stubApi([record("552032534")], 509);

    const page = await searchCompanies({
      query: " danone ",
      onlyActive: true,
      page: 2,
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("q")).toBe("danone");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("10");
    expect(url.searchParams.get("etat_administratif")).toBe("A");
    expect(page.totalResults).toBe(509);
    expect(page.totalPages).toBe(51);
  });

  it("n'ajoute pas le filtre d'activité quand on cherche aussi les cessées", async () => {
    const fetchMock = stubApi([]);

    await searchCompanies({ query: "danone", onlyActive: false, page: 1 });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.has("etat_administratif")).toBe(false);
  });

  it("n'appelle pas l'API sous trois caractères", async () => {
    const fetchMock = stubApi([]);

    const page = await searchCompanies({
      query: "ab",
      onlyActive: true,
      page: 1,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(page.companies).toEqual([]);
  });

  it("borne la pagination à la limite de l'API", async () => {
    const fetchMock = stubApi([], 100000);

    const page = await searchCompanies({
      query: "total",
      onlyActive: true,
      page: 9999,
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("page")).toBe("400");
    expect(page.totalPages).toBe(400);
  });
});

describe("fetchCompanyBySiren", () => {
  it("renvoie la fiche dont le SIREN correspond exactement", async () => {
    stubApi([record("111111111", "AUTRE"), record("552032534")]);

    const company = await fetchCompanyBySiren("552032534");

    expect(company?.name).toBe("DANONE");
  });

  it("renvoie null pour un SIREN mal formé, sans appeler l'API", async () => {
    const fetchMock = stubApi([]);

    await expect(fetchCompanyBySiren("../x")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie null quand aucune fiche ne correspond", async () => {
    stubApi([record("111111111")]);

    await expect(fetchCompanyBySiren("552032534")).resolves.toBeNull();
  });
});
