import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "@/shared/lib/vehicle";
import { VehiclePicker } from "./vehicle-picker";

const renderPicker = (initial: Vehicle | null = null) => {
  const onChange = vi.fn<(vehicle: Vehicle | null) => void>();
  const Harness = () => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(initial);
    return (
      <VehiclePicker
        vehicle={vehicle}
        onChange={(next) => {
          onChange(next);
          setVehicle(next);
        }}
      />
    );
  };
  render(<Harness />);
  return onChange;
};

const openPicker = async () =>
  userEvent.click(screen.getByText(/Mon véhicule/));

describe("VehiclePicker", () => {
  it("indique qu'aucun véhicule n'est renseigné au départ", () => {
    renderPicker();

    expect(screen.getByText("non renseigné")).toBeInTheDocument();
  });

  it("reprend la capacité du réservoir quand un modèle du catalogue est saisi", async () => {
    const onChange = renderPicker();
    await openPicker();

    await userEvent.type(
      screen.getByRole("combobox", { name: "Modèle" }),
      "Renault Clio V (2019+)",
    );

    expect(onChange).toHaveBeenLastCalledWith({
      label: "Renault Clio V (2019+)",
      tankLiters: 42,
    });
    expect(screen.getByLabelText("Réservoir")).toHaveValue("42");
    expect(
      screen.getByText("Renault Clio V (2019+) · 42 L"),
    ).toBeInTheDocument();
  });

  it("garde un modèle libre avec la capacité par défaut", async () => {
    const onChange = renderPicker();
    await openPicker();

    await userEvent.type(
      screen.getByRole("combobox", { name: "Modèle" }),
      "Ma 4L",
    );

    expect(onChange).toHaveBeenLastCalledWith({
      label: "Ma 4L",
      tankLiters: 50,
    });
  });

  it("permet de corriger la capacité sans perdre le modèle", async () => {
    const onChange = renderPicker({
      label: "Renault Clio V (2019+)",
      tankLiters: 42,
    });
    await openPicker();

    const tank = screen.getByLabelText("Réservoir");
    await userEvent.clear(tank);
    await userEvent.type(tank, "38");

    expect(onChange).toHaveBeenLastCalledWith({
      label: "Renault Clio V (2019+)",
      tankLiters: 38,
    });
  });

  it("ignore une capacité hors limites", async () => {
    const onChange = renderPicker({ label: "", tankLiters: 50 });
    await openPicker();

    const tank = screen.getByLabelText("Réservoir");
    await userEvent.clear(tank);
    await userEvent.type(tank, "5");

    expect(onChange).not.toHaveBeenCalled();
    expect(tank).toHaveAttribute("aria-invalid", "true");
  });

  it("retire le véhicule et revient à la capacité par défaut", async () => {
    const onChange = renderPicker({
      label: "Fiat 500 (2007+)",
      tankLiters: 35,
    });
    await openPicker();

    await userEvent.click(
      screen.getByRole("button", { name: "Retirer mon véhicule" }),
    );

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("non renseigné")).toBeInTheDocument();
    expect(screen.getByLabelText("Réservoir")).toHaveValue("50");
  });
});
