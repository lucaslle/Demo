import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouteCard } from "./route-card";

const station = {
  id: 1,
  position: { lat: 48.84, lng: 2.4 },
  address: "173 Avenue Daumesnil",
  postalCode: "75012",
  city: "Paris",
  prices: {},
};

describe("RouteCard", () => {
  it("présente la station choisie avec son prix et son adresse", () => {
    render(
      <RouteCard
        station={station}
        price={{ amount: 1.99, updatedAt: null }}
        fuel="e10"
        routeState={{ status: "loading" }}
        onRetryLocate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Itinéraire vers la station" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1,990/)).toBeInTheDocument();
    expect(
      screen.getByText("173 Avenue Daumesnil, 75012 Paris"),
    ).toBeInTheDocument();
  });

  it("se ferme avec le bouton dédié", async () => {
    const onClose = vi.fn();
    render(
      <RouteCard
        station={station}
        price={{ amount: 1.99, updatedAt: null }}
        fuel="e10"
        routeState={{ status: "idle" }}
        onRetryLocate={vi.fn()}
        onClose={onClose}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Fermer l'itinéraire" }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});
