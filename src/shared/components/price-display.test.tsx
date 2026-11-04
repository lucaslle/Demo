import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceDisplay } from "./price-display";

describe("PriceDisplay", () => {
  it("expose le prix complet aux lecteurs d'écran", () => {
    render(<PriceDisplay amount={1.629} />);

    expect(screen.getByText(/1,629/)).toHaveClass("visually-hidden");
  });

  it("affiche la dernière décimale en exposant et masque l'affichage visuel", () => {
    const { container } = render(<PriceDisplay amount={1.629} />);

    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual).toHaveTextContent("1,629");
    expect(visual?.querySelector("sup")).toHaveTextContent("9");
  });
});
