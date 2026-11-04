import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formatInteger } from "../lib/format";
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
  it("associe l'étiquette au champ et affiche la valeur avec la virgule française", () => {
    renderField();

    expect(screen.getByLabelText("Consommation")).toHaveValue("6,5");
  });

  it("transmet une valeur valide, virgule française comprise", async () => {
    const onChange = vi.fn();
    renderField(onChange);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "7,2");

    expect(onChange).toHaveBeenLastCalledWith(7.2);
  });

  it("accepte aussi le point décimal", async () => {
    const onChange = vi.fn();
    renderField(onChange);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "7.2");

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

  it("ne transmet rien pour un champ vidé", async () => {
    const onChange = vi.fn();
    renderField(onChange);

    await userEvent.clear(screen.getByLabelText("Consommation"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("réaligne le champ sur la dernière valeur valide quand on le quitte", async () => {
    renderField(vi.fn(), 6.5);
    const input = screen.getByLabelText("Consommation");

    await userEvent.clear(input);
    await userEvent.type(input, "abc");
    await userEvent.tab();

    expect(input).toHaveValue("6,5");
  });
});

describe("NumberField avec séparateur de milliers", () => {
  const renderKm = (onChange = vi.fn()) =>
    render(
      <NumberField
        label="Distance par an"
        unit="km"
        value={12_000}
        min={1_000}
        max={100_000}
        format={formatInteger}
        onChange={onChange}
      />,
    );

  it("affiche et décrit les nombres avec leurs séparateurs", () => {
    renderKm();

    expect(screen.getByLabelText("Distance par an").getAttribute("value")).toBe(
      formatInteger(12_000),
    );
    expect(screen.getByText(/entre 1.000 et 100.000 km/i)).toBeInTheDocument();
  });

  it("relit un nombre saisi avec des espaces", async () => {
    const onChange = vi.fn();
    renderKm(onChange);
    const input = screen.getByLabelText("Distance par an");

    await userEvent.clear(input);
    await userEvent.type(input, "15 000");

    expect(onChange).toHaveBeenLastCalledWith(15_000);
  });
});
