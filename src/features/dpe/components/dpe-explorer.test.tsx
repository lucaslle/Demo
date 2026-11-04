import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DpeExplorer } from "./dpe-explorer";

const searchParams = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParams.value),
}));

const labelBuckets = [
  { total: 10, value: "A", metric: 50 },
  { total: 10, value: "B", metric: 90 },
  { total: 60, value: "C", metric: 150 },
  { total: 10, value: "F", metric: 380 },
  { total: 10, value: "G", metric: 520 },
];

const respond = (url: URL, total = 100): Response => {
  if (url.hostname === "geo.api.gouv.fr") {
    return new Response(JSON.stringify({ code: "33063", nom: "Bordeaux" }));
  }
  if (url.pathname.endsWith("/metric_agg")) {
    return new Response(JSON.stringify({ total, metric: "2026-10-25" }));
  }
  if (url.searchParams.get("field") === "periode_construction") {
    return new Response(
      JSON.stringify({ total, aggs: [{ total, value: "avant 1948" }] }),
    );
  }
  return new Response(
    JSON.stringify({ total, aggs: total === 0 ? [] : labelBuckets }),
  );
};

const renderExplorer = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DpeExplorer />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  searchParams.value = "";
  window.history.replaceState(null, "", "/dpe/");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DpeExplorer", () => {
  it("invite à choisir une commune sans rien interroger", () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    renderExplorer();

    expect(screen.getByText("Choisissez une commune")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bordeaux" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("affiche les indicateurs et la répartition après le choix d'un exemple", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => respond(new URL(String(input)))),
    );
    renderExplorer();

    await userEvent.click(screen.getByRole("button", { name: "Bordeaux" }));

    const failures = await screen.findByText("Classés F ou G");
    const kpi = failures.closest("div");
    expect(kpi).toHaveTextContent(/20,0\s%/);
    expect(screen.getByText("Classés A ou B").closest("div")).toHaveTextContent(
      /20,0\s%/,
    );
    const bars = screen.getByRole("list", {
      name: "Diagnostics par étiquette, de A à G",
    });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(7);
    expect(
      screen.getByRole("list", {
        name: "Diagnostics par période de construction",
      }),
    ).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe("?commune=33063"));
  });

  it("lit la commune et le parc dans l'URL", async () => {
    searchParams.value = "commune=33063&parc=tertiaire&etiquette=ges";
    const fetchMock = vi.fn<typeof fetch>(async (input) =>
      respond(new URL(String(input))),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderExplorer();

    expect(await screen.findByText("Classés F ou G")).toBeInTheDocument();
    const urls = fetchMock.mock.calls.map(([input]) => new URL(String(input)));
    expect(
      urls.some(
        ({ pathname, searchParams: params }) =>
          pathname.includes("j9ol0fwjqckyf49vr29nknbu") &&
          params.get("field") === "etiquette_ges",
      ),
    ).toBe(true);
    expect(
      screen.queryByText("Répartition par période de construction"),
    ).not.toBeInTheDocument();
  });

  it("indique quand la commune n'a aucun diagnostic", async () => {
    searchParams.value = "commune=33063&parc=tertiaire";
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => respond(new URL(String(input)), 0)),
    );

    renderExplorer();

    expect(
      await screen.findByText("Aucun diagnostic pour cette sélection"),
    ).toBeInTheDocument();
  });

  it("signale une panne et permet de réessayer", async () => {
    searchParams.value = "commune=33063";
    let shouldFail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        if (url.hostname === "geo.api.gouv.fr") {
          return respond(url);
        }
        return shouldFail
          ? new Response("oups", { status: 500 })
          : respond(url);
      }),
    );
    renderExplorer();

    expect(
      await screen.findByText("Impossible de charger les diagnostics"),
    ).toBeInTheDocument();

    shouldFail = false;
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Classés F ou G")).toBeInTheDocument();
  });

  it("n'affiche aucune adresse ni ligne individuelle", async () => {
    searchParams.value = "commune=33063";
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => respond(new URL(String(input)))),
    );
    renderExplorer();

    await screen.findByText("Classés F ou G");

    expect(screen.queryByText(/rue |avenue |boulevard /i)).toBeNull();
  });
});
