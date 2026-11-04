import { describe, expect, it } from "vitest";
import type { RouteResponse } from "../schemas/route-response";
import {
  buildOpenStreetMapDirectionsUrl,
  formatDistance,
  formatDuration,
  toRoute,
} from "./route";

const response: RouteResponse = {
  distance: 5222.97,
  duration: 951.3,
  geometry: {
    type: "LineString",
    coordinates: [
      [2.35257, 48.85727],
      [2.3978, 48.8397],
    ],
  },
  portions: [
    {
      steps: [
        { distance: 98.3, duration: 9.7, instruction: { type: "depart" } },
        {
          distance: 135,
          duration: 28,
          instruction: { type: "turn", modifier: "left" },
        },
      ],
    },
  ],
};

describe("toRoute", () => {
  it("convertit [longitude, latitude] en position latitude/longitude", () => {
    const route = toRoute(response);

    expect(route.path[0]).toEqual({ lat: 48.85727, lng: 2.35257 });
    expect(route.distanceInMeters).toBe(5222.97);
    expect(route.durationInSeconds).toBe(951.3);
  });

  it("décrit chaque étape en français", () => {
    expect(toRoute(response).steps).toEqual([
      { label: "Démarrer", distanceInMeters: 98.3 },
      { label: "Tourner à gauche", distanceInMeters: 135 },
    ]);
  });
});

describe("formatDistance", () => {
  it("arrondit à 10 m sous le kilomètre, puis passe aux kilomètres", () => {
    expect(formatDistance(98)).toBe("100 m");
    expect(formatDistance(5222.97).replace(/\s/g, " ")).toBe("5,2 km");
  });
});

describe("formatDuration", () => {
  it("exprime la durée en minutes, puis en heures", () => {
    expect(formatDuration(30)).toBe("1 min");
    expect(formatDuration(951)).toBe("16 min");
    expect(formatDuration(3600)).toBe("1 h");
    expect(formatDuration(7007)).toBe("1 h 57");
  });
});

describe("buildOpenStreetMapDirectionsUrl", () => {
  it("encode l'origine et la destination", () => {
    const url = new URL(
      buildOpenStreetMapDirectionsUrl(
        { lat: 48.85, lng: 2.35 },
        { lat: 48.84, lng: 2.4 },
      ),
    );

    expect(url.searchParams.get("route")).toBe("48.85,2.35;48.84,2.4");
    expect(url.searchParams.get("engine")).toBe("fossgis_osrm_car");
  });
});
