import { describe, expect, it } from "vitest";
import {
  LOCATION_DENIED_MESSAGE,
  summarizeRouteState,
  type RouteState,
} from "./route-state";

const ready: RouteState = {
  status: "ready",
  origin: { lat: 48.85, lng: 2.35 },
  destination: { lat: 48.84, lng: 2.4 },
  route: {
    distanceInMeters: 5222.97,
    durationInSeconds: 951,
    path: [],
    steps: [],
  },
};

describe("summarizeRouteState", () => {
  it("n'affiche rien tant qu'aucune station n'est choisie", () => {
    expect(summarizeRouteState({ status: "idle" })).toBeNull();
  });

  it("résume la durée et la distance d'un itinéraire calculé", () => {
    expect(summarizeRouteState(ready)?.replace(/\s/g, " ")).toBe(
      "16 min · 5,2 km",
    );
  });

  it("explique chaque étape en attente ou en échec", () => {
    expect(summarizeRouteState({ status: "locating" })).toContain(
      "Localisation",
    );
    expect(summarizeRouteState({ status: "loading" })).toContain("Calcul");
    expect(summarizeRouteState({ status: "location-denied" })).toBe(
      LOCATION_DENIED_MESSAGE,
    );
    expect(summarizeRouteState({ status: "error", message: "Oups" })).toBe(
      "Oups",
    );
  });
});
