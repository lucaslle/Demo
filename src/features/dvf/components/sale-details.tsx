import { formatSaleDate } from "../model/sale-format";
import {
  formatPriceInEuros,
  formatPricePerSqm,
  formatSurface,
} from "../model/sale-format";
import type { Sale } from "../model/sale";
import styles from "./sale-details.module.css";

type SaleDetailsProps = {
  sale: Sale;
};

// Contenu de la fenêtre qui s'ouvre sur la carte au clic sur une vente.
export const SaleDetails = ({ sale }: SaleDetailsProps) => (
  <div className={styles.details}>
    <p className={styles.kind}>{sale.typeLabel}</p>
    <p className={styles.price}>{formatPriceInEuros(sale.price)}</p>
    {sale.pricePerSqm !== null && (
      <p className={styles.perSqm}>{formatPricePerSqm(sale.pricePerSqm)}</p>
    )}
    <p className={styles.meta}>
      {formatSaleDate(sale.date)}
      {sale.builtSurface !== null
        ? ` · ${formatSurface(sale.builtSurface)} bâtis`
        : ""}
    </p>
  </div>
);
