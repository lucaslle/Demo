import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("affiche le titre principal de l'application", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /autour de vous/ }),
    ).toBeInTheDocument();
  });

  it("expose la zone de contenu ciblée par le lien d'évitement", () => {
    render(<HomePage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "contenu");
  });

  it("propose d'ouvrir la carte des carburants depuis le héros et la liste des thèmes", () => {
    render(<HomePage />);

    const links = screen
      .getAllByRole("link")
      .filter((link) => /carburants/i.test(link.textContent ?? ""));

    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/carburants\/?$/);
    }
  });

  it("présente les thèmes à venir sans les rendre cliquables", () => {
    render(<HomePage />);

    expect(
      screen.queryByRole("link", { name: "Équipements sportifs" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Bientôt")).toHaveLength(2);
  });

  it("hiérarchise les titres : un h1 puis des h2", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Les thèmes", "Sous le capot"]);
  });
});
