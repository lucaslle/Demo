import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

const buildRecord = (code: string, e10: number, stations = 40) => ({
  code_departement: code,
  stations,
  gazole: e10 + 0.2,
  e10,
  sp98: e10 + 0.1,
  sp95: null,
  e85: null,
  gplc: null,
  n_gazole: stations,
  n_e10: stations,
  n_sp98: stations,
  n_sp95: 0,
  n_e85: 0,
  n_gplc: 0,
  last_update: "2026-11-04T11:39:58+00:00",
});

const renderHome = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            total_count: 3,
            results: [
              buildRecord("15", 1.89),
              buildRecord("75", 2.09),
              buildRecord("13", 1.95),
            ],
          }),
        ),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("affiche le titre principal de l'application", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: /autour de vous/ }),
    ).toBeInTheDocument();
  });

  it("expose la zone de contenu ciblée par le lien d'évitement", () => {
    renderHome();

    expect(screen.getByRole("main")).toHaveAttribute("id", "contenu");
  });

  it("ouvre la carte des carburants depuis le héros et depuis le répertoire", () => {
    renderHome();

    const links = screen
      .getAllByRole("link")
      .filter((link) =>
        /^(Voir les prix des )?carburants$/i.test(
          link.textContent?.trim() ?? "",
        ),
      );

    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/carburants\/?$/);
    }
  });

  it("liste les modules par catégorie, dont les trois API d'entreprises et d'emploi", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 3, name: "Entreprises et emploi" }),
    ).toBeInTheDocument();
    for (const name of [
      "Recherche d'entreprises",
      "Producteurs et commerces bio",
      "Emploi et salaires",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("liste les trois API d'immobilier et d'énergie sous leur catégorie", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 3, name: "Immobilier et énergie" }),
    ).toBeInTheDocument();
    for (const [name, href] of [
      ["Ventes immobilières", "/immobilier/"],
      ["Diagnostics énergétiques", "/dpe/"],
      ["Consommation électrique", "/electricite/"],
    ] as const) {
      expect(
        screen
          .getByRole("link", { name })
          .getAttribute("href")
          ?.replace(/\/$/, ""),
      ).toBe(href.replace(/\/$/, ""));
    }
  });

  it("présente les modules à venir sans les rendre cliquables", () => {
    renderHome();

    expect(
      screen.queryByRole("link", { name: "Équipements sportifs" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Bientôt")).toHaveLength(2);
  });

  it("indique qu'aucune clé API n'est nécessaire", () => {
    renderHome();

    expect(screen.getAllByText("Sans clé API").length).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("filtre les modules avec la recherche", async () => {
    renderHome();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Rechercher un module" }),
      "urssaf",
    );

    expect(
      screen.getByRole("link", { name: "Emploi et salaires" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Carburants" }),
    ).not.toBeInTheDocument();
  });

  it("propose un message clair quand rien ne correspond", async () => {
    renderHome();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Rechercher un module" }),
      "zzzzzz",
    );

    expect(screen.getByText("Aucun module ne correspond")).toBeInTheDocument();
  });

  it("hiérarchise les titres : un h1, des h2 et des h3", () => {
    renderHome();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "Prix moyen par département",
      "Explorer les données",
      "Sous le capot",
    ]);
  });

  it("affiche les statistiques et les classements issus des données en direct", async () => {
    renderHome();

    const cheapest = await screen.findByRole("heading", {
      name: "Les moins chers",
    });
    const list = cheapest.nextElementSibling as HTMLElement;

    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(/1,890/);
    expect(screen.getByText("Stations suivies")).toBeInTheDocument();
  });

  it("garde la carte décorative masquée aux lecteurs d'écran", () => {
    const { container } = renderHome();

    const svg = container.querySelector("svg[viewBox]");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
