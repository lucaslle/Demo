"use client";

import { Car } from "lucide-react";
import { useId } from "react";
import { NumberField } from "@/shared/components/number-field";
import {
  DEFAULT_TANK_LITERS,
  MAX_TANK_LITERS,
  MAX_VEHICLE_LABEL_LENGTH,
  MIN_TANK_LITERS,
  type Vehicle,
} from "@/shared/lib/vehicle";
import { findCatalogVehicle, VEHICLE_CATALOG } from "../model/vehicle-catalog";
import styles from "./vehicle-picker.module.css";

type VehiclePickerProps = {
  vehicle: Vehicle | null;
  onChange: (vehicle: Vehicle | null) => void;
};

const describeVehicle = (vehicle: Vehicle | null): string => {
  if (vehicle === null) {
    return "non renseigné";
  }
  const label = vehicle.label.trim();
  return label === ""
    ? `réservoir de ${vehicle.tankLiters} L`
    : `${label} · ${vehicle.tankLiters} L`;
};

// Le modèle choisi dans la liste fixe la capacité du réservoir ; elle reste
// modifiable, car le catalogue n'est qu'indicatif.
export const VehiclePicker = ({ vehicle, onChange }: VehiclePickerProps) => {
  const inputId = useId();
  const listId = useId();
  const label = vehicle?.label ?? "";
  const tankLiters = vehicle?.tankLiters ?? DEFAULT_TANK_LITERS;
  // Le champ du réservoir garde son propre texte : on le recrée seulement quand
  // un autre modèle impose une nouvelle capacité, jamais pendant la saisie.
  const tankFieldKey =
    vehicle === null ? "aucun" : (findCatalogVehicle(label)?.label ?? "libre");

  const handleLabelChange = (nextLabel: string) => {
    const catalogVehicle = findCatalogVehicle(nextLabel);
    onChange(
      catalogVehicle === undefined
        ? { label: nextLabel, tankLiters }
        : {
            label: catalogVehicle.label,
            tankLiters: catalogVehicle.tankLiters,
          },
    );
  };

  return (
    <details className={styles.picker}>
      <summary className={styles.summary}>
        <Car size={16} aria-hidden="true" />
        <span>
          Mon véhicule : <strong>{describeVehicle(vehicle)}</strong>
        </span>
      </summary>
      <div className={styles.body}>
        <div className={styles.field}>
          <label htmlFor={inputId}>Modèle</label>
          <input
            id={inputId}
            type="text"
            list={listId}
            value={label}
            maxLength={MAX_VEHICLE_LABEL_LENGTH}
            placeholder="Ex. Renault Clio V"
            autoComplete="off"
            onChange={(event) => handleLabelChange(event.target.value)}
          />
          <datalist id={listId}>
            {VEHICLE_CATALOG.map(({ label: modelLabel }) => (
              <option key={modelLabel} value={modelLabel} />
            ))}
          </datalist>
        </div>
        <NumberField
          key={tankFieldKey}
          label="Réservoir"
          unit="L"
          value={tankLiters}
          min={MIN_TANK_LITERS}
          max={MAX_TANK_LITERS}
          hint="Indicatif : vérifiez dans la notice de votre véhicule."
          onChange={(nextLiters) => onChange({ label, tankLiters: nextLiters })}
        />
        {vehicle !== null && (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onChange(null)}
          >
            Retirer mon véhicule
          </button>
        )}
      </div>
    </details>
  );
};
