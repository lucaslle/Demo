"use client";

import { useCountUp } from "../hooks/use-count-up";
import styles from "./animated-number.module.css";

type AnimatedNumberProps = {
  value: number | null;
  format: (value: number) => string;
};

// La valeur animée est masquée aux lecteurs d'écran, qui lisent la valeur finale.
export const AnimatedNumber = ({ value, format }: AnimatedNumberProps) => {
  const animatedValue = useCountUp(value);

  if (value === null || animatedValue === null) {
    return <span className={styles.placeholder} aria-hidden="true" />;
  }

  return (
    <>
      <span aria-hidden="true">{format(animatedValue)}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  );
};
