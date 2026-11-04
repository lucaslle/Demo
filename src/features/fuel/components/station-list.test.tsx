import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DisplayedStation } from "../model/displayed-station";
import { StationList } from "./station-list";

const NOW = new Date("2026-11-04T12:00:00Z");

const displayedStations: DisplayedStation[] = [
  {
    station: {
      id: 1,
      position: { lat: 48.85, lng: 2.35 },
      address: "1 rue de la Paix",
      postalCode: "75002",
      city: "Paris",
      prices: {},
    },
    price: { amount: 1.949, updatedAt: "2026-11-04T10:00:00Z" },
    tier: "cheapest",
  },
  {
    station: {
      id: 2,
      position: { lat: 48.86, lng: 2.36 },
      address: "8 avenue Foch",
      postalCode: "75016",
      city: "Paris",
      prices: {},
    },
    price: { amount: 2.089, updatedAt: "2026-10-20T10:00:00Z" },
    tier: "high",
  },
];

describe("StationList", () => {
  it("affiche chaque station avec son prix et son adresse, dans l'ordre reçu", () => {
    render(
      <StationList
        displayedStations={displayedStations}
        selectedStationId={null}
        now={NOW}
        onSelectStation={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText(/1,949/)).toBeInTheDocument();
    expect(
      within(items[0]!).getByText(/1 rue de la Paix, 75002 Paris/),
    ).toBeInTheDocument();
  });

  it("signale en toutes lettres un prix ancien", () => {
    render(
      <StationList
        displayedStations={displayedStations}
        selectedStationId={null}
        now={NOW}
        onSelectStation={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(
      within(items[0]!).queryByText(/prix ancien/),
    ).not.toBeInTheDocument();
    expect(within(items[1]!).getByText(/prix ancien/)).toBeInTheDocument();
  });

  it("sélectionne une station au clic ou au clavier", async () => {
    const onSelectStation = vi.fn();
    render(
      <StationList
        displayedStations={displayedStations}
        selectedStationId={null}
        now={NOW}
        onSelectStation={onSelectStation}
      />,
    );

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]!);
    buttons[1]!.focus();
    await userEvent.keyboard("{Enter}");

    expect(onSelectStation).toHaveBeenNthCalledWith(1, 1);
    expect(onSelectStation).toHaveBeenNthCalledWith(2, 2);
  });

  it("marque la station sélectionnée pour les technologies d'assistance", () => {
    render(
      <StationList
        displayedStations={displayedStations}
        selectedStationId={2}
        now={NOW}
        onSelectStation={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveAttribute("aria-current", "true");
    expect(buttons[0]).not.toHaveAttribute("aria-current");
  });
});
