import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { usePreferencesStore } from "../stores/preferences-store";
import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  localStorage.clear();
  usePreferencesStore.setState({ theme: "system", preferredFuel: null });
});

describe("ThemeToggle", () => {
  it("annonce le thème courant dans son nom accessible", () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", {
        name: "Thème automatique. Changer de thème",
      }),
    ).toBeInTheDocument();
  });

  it("passe du thème automatique au clair, au sombre, puis revient", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(usePreferencesStore.getState().theme).toBe("light");
    expect(button).toHaveAccessibleName("Thème clair. Changer de thème");

    await userEvent.click(button);
    expect(usePreferencesStore.getState().theme).toBe("dark");

    await userEvent.click(button);
    expect(usePreferencesStore.getState().theme).toBe("system");
  });
});
