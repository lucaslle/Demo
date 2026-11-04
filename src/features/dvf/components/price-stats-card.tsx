import type { PriceStats } from "../model/sale-stats";
import { formatPricePerSqm } from "../model/sale-format";
import styles from "./price-stats-card.module.css";

type PriceStatsCardProps = {
  stats: PriceStats;
  saleCount: number;
};

// Prix médian au m² des logements vendus dans la zone affichée.
export const PriceStatsCard = ({ stats, saleCount }: PriceStatsCardProps) => (
  <section
    className={styles.card}
    aria-label="Prix au mètre carré dans la zone"
  >
    <p className={styles.eyebrow}>Prix médian dans la zone</p>
    <p className={styles.amount}>{formatPricePerSqm(stats.median)}</p>
    <p className={styles.text}>
      La moitié des ventes se situe entre{" "}
      <strong>{formatPricePerSqm(stats.lowerQuartile)}</strong> et{" "}
      <strong>{formatPricePerSqm(stats.upperQuartile)}</strong>.
    </p>
    <p className={styles.hint}>
      {stats.count} logement{stats.count > 1 ? "s" : ""} sur {saleCount} vente
      {saleCount > 1 ? "s" : ""} affichée{saleCount > 1 ? "s" : ""}. Repères :
      <span className={styles.legend}>
        <span data-tier="low">moins cher</span>
        <span data-tier="mid">dans la médiane</span>
        <span data-tier="high">plus cher</span>
      </span>
    </p>
  </section>
);
