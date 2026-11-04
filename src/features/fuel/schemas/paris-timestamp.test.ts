import { describe, expect, it } from "vitest";
import { normalizeParisTimestamp } from "./paris-timestamp";

describe("normalizeParisTimestamp", () => {
  it("convertit l'heure d'hiver de Paris (UTC+1) en UTC", () => {
    expect(normalizeParisTimestamp("2026-11-04T11:39:58+00:00")).toBe(
      "2026-11-04T10:39:58.000Z",
    );
  });

  it("convertit l'heure d'été de Paris (UTC+2) en UTC", () => {
    expect(normalizeParisTimestamp("2026-07-15T09:00:00+00:00")).toBe(
      "2026-07-15T07:00:00.000Z",
    );
  });

  it("accepte le format du flux d'origine, sans fuseau", () => {
    expect(normalizeParisTimestamp("2026-11-04 11:39:58")).toBe(
      "2026-11-04T10:39:58.000Z",
    );
  });

  it("renvoie null pour une valeur absente ou illisible", () => {
    expect(normalizeParisTimestamp(null)).toBeNull();
    expect(normalizeParisTimestamp("hier")).toBeNull();
  });
});
