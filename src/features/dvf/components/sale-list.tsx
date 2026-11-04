import type { Sale } from "../model/sale";
import { getPriceTier, type PriceTier } from "../model/sale-stats";
import {
  formatPriceInEuros,
  formatPricePerSqm,
  formatSaleDate,
  formatSurface,
} from "../model/sale-format";
import styles from "./sale-list.module.css";

type SaleListProps = {
  sales: readonly Sale[];
  median: number | null;
  selectedSaleId: string | null;
  onSelectSale: (saleId: string) => void;
};

const TIER_LABELS: Record<PriceTier, string> = {
  low: "Sous la médiane",
  mid: "Dans la médiane",
  high: "Au-dessus de la médiane",
  unknown: "",
};

export const SaleList = ({
  sales,
  median,
  selectedSaleId,
  onSelectSale,
}: SaleListProps) => (
  <ol className={styles.list}>
    {sales.map((sale) => {
      const tier = getPriceTier(sale.pricePerSqm, median);
      return (
        <li key={sale.id}>
          <button
            type="button"
            className={styles.item}
            aria-current={sale.id === selectedSaleId ? "true" : undefined}
            onClick={() => onSelectSale(sale.id)}
          >
            <span className={styles.top}>
              <span className={styles.kind}>{sale.typeLabel}</span>
              <span className={styles.date}>{formatSaleDate(sale.date)}</span>
            </span>
            <span className={styles.price}>
              {formatPriceInEuros(sale.price)}
              {sale.builtSurface !== null && (
                <span className={styles.surface}>
                  {" "}
                  · {formatSurface(sale.builtSurface)}
                </span>
              )}
            </span>
            {sale.pricePerSqm !== null && (
              <span className={styles.perSqm} data-tier={tier}>
                {formatPricePerSqm(sale.pricePerSqm)}
                {TIER_LABELS[tier] !== "" && (
                  <span className={styles.tier}> · {TIER_LABELS[tier]}</span>
                )}
              </span>
            )}
          </button>
        </li>
      );
    })}
  </ol>
);
