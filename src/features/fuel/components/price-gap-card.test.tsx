import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceGapCard } from "./price-gap-card";

const summary = { lowest: 1.9, average: 2, highest: 2.1, spread: 0.2 };

describe("PriceGapCard", () => {
  it("chiffre l'écart sur le plein du véhicule renseigné", () => {
    render(
      <PriceGapCard
        summary={summary}
        vehicle={{ label: "Renault Clio V (2019+)", tankLiters: 40 }}
      />,
    );

    const card = screen.getByRole("complementary", {
      name: "Écart de prix sur un plein",
    });
    expect(card).toHaveTextContent("Écart sur un plein de 40 L");
    expect(card).toHaveTextContent("Renault Clio V (2019+)");
    expect(card).toHaveTextContent("8,00");
    expect(card).toHaveTextContent("76,00");
    expect(card).toHaveTextContent("84,00");
  });

  it("prend un réservoir de 50 L sans véhicule", () => {
    render(<PriceGapCard summary={summary} vehicle={null} />);

    expect(screen.getByText(/Écart sur un plein de 50 L/)).toBeInTheDocument();
    expect(screen.getByText(/10,00/)).toBeInTheDocument();
  });

  it("ne s'affiche pas quand l'écart est négligeable", () => {
    const { container } = render(
      <PriceGapCard
        summary={{ lowest: 2, average: 2, highest: 2.001, spread: 0.001 }}
        vehicle={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
