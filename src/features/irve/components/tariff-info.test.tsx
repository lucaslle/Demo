import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TariffInfo } from "./tariff-info";

const stubTariffs = (groups: { tarification: string; n: number }[]) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ total_count: groups.length, results: groups }),
        ),
    ),
  );
};

const renderInfo = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TariffInfo stationId="FRELCPCOUHI" />
    </QueryClientProvider>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TariffInfo", () => {
  it("affiche le prix au kWh quand il est lisible", async () => {
    stubTariffs([{ tarification: "0,39 € / kWh", n: 1 }]);

    renderInfo();

    expect(await screen.findByText(/0,390/)).toBeInTheDocument();
  });

  it("renvoie vers l'opérateur quand le tarif n'est qu'un lien", async () => {
    stubTariffs([{ tarification: "https://belib.paris", n: 1 }]);

    renderInfo();

    const link = await screen.findByRole("link", {
      name: /tarifs de l'opérateur/,
    });
    expect(link).toHaveAttribute("href", "https://belib.paris");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("n'invente aucun tarif quand l'opérateur n'en donne pas", async () => {
    stubTariffs([]);

    renderInfo();

    expect(await screen.findByText(/non communiqué/)).toBeInTheDocument();
  });

  it("ne rend pas cliquable un texte qui n'est pas un lien http", async () => {
    stubTariffs([{ tarification: "javascript:alert(1)", n: 1 }]);

    renderInfo();

    await screen.findByText(/Tarif/);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
