import { useId } from "react";
import {
  FUEL_LABELS,
  FUEL_TYPES,
  isFuelType,
  type FuelType,
} from "../model/fuel-types";
import styles from "./fuel-select.module.css";

type FuelSelectProps = {
  value: FuelType;
  onChange: (fuel: FuelType) => void;
};

export const FuelSelect = ({ value, onChange }: FuelSelectProps) => {
  const selectId = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={selectId}>Carburant</label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => {
          const nextFuel = event.target.value;
          if (isFuelType(nextFuel)) {
            onChange(nextFuel);
          }
        }}
      >
        {FUEL_TYPES.map((fuel) => (
          <option key={fuel} value={fuel}>
            {FUEL_LABELS[fuel]}
          </option>
        ))}
      </select>
    </div>
  );
};
