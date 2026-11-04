import { useId } from "react";
import { FUEL_LABELS, FUEL_TYPES, type FuelType } from "../model/fuel-types";
import styles from "./fuel-chips.module.css";

type FuelChipsProps = {
  value: FuelType;
  onChange: (fuel: FuelType) => void;
};

// Groupe de boutons radio natifs : navigation aux flèches et lecteurs d'écran
// gérés par le navigateur, présentés sous forme de puces.
export const FuelChips = ({ value, onChange }: FuelChipsProps) => {
  const groupName = useId();

  return (
    <fieldset className={styles.group} role="radiogroup">
      <legend className={styles.legend}>Carburant</legend>
      <div className={styles.chips}>
        {FUEL_TYPES.map((fuel) => (
          <label key={fuel} className={styles.chip}>
            <input
              className={styles.input}
              type="radio"
              name={groupName}
              value={fuel}
              checked={fuel === value}
              onChange={() => onChange(fuel)}
            />
            <span className={styles.label}>{FUEL_LABELS[fuel]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
