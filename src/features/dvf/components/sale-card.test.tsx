import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Sale } from "../model/sale";
import { PriceStatsCard } from "./price-stats-card";
import { SaleCard } from "./sale-card";
import { SaleList } from "./sale-list";

const buildSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: "1",
  date: "2025-12-23",
  price: 300_000,
  builtSurface: 60,
  landSurface: 120,
  pricePerSqm: 5000,
  typeCode: "121",
  typeLabel: "UN APPARTEMENT",
  nature: "Vente",
  isOffPlan: false,
  lotCount: 2,
  parcel: "PO 17",
  position: { lat: 44.84, lng: -0.58 },
  ...overrides,
});

describe("SaleCard", () => {
  it("détaille le prix, le prix au m², les surfaces et la parcelle", () => {
    render(<SaleCard sale={buildSale()} onClose={vi.fn()} />);

    const card = screen.getByRole("region", { name: "Vente choisie" });
    expect(card).toHaveTextContent("300 000 €");
    expect(card).toHaveTextContent("5 000 €/m²");
    expect(card).toHaveTextContent("23 décembre 2025");
    expect(card).toHaveTextContent("60 m²");
    expect(card).toHaveTextContent("120 m²");
    expect(card).toHaveTextContent("PO 17");
  });

  it("omet les informations absentes et signale une vente sur plan", () => {
    render(
      <SaleCard
        sale={buildSale({
          builtSurface: null,
          landSurface: null,
          pricePerSqm: null,
          parcel: null,
          lotCount: 0,
          isOffPlan: true,
        })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("Surface bâtie")).not.toBeInTheDocument();
    expect(screen.queryByText("Parcelle cadastrale")).not.toBeInTheDocument();
    expect(screen.queryByText(/€\/m²/)).not.toBeInTheDocument();
    expect(screen.getByText("Vente sur plan (VEFA)")).toBeInTheDocument();
  });

  it("se ferme depuis le bouton dédié", async () => {
    const onClose = vi.fn();
    render(<SaleCard sale={buildSale()} onClose={onClose} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Fermer la fiche de la vente" }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("SaleList", () => {
  it("situe chaque vente par rapport à la médiane et notifie le choix", async () => {
    const onSelectSale = vi.fn();
    render(
      <SaleList
        sales={[
          buildSale({ id: "1", pricePerSqm: 3500 }),
          buildSale({ id: "2", pricePerSqm: 6500 }),
        ]}
        median={5000}
        selectedSaleId="1"
        onSelectSale={onSelectSale}
      />,
    );

    expect(screen.getByText(/Sous la médiane/)).toBeInTheDocument();
    expect(screen.getByText(/Au-dessus de la médiane/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-current", "true");

    await userEvent.click(buttons[1] as HTMLElement);

    expect(onSelectSale).toHaveBeenCalledWith("2");
  });
});

describe("PriceStatsCard", () => {
  it("présente la médiane et la fourchette centrale", () => {
    render(
      <PriceStatsCard
        stats={{
          count: 20,
          median: 5263,
          lowerQuartile: 4881,
          upperQuartile: 6094,
        }}
        saleCount={25}
      />,
    );

    const card = screen.getByRole("region", {
      name: "Prix au mètre carré dans la zone",
    });
    expect(card).toHaveTextContent("5 263 €/m²");
    expect(card).toHaveTextContent("4 881 €/m²");
    expect(card).toHaveTextContent("6 094 €/m²");
    expect(card).toHaveTextContent("20 logements sur 25 ventes");
  });
});
