import { formatEuros } from "@/shared/lib/format";
import {
  computeFullTankSavings,
  FULL_TANK_LITERS,
  type PriceSummary,
} from "../model/price-summary";
import styles from "./savings-card.module.css";

const MIN_SAVINGS_TO_DISPLAY = 0.1;

type SavingsCardProps = {
  summary: PriceSummary;
};

export const SavingsCard = ({ summary }: SavingsCardProps) => {
  const savings = computeFullTankSavings(summary);
  if (savings < MIN_SAVINGS_TO_DISPLAY) {
    return null;
  }

  return (
    <aside className={styles.card} aria-label="Économie possible sur un plein">
      <p className={styles.eyebrow}>Sur un plein de {FULL_TANK_LITERS} L</p>
      <p className={styles.amount}>{formatEuros(savings)}</p>
      <p className={styles.text}>
        d&apos;économie en choisissant la station la moins chère plutôt que le
        prix moyen de la zone.
      </p>
    </aside>
  );
};
