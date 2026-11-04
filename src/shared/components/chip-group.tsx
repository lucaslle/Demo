import { useId } from "react";
import styles from "./chip-group.module.css";

type ChipOption<Value extends string> = {
  value: Value;
  label: string;
};

type ChipGroupProps<Value extends string> = {
  legend: string;
  options: readonly ChipOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

// Groupe de boutons radio natifs : navigation aux flèches et lecteurs d'écran
// gérés par le navigateur, présentés sous forme de puces.
export const ChipGroup = <Value extends string>({
  legend,
  options,
  value,
  onChange,
}: ChipGroupProps<Value>) => {
  const groupName = useId();

  return (
    <fieldset className={styles.group} role="radiogroup">
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <input
              className={styles.input}
              type="radio"
              name={groupName}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.label}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
