import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Place } from "../model/place";
import { PlaceSearch } from "./place-search";

const FEATURES = {
  features: [
    {
      geometry: { coordinates: [-0.58, 44.86] },
      properties: {
        label: "Bordeaux",
        type: "municipality",
        citycode: "33063",
        postcode: "33000",
        city: "Bordeaux",
      },
    },
    {
      geometry: { coordinates: [0.24, 49.69] },
      properties: { label: "Bordeaux-Saint-Clair", type: "municipality" },
    },
  ],
};

const renderSearch = (onSelect = vi.fn<(place: Place) => void>()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PlaceSearch
        label="Commune"
        placeholder="Ex. Bordeaux"
        scope="municipality"
        onSelect={onSelect}
      />
    </QueryClientProvider>,
  );
  return onSelect;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlaceSearch", () => {
  it("n'interroge rien tant que la saisie est trop courte", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    renderSearch();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Commune" }),
      "bo",
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("propose des lieux et transmet celui qu'on choisit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response(JSON.stringify(FEATURES))),
    );
    const onSelect = renderSearch();
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Commune" }),
      "bordeaux",
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Bordeaux" }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Bordeaux",
        citycode: "33063",
        position: { lat: 44.86, lng: -0.58 },
      }),
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Commune" })).toHaveValue(
      "Bordeaux",
    );
  });

  it("indique quand rien ne correspond", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () => new Response(JSON.stringify({ features: [] })),
      ),
    );
    renderSearch();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Commune" }),
      "zzzzz",
    );

    expect(
      await screen.findByText("Aucun lieu trouvé.", {
        selector: "p:not(.visually-hidden)",
      }),
    ).toBeInTheDocument();
  });

  it("signale une panne du service", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("oups", { status: 500 })),
    );
    renderSearch();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Commune" }),
      "bordeaux",
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
