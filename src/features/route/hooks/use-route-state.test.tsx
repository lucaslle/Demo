import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRouteState } from "./use-route-state";

const origin = { lat: 48.8566, lng: 2.3522 };
const destination = { lat: 48.8397, lng: 2.3978 };

const apiResponse = {
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
    { steps: [{ distance: 98, duration: 9, instruction: { type: "depart" } }] },
  ],
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useRouteState", () => {
  it("reste inactif tant qu'aucune station n'est choisie", () => {
    const { result } = renderHook(
      () =>
        useRouteState({ origin, locationStatus: "located", destination: null }),
      { wrapper },
    );

    expect(result.current).toEqual({ status: "idle" });
  });

  it("attend la position de l'utilisateur, puis signale un refus", () => {
    const { result, rerender } = renderHook(
      ({ locationStatus }: { locationStatus: "idle" | "denied" }) =>
        useRouteState({ origin: null, locationStatus, destination }),
      { wrapper, initialProps: { locationStatus: "idle" } },
    );
    expect(result.current.status).toBe("locating");

    rerender({ locationStatus: "denied" });
    expect(result.current.status).toBe("location-denied");
  });

  it("calcule l'itinéraire une fois la position connue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(apiResponse))),
    );

    const { result } = renderHook(
      () => useRouteState({ origin, locationStatus: "located", destination }),
      { wrapper },
    );
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("explique une erreur du service", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 400 })),
    );

    const { result } = renderHook(
      () => useRouteState({ origin, locationStatus: "located", destination }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({
      message: "Cet itinéraire sort de la zone couverte par le service.",
    });
  });
});
