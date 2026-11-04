import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUserLocation } from "./use-user-location";

const stubGeolocation = (
  getCurrentPosition: Geolocation["getCurrentPosition"],
) => {
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useUserLocation", () => {
  it("ne demande pas la position avant d'y être invité", () => {
    const getCurrentPosition = vi.fn();
    stubGeolocation(getCurrentPosition);

    const { result } = renderHook(() => useUserLocation());

    expect(result.current.status).toBe("idle");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("mémorise la position obtenue", () => {
    stubGeolocation((onSuccess) =>
      onSuccess({
        coords: { latitude: 48.85, longitude: 2.35 },
      } as GeolocationPosition),
    );
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());

    expect(result.current.status).toBe("located");
    expect(result.current.position).toEqual({ lat: 48.85, lng: 2.35 });
  });

  it("signale un refus d'autorisation", () => {
    stubGeolocation((_onSuccess, onError) =>
      onError?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    );
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());

    expect(result.current.status).toBe("denied");
    expect(result.current.position).toBeNull();
  });

  it("signale une position indisponible", () => {
    stubGeolocation((_onSuccess, onError) =>
      onError?.({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    );
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());

    expect(result.current.status).toBe("unavailable");
  });
});
