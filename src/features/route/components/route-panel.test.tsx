import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RouteState } from "../model/route-state";
import { RoutePanel } from "./route-panel";

const ready: RouteState = {
  status: "ready",
  origin: { lat: 48.85, lng: 2.35 },
  destination: { lat: 48.84, lng: 2.4 },
  route: {
    distanceInMeters: 5222.97,
    durationInSeconds: 951,
    path: [],
    steps: [
      { label: "Démarrer", distanceInMeters: 98 },
      { label: "Tourner à gauche", distanceInMeters: 135 },
    ],
  },
};

describe("RoutePanel", () => {
  it("n'affiche rien quand aucune station n'est choisie", () => {
    const { container } = render(
      <RoutePanel state={{ status: "idle" }} onRetryLocate={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("annonce la localisation et le calcul en cours", () => {
    const { rerender } = render(
      <RoutePanel state={{ status: "locating" }} onRetryLocate={vi.fn()} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Localisation");

    rerender(
      <RoutePanel state={{ status: "loading" }} onRetryLocate={vi.fn()} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Calcul");
  });

  it("affiche la durée, la distance et les étapes de l'itinéraire", async () => {
    render(<RoutePanel state={ready} onRetryLocate={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("16 min");
    expect(screen.getByRole("status")).toHaveTextContent("5,2");
    await userEvent.click(screen.getByText("Voir les étapes (2)"));
    expect(screen.getByText("Tourner à gauche")).toBeVisible();
  });

  it("propose d'ouvrir l'itinéraire dans OpenStreetMap", () => {
    render(<RoutePanel state={ready} onRetryLocate={vi.fn()} />);

    const link = screen.getByRole("link", { name: /OpenStreetMap/ });
    expect(link.getAttribute("href")).toContain("openstreetmap.org/directions");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("explique un refus de localisation et permet de réessayer", async () => {
    const onRetryLocate = vi.fn();
    render(
      <RoutePanel
        state={{ status: "location-denied" }}
        onRetryLocate={onRetryLocate}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Position refusée");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetryLocate).toHaveBeenCalledOnce();
  });

  it("affiche l'erreur du service sans proposer de réessayer la position", () => {
    render(
      <RoutePanel
        state={{ status: "error", message: "Service indisponible" }}
        onRetryLocate={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Service indisponible");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
