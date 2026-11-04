import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BioOperator } from "../model/operator";
import { BioCard } from "./bio-card";
import { BioList } from "./bio-list";

const buildOperator = (overrides: Partial<BioOperator> = {}): BioOperator => ({
  id: "1",
  name: "FERME DU PARC",
  categories: ["Vente aux consommateurs"],
  activities: ["Production", "Distribution"],
  address: "1 chemin du Parc, 75004 Paris",
  position: { lat: 48.857, lng: 2.352 },
  distanceKm: 0.347,
  products: ["Miel", "Œufs", "Légumes frais", "Pommes", "Poires", "Cidre"],
  certification: {
    body: "Certipaq Bio",
    status: "ENGAGEE",
    url: "https://bio.certipaq.solutions/certificats/fiche/1/",
  },
  website: "https://ferme.example/",
  phone: "06 16 29 43 93",
  salesChannels: ["Particuliers"],
  ...overrides,
});

const idleRoute = { status: "idle" } as const;

describe("BioCard", () => {
  it("présente le rôle, la distance, la certification et les produits", () => {
    render(
      <BioCard
        operator={buildOperator()}
        routeState={idleRoute}
        onRetryLocate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Producteur")).toBeInTheDocument();
    expect(screen.getByText("FERME DU PARC")).toBeInTheDocument();
    expect(screen.getByText(/À 350 m du centre/)).toBeInTheDocument();
    expect(
      screen.getByText(/Engagé en bio · Certipaq Bio/),
    ).toBeInTheDocument();
    expect(screen.getByText("Miel")).toBeInTheDocument();
    expect(screen.getByText("et 1 autre")).toBeInTheDocument();
    expect(screen.queryByText("Cidre")).not.toBeInTheDocument();
  });

  it("propose un site web et un numéro cliquables", () => {
    render(
      <BioCard
        operator={buildOperator()}
        routeState={idleRoute}
        onRetryLocate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: /Site web/ })).toHaveAttribute(
      "href",
      "https://ferme.example/",
    );
    expect(
      screen.getByRole("link", { name: "06 16 29 43 93" }),
    ).toHaveAttribute("href", "tel:0616294393");
  });

  it("omet les blocs absents", () => {
    render(
      <BioCard
        operator={buildOperator({
          products: [],
          certification: null,
          website: null,
          phone: null,
          salesChannels: [],
        })}
        routeState={idleRoute}
        onRetryLocate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("Produits bio")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Site web/ })).toBeNull();
  });

  it("se ferme depuis le bouton dédié", async () => {
    const onClose = vi.fn();
    render(
      <BioCard
        operator={buildOperator()}
        routeState={idleRoute}
        onRetryLocate={vi.fn()}
        onClose={onClose}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Fermer la fiche de l'opérateur" }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("BioList", () => {
  it("liste les opérateurs, marque la sélection et notifie le choix", async () => {
    const onSelectOperator = vi.fn();
    render(
      <BioList
        operators={[
          buildOperator(),
          buildOperator({ id: "2", name: "BOULANGERIE BIO", distanceKm: 2.4 }),
        ]}
        selectedOperatorId="1"
        onSelectOperator={onSelectOperator}
      />,
    );

    expect(
      screen.getByRole("button", { name: /FERME DU PARC/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("2,4 km")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /BOULANGERIE BIO/ }),
    );

    expect(onSelectOperator).toHaveBeenCalledWith("2");
  });
});
