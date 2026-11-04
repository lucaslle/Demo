"use client";

import { useId, useState } from "react";
import { formatDecimal } from "../lib/format";
import styles from "./number-field.module.css";

type NumberFieldProps = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  // Affichage du nombre dans le champ et dans les messages (virgule française
  // par défaut ; passer `formatInteger` pour grouper les milliers).
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

// Accepte la virgule, le point et les espaces (« 12 000 »).
const parseDecimal = (text: string): number =>
  Number(text.replace(/[\s  ]/g, "").replace(",", "."));

// Champ numérique : on peut taper librement (« 0, », « 6. ») ; la valeur n'est
// transmise que lorsqu'elle est valide, et le champ se réaligne à la sortie.
export const NumberField = ({
  label,
  unit,
  value,
  min,
  max,
  hint,
  format = formatDecimal,
  onChange,
}: NumberFieldProps) => {
  const inputId = useId();
  const hintId = useId();
  const [text, setText] = useState(format(value));
  const parsed = parseDecimal(text);
  const isInvalid =
    text.trim() === "" ||
    !Number.isFinite(parsed) ||
    parsed < min ||
    parsed > max;

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
            if (
              event.target.value.trim() !== "" &&
              Number.isFinite(next) &&
              next >= min &&
              next <= max
            ) {
              onChange(next);
            }
          }}
          onBlur={() => setText(format(isInvalid ? value : parsed))}
        />
        <span className={styles.unit} aria-hidden="true">
          {unit}
        </span>
      </div>
      <p id={hintId} className={styles.hint}>
        {isInvalid
          ? `Entrez une valeur entre ${format(min)} et ${format(max)} ${unit}.`
          : (hint ?? `Entre ${format(min)} et ${format(max)} ${unit}.`)}
      </p>
    </div>
  );
};
