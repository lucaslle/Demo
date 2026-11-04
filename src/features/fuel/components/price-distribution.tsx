import { formatPrice } from "@/shared/lib/format";
import { buildPriceHistogram } from "../model/price-histogram";
import type { PriceSummary } from "../model/price-summary";
import styles from "./price-distribution.module.css";

const MIN_BAR_HEIGHT_PERCENT = 6;

type PriceDistributionProps = {
  amounts: readonly number[];
  summary: PriceSummary;
};

export const PriceDistribution = ({
  amounts,
  summary,
}: PriceDistributionProps) => {
  const bins = buildPriceHistogram(amounts);
  const tallestCount = Math.max(1, ...bins.map(({ count }) => count));

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>Répartition des prix</figcaption>
      <div className={styles.bars} aria-hidden="true">
        {bins.map((bin) => (
          <span
            key={bin.from}
            className={styles.bar}
            data-lowest={bin.containsLowest ? "true" : undefined}
            style={{
              height: `${Math.max(MIN_BAR_HEIGHT_PERCENT, (bin.count / tallestCount) * 100)}%`,
            }}
          />
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        <span>{formatPrice(summary.lowest)}</span>
        <span>moy. {formatPrice(summary.average)}</span>
        <span>{formatPrice(summary.highest)}</span>
      </div>
      <p className="visually-hidden">
        Prix de {formatPrice(summary.lowest)} à {formatPrice(summary.highest)},
        moyenne {formatPrice(summary.average)}.
      </p>
    </figure>
  );
};
