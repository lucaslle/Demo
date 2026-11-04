import { formatPrice } from "@/shared/lib/format";
import type { PriceSummary } from "../model/price-summary";
import styles from "./price-stats.module.css";

type PriceStatsProps = {
  summary: PriceSummary;
};

export const PriceStats = ({ summary }: PriceStatsProps) => (
  <dl className={styles.stats}>
    <div className={`${styles.stat} ${styles.highlight}`}>
      <dt>Le moins cher</dt>
      <dd>{formatPrice(summary.lowest)}</dd>
    </div>
    <div className={styles.stat}>
      <dt>Prix moyen</dt>
      <dd>{formatPrice(summary.average)}</dd>
    </div>
    <div className={styles.stat}>
      <dt>Écart</dt>
      <dd>{formatPrice(summary.spread)}</dd>
    </div>
  </dl>
);
