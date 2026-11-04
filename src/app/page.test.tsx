import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("affiche le titre principal de l'application", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Autour de moi" }),
    ).toBeInTheDocument();
  });

  it("expose la zone de contenu ciblée par le lien d'évitement", () => {
    render(<HomePage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "contenu");
  });

  it("propose d'ouvrir la carte des carburants", () => {
    render(<HomePage />);

    const link = screen.getByRole("link", { name: "Prix des carburants" });

    expect(link.getAttribute("href")).toMatch(/^\/carburants\/?$/);
  });
});
