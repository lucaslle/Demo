import { describe, expect, it } from "vitest";
import {
  buildPhoneHref,
  describeCertificationStatus,
  formatDistance,
  formatPhone,
  getPrimaryKind,
  isActivityFilter,
  snapCenter,
  toSafeWebUrl,
} from "./operator";

describe("getPrimaryKind", () => {
  it("fait passer le producteur avant le distributeur", () => {
    expect(getPrimaryKind(["Distribution", "Production"])).toBe("production");
    expect(getPrimaryKind(["Préparation", "Distribution"])).toBe(
      "distribution",
    );
    expect(getPrimaryKind(["Préparation", "Stockage"])).toBe("preparation");
    expect(getPrimaryKind(["Stockage"])).toBe("other");
    expect(getPrimaryKind([])).toBe("other");
  });
});

describe("formatDistance", () => {
  it("affiche des mètres arrondis sous le kilomètre", () => {
    expect(formatDistance(0.347)).toBe("350 m");
  });

  it("affiche des kilomètres avec une virgule au-delà", () => {
    expect(formatDistance(3.42)).toBe("3,4 km");
    expect(formatDistance(12)).toBe("12 km");
  });
});

describe("formatPhone et buildPhoneHref", () => {
  it("groupe les numéros français par paires", () => {
    expect(formatPhone("0616294393")).toBe("06 16 29 43 93");
    expect(formatPhone("+33 6 16 29 43 93")).toBe("+33 6 16 29 43 93");
  });

  it("n'écrit un lien tel: que pour un numéro plausible", () => {
    expect(buildPhoneHref("06 16 29 43 93")).toBe("tel:0616294393");
    expect(buildPhoneHref("javascript:alert(1)")).toBeNull();
    expect(buildPhoneHref("poste 12")).toBeNull();
  });
});

describe("toSafeWebUrl", () => {
  it("accepte http et https seulement", () => {
    expect(toSafeWebUrl("https://exemple.fr")).toBe("https://exemple.fr/");
    expect(toSafeWebUrl("http://exemple.fr/ferme")).toBe(
      "http://exemple.fr/ferme",
    );
    expect(toSafeWebUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeWebUrl("pas une url")).toBeNull();
  });
});

describe("describeCertificationStatus", () => {
  it("traduit l'état connu et rend lisible les autres", () => {
    expect(describeCertificationStatus("ENGAGEE")).toBe("Engagé en bio");
    expect(describeCertificationStatus("EN_ATTENTE")).toBe("En attente");
    expect(describeCertificationStatus(null)).toBeNull();
    expect(describeCertificationStatus(" ")).toBeNull();
  });
});

describe("snapCenter", () => {
  it("arrondit le centre à environ un kilomètre", () => {
    expect(snapCenter({ lat: 48.85661, lng: 2.35224 })).toEqual({
      lat: 48.86,
      lng: 2.35,
    });
  });
});

describe("isActivityFilter", () => {
  it("reconnaît uniquement les filtres connus", () => {
    expect(isActivityFilter("production")).toBe(true);
    expect(isActivityFilter("autre")).toBe(false);
    expect(isActivityFilter(null)).toBe(false);
  });
});
