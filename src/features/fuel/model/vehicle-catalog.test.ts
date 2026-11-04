import { describe, expect, it } from "vitest";
import { MAX_TANK_LITERS, MIN_TANK_LITERS } from "@/shared/lib/vehicle";
import { findCatalogVehicle, VEHICLE_CATALOG } from "./vehicle-catalog";

describe("VEHICLE_CATALOG", () => {
  it("a des libellés uniques et des réservoirs plausibles", () => {
    const labels = VEHICLE_CATALOG.map(({ label }) => label);

    expect(new Set(labels).size).toBe(labels.length);
    for (const { tankLiters } of VEHICLE_CATALOG) {
      expect(tankLiters).toBeGreaterThanOrEqual(MIN_TANK_LITERS);
      expect(tankLiters).toBeLessThanOrEqual(MAX_TANK_LITERS);
    }
  });
});

describe("findCatalogVehicle", () => {
  it("retrouve un modèle sans tenir compte de la casse ni des accents", () => {
    expect(findCatalogVehicle("renault megane iv (2016+)")?.tankLiters).toBe(
      50,
    );
    expect(findCatalogVehicle("  Citroën C3 Aircross ")?.tankLiters).toBe(45);
    expect(findCatalogVehicle("citroen c3 aircross")?.label).toBe(
      "Citroën C3 Aircross",
    );
  });

  it("ne renvoie rien pour un texte inconnu ou vide", () => {
    expect(findCatalogVehicle("Clio")).toBeUndefined();
    expect(findCatalogVehicle("")).toBeUndefined();
    expect(findCatalogVehicle("   ")).toBeUndefined();
  });
});
