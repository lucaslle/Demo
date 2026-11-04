import { describe, expect, it } from "vitest";
import { describeInstruction } from "./instruction-label";

describe("describeInstruction", () => {
  it("traduit les virages avec leur direction", () => {
    expect(describeInstruction("turn", "left")).toBe("Tourner à gauche");
    expect(describeInstruction("turn", "slight right")).toBe(
      "Tourner légèrement à droite",
    );
  });

  it("traduit le départ et l'arrivée", () => {
    expect(describeInstruction("depart", undefined)).toBe("Démarrer");
    expect(describeInstruction("arrive", "right")).toBe(
      "Vous êtes arrivé, la station est à droite",
    );
  });

  it("traduit les manœuvres d'autoroute et de bifurcation", () => {
    expect(describeInstruction("on ramp", "slight left")).toBe(
      "Prendre la bretelle légèrement à gauche",
    );
    expect(describeInstruction("fork", "slight right")).toBe(
      "À l'embranchement, prendre légèrement à droite",
    );
  });

  it("garde une phrase utile pour une manœuvre ou une direction inconnue", () => {
    expect(describeInstruction("teleport", null)).toBe("Continuer");
    expect(describeInstruction("turn", "diagonal")).toBe("Tourner");
  });
});
