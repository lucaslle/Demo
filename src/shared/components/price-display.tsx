import { formatPrice, splitPrice } from "../lib/format";
import styles from "./price-display.module.css";

type PriceDisplayProps = {
  amount: number;
  size?: "md" | "lg" | "xl";
};

// Prix affiché avec la dernière décimale en exposant. Les lecteurs d'écran lisent
// le prix complet (« 1,629 € »), pas les fragments.
export const PriceDisplay = ({ amount, size = "md" }: PriceDisplayProps) => {
  const { main, lastDigit } = splitPrice(amount);

  return (
    <span className={`${styles.price} ${styles[size]}`}>
      <span aria-hidden="true">
        {main}
        <sup className={styles.sup}>{lastDigit}</sup>
      </span>
      <span className="visually-hidden">{formatPrice(amount)}</span>
    </span>
  );
};
