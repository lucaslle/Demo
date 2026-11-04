import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElectricityExplorer } from "./electricity-explorer";

const mocks = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("./electricity-chart", () => ({
  ElectricityChart: () => <div data-testid="chart" />,
}));

const SECTOR_ROWS = [
  { annee: "2024", code_grand_secteur: "RESIDENTIEL", mwh: 600, sites: 200 },
  { annee: "2024", code_grand_secteur: "TERTIAIRE", mwh: 300, sites: 20 },
  { annee: "2024", code_grand_secteur: "INDUSTRIE", mwh: 100, sites: 2 },
  { annee: "2023", code_grand_secteur: "RESIDENTIEL", mwh: 500, sites: 200 },
  { annee: "2023", code_grand_secteur: "TERTIAIRE", mwh: 300, sites: 20 },
];

const IRIS_ROWS = [
  { nom_iris: "Gare", code_iris: "1", mwh: 1000, logements: 200 },
  { nom_iris: "Centre", code_iris: "2", mwh: 600, logements: 200 },
  { nom_iris: "Fictif - Bordeaux", code_iris: "3", mwh: 9, logements: 66 },
];

type Handlers = {
  sector?: () => Response;
  iris?: (url: URL) => Response;
};

const json = (body: unknown): Response => new Response(JSON.stringify(body));

const stubApi = ({ sector, iris }: Handlers = {}) => {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.hostname === "geo.api.gouv.fr") {
      return json({ code: "33063", nom: "Bordeaux" });
    }
    if (url.pathname.includes("secteur-dactivite")) {
      return (
        sector?.() ??
        json({ total_count: SECTOR_ROWS.length, results: SECTOR_ROWS })
      );
    }
    return (
      iris?.(url) ?? json({ total_count: IRIS_ROWS.length, results: IRIS_ROWS })
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const renderExplorer = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ElectricityExplorer />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  mocks.search = "";
  window.history.replaceState(null, "", "/electricite/");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ElectricityExplorer", () => {
  it("invite à choisir une commune et propose des exemples", () => {
    const fetchMock = stubApi();

    renderExplorer();

    expect(screen.getByText("Choisissez une commune")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bordeaux" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("charge la commune d'un exemple et la met dans l'URL", async () => {
    stubApi();
    renderExplorer();

    await userEvent.click(screen.getByRole("button", { name: "Bordeaux" }));

    expect(
      await screen.findByRole("heading", { level: 2, name: /Bordeaux/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.search).toBe("?commune=33063&annee=2024"),
    );
  });

  it("affiche les indicateurs de l'année la plus récente et leur évolution", async () => {
    mocks.search = "?commune=33063";
    stubApi();

    renderExplorer();

    const total = (await screen.findByText("Consommation totale")).closest(
      "div",
    );
    expect(total).toHaveTextContent("1 000 MWh");
    expect(total).toHaveTextContent("+25");
    expect(total).toHaveTextContent("vs 2023");
    expect(
      screen.getAllByText("Par site résidentiel")[0]?.closest("div"),
    ).toHaveTextContent("3 MWh");
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });

  it("classe les quartiers par consommation par logement sans les regroupements fictifs", async () => {
    mocks.search = "?commune=33063";
    stubApi();

    renderExplorer();

    const section = (
      await screen.findByRole("heading", { name: /Quartiers/ })
    ).closest("section") as HTMLElement;
    const items = await within(section).findAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Gare"),
      expect.stringContaining("Centre"),
    ]);
    expect(within(section).queryByText(/Fictif/)).not.toBeInTheDocument();
  });

  it("recharge le détail par quartier quand on change d'année", async () => {
    mocks.search = "?commune=33063";
    const fetchMock = stubApi();
    renderExplorer();
    await screen.findByText("Consommation totale");

    await userEvent.selectOptions(screen.getByLabelText("Année"), "2023");

    await waitFor(() => {
      const irisUrls = fetchMock.mock.calls
        .map(([input]) => new URL(String(input)))
        .filter((url) => url.pathname.includes("residentielle-par-adresse"));
      expect(irisUrls.at(-1)?.searchParams.get("where")).toContain(
        'annee = "2023"',
      );
    });
    expect(screen.getAllByText(/vs 2022/)).toHaveLength(3);
  });

  it("garde une année demandée dans l'URL quand elle existe", async () => {
    mocks.search = "?commune=33063&annee=2023";
    stubApi();

    renderExplorer();

    expect(await screen.findByLabelText("Année")).toHaveValue("2023");
  });

  it("explique l'absence de données pour une commune non desservie", async () => {
    mocks.search = "?commune=2A004";
    stubApi({ sector: () => json({ total_count: 0, results: [] }) });

    renderExplorer();

    expect(
      await screen.findByText("Aucune donnée pour cette commune"),
    ).toBeInTheDocument();
  });

  it("signale une panne et permet de réessayer", async () => {
    mocks.search = "?commune=33063";
    let shouldFail = true;
    stubApi({
      sector: () =>
        shouldFail
          ? new Response("oups", { status: 500 })
          : json({ total_count: SECTOR_ROWS.length, results: SECTOR_ROWS }),
    });
    renderExplorer();

    expect(
      await screen.findByText("Impossible de charger les données"),
    ).toBeInTheDocument();

    shouldFail = false;
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Consommation totale")).toBeInTheDocument();
  });

  it("garde la page quand seul le détail par quartier échoue", async () => {
    mocks.search = "?commune=33063";
    stubApi({ iris: () => new Response("oups", { status: 500 }) });

    renderExplorer();

    expect(
      await screen.findByText("Détail par quartier indisponible"),
    ).toBeInTheDocument();
    expect(screen.getByText("Consommation totale")).toBeInTheDocument();
  });

  it("n'affiche pas de classement quand la commune n'a pas de détail par quartier", async () => {
    mocks.search = "?commune=33063";
    stubApi({ iris: () => json({ total_count: 0, results: [] }) });

    renderExplorer();

    expect(
      await screen.findByText(/Pas de détail par quartier/),
    ).toBeInTheDocument();
  });
});
