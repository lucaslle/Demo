import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FuelSelect } from "./fuel-select";

describe("FuelSelect", () => {
  it("propose tous les carburants dans un champ étiqueté", () => {
    render(<FuelSelect value="e10" onChange={vi.fn()} />);

    const select = screen.getByRole("combobox", { name: "Carburant" });
    expect(select).toHaveValue("e10");
    expect(screen.getAllByRole("option")).toHaveLength(6);
  });

  it("prévient quand l'utilisateur choisit un autre carburant", async () => {
    const onChange = vi.fn();
    render(<FuelSelect value="e10" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Carburant" }),
      "gazole",
    );

    expect(onChange).toHaveBeenCalledWith("gazole");
  });
});
