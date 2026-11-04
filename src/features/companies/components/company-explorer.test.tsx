import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyExplorer } from "./company-explorer";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const buildRecord = (siren: string, name: string) => ({
  siren,
  nom_complet: name,
  nom_raison_sociale: name,
  nature_juridique: "5710",
  activite_principale: "10.71A",
  tranche_effectif_salarie: "41",
  date_creation: "1995-12-07",
  etat_administratif: "A",
  nombre_etablissements: 3,
  nombre_etablissements_ouverts: 2,
  categorie_entreprise: "ETI",
  siege: {
    adresse: "1 RUE DE LA PAIX 75002 PARIS",
    libelle_commune: "PARIS",
    latitude: "48.869",
    longitude: "2.331",
  },
  dirigeants: [
    {
      nom: "DUPONT",
      prenoms: "MARIE",
      qualite: "Présidente",
      type_dirigeant: "personne physique",
    },
  ],
  finances: { "2024": { ca: 1200000, resultat_net: 50000 } },
});

const buildResponse = (
  results: ReadonlyArray<ReturnType<typeof buildRecord>>,
  totalResults = results.length,
) =>
  new Response(
    JSON.stringify({
      results,
      total_results: totalResults,
      page: 1,
      per_page: 10,
      total_pages: Math.max(1, Math.ceil(totalResults / 10)),
    }),
  );

const renderExplorer = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompanyExplorer />
    </QueryClientProvider>,
  );
};

const searchField = () =>
  screen.getByRole("searchbox", { name: "Nom, SIREN ou SIRET" });

beforeEach(() => {
  window.history.replaceState(null, "", "/entreprises/");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CompanyExplorer", () => {
  it("invite à saisir au moins 3 caractères avant toute requête", () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    renderExplorer();

    expect(
      screen.getByText("Saisissez au moins 3 caractères"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lance la recherche d'un exemple et liste les entreprises", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      buildResponse([
        buildRecord("403052111", "BOULANGERIES PAUL"),
        buildRecord("552032534", "DANONE"),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderExplorer();

    await userEvent.click(screen.getByRole("button", { name: "danone" }));

    expect(
      await screen.findByRole("button", { name: /BOULANGERIES PAUL/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 entreprises trouvées/)).toBeInTheDocument();
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.get("q")).toBe("danone");
    expect(requestedUrl.searchParams.get("etat_administratif")).toBe("A");
  });

  it("affiche la fiche de l'entreprise sélectionnée et la met dans l'URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        buildResponse([buildRecord("403052111", "BOULANGERIES PAUL")]),
      ),
    );
    renderExplorer();
    await userEvent.type(searchField(), "paul");

    await userEvent.click(
      await screen.findByRole("button", { name: /BOULANGERIES PAUL/ }),
    );

    const details = screen.getByRole("article");
    expect(details).toHaveTextContent("SAS");
    expect(details).toHaveTextContent("1 RUE DE LA PAIX 75002 PARIS");
    expect(details).toHaveTextContent("Marie Dupont");
    expect(
      screen.getByRole("button", { name: /BOULANGERIES PAUL/ }),
    ).toHaveAttribute("aria-current", "true");
    await waitFor(() =>
      expect(window.location.search).toBe("?q=paul&siren=403052111"),
    );
  });

  it("déplace le focus sur le titre de la fiche à la sélection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        buildResponse([buildRecord("403052111", "BOULANGERIES PAUL")]),
      ),
    );
    renderExplorer();
    await userEvent.type(searchField(), "paul");

    await userEvent.click(
      await screen.findByRole("button", { name: /BOULANGERIES PAUL/ }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: "BOULANGERIES PAUL" }),
      ).toHaveFocus(),
    );
  });

  it("inclut les entreprises cessées quand on décoche le filtre", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => buildResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    renderExplorer();
    await userEvent.type(searchField(), "zzzzz");
    await screen.findByText("Aucune entreprise trouvée", {
      selector: "h3, p, strong, div",
    });

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Entreprises en activité uniquement",
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const lastUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(lastUrl.searchParams.has("etat_administratif")).toBe(false);
  });

  it("signale l'échec de l'API et propose de réessayer", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("oups", { status: 500 }))
      .mockResolvedValueOnce(
        buildResponse([buildRecord("403052111", "BOULANGERIES PAUL")]),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderExplorer();
    await userEvent.type(searchField(), "paul");

    expect(await screen.findByText("Recherche impossible")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("button", { name: /BOULANGERIES PAUL/ }),
    ).toBeInTheDocument();
  });

  it("pagine les résultats", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      buildResponse([buildRecord("403052111", "BOULANGERIES PAUL")], 25),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderExplorer();
    await userEvent.type(searchField(), "paul");
    await screen.findByText("Page 1 sur 3");

    await userEvent.click(screen.getByRole("button", { name: /Suivant/ }));

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      expect(new URL(String(lastCall?.[0])).searchParams.get("page")).toBe("2");
    });
    expect(screen.getByRole("button", { name: /Précédent/ })).toBeEnabled();
  });
});
