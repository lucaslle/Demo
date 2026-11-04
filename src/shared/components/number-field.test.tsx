import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "./number-field";

const renderField = (onChange = vi.fn(), value = 6.5) =>
  render(
    <NumberField
      label="Consommation"
      unit="L/100 km"
      value={value}
      min={1}
      max={30}
      onChange={onChange}
    />,
  );

describe("NumberField", () => {
  it("associe l'étiquette au champ et affiche la valeur", () => {
    renderField();

    expect(screen.getByLabelText("Consommation")).toHaveValue("6.5");
  });

  it("transmet une valeur valide, virgule française comprise", async () => {
    const onChange = vi.fn();
    renderField(onChange);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "7,2");

    expect(onChange).toHaveBeenLastCalledWith(7.2);
  });

  it("ne transmet pas une valeur hors limites et l'explique", async () => {
    const onChange = vi.fn();
    renderField(onChange);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "99");

    expect(onChange).not.toHaveBeenCalledWith(99);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/entre 1 et 30/i)).toBeInTheDocument();
  });

  it("réaligne le champ sur la dernière valeur valide quand on le quitte", async () => {
    renderField(vi.fn(), 6.5);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "abc");
    await userEvent.tab();

    expect(input).toHaveValue("6.5");
  });
});
