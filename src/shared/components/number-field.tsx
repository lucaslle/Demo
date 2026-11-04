"use client";

import { useId, useState } from "react";
import styles from "./number-field.module.css";

type NumberFieldProps = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  onChange: (value: number) => void;
};

const parseDecimal = (text: string): number =>
  Number(text.trim().replace(",", "."));

// Champ numérique : on peut taper librement (« 0, », « 6. ») ; la valeur n'est
// transmise que lorsqu'elle est valide, et le champ se réaligne à la sortie.
export const NumberField = ({
  label,
  unit,
  value,
  min,
  max,
  hint,
  onChange,
}: NumberFieldProps) => {
  const inputId = useId();
  const hintId = useId();
  const [text, setText] = useState(String(value));
  const parsed = parseDecimal(text);
  const isInvalid = !Number.isFinite(parsed) || parsed < min || parsed > max;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.control} data-invalid={isInvalid || undefined}>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={text}
          aria-invalid={isInvalid}
          aria-describedby={hintId}
          onChange={(event) => {
            setText(event.target.value);
            const next = parseDecimal(event.target.value);
            if (Number.isFinite(next) && next >= min && next <= max) {
              onChange(next);
            }
          }}
          onBlur={() => setText(String(isInvalid ? value : parsed))}
        />
        <span className={styles.unit} aria-hidden="true">
          {unit}
        </span>
      </div>
      <p id={hintId} className={styles.hint}>
        {isInvalid
          ? `Entrez une valeur entre ${min} et ${max} ${unit}.`
          : (hint ?? `Entre ${min} et ${max} ${unit}.`)}
      </p>
    </div>
  );
};
