import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FuelChips } from "./fuel-chips";

describe("FuelChips", () => {
  it("propose tous les carburants dans un groupe de boutons radio étiqueté", () => {
    render(<FuelChips value="e10" onChange={vi.fn()} />);

    expect(
      screen.getByRole("radiogroup", { name: "Carburant" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "SP95-E10" })).toBeChecked();
  });

  it("prévient quand l'utilisateur choisit un autre carburant", async () => {
    const onChange = vi.fn();
    render(<FuelChips value="e10" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Gazole" }));

    expect(onChange).toHaveBeenCalledWith("gazole");
  });

  it("se pilote aux flèches du clavier", async () => {
    const onChange = vi.fn();
    render(<FuelChips value="gazole" onChange={onChange} />);

    screen.getByRole("radio", { name: "Gazole" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("e10");
  });
});
