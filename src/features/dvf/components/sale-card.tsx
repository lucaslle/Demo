import { X } from "lucide-react";
import type { Sale } from "../model/sale";
import {
  formatPriceInEuros,
  formatPricePerSqm,
  formatSaleDate,
  formatSurface,
} from "../model/sale-format";
import styles from "./sale-card.module.css";

type SaleCardProps = {
  sale: Sale;
  onClose: () => void;
};

type Row = { label: string; value: string };

const buildRows = (sale: Sale): Row[] => [
  { label: "Date de la vente", value: formatSaleDate(sale.date) },
  {
    label: "Nature",
    value: sale.isOffPlan ? "Vente sur plan (VEFA)" : sale.nature,
  },
  ...(sale.builtSurface === null
    ? []
    : [{ label: "Surface bâtie", value: formatSurface(sale.builtSurface) }]),
  ...(sale.landSurface === null
    ? []
    : [{ label: "Terrain", value: formatSurface(sale.landSurface) }]),
  ...(sale.lotCount > 0
    ? [{ label: "Lots", value: String(sale.lotCount) }]
    : []),
  ...(sale.parcel === null
    ? []
    : [{ label: "Parcelle cadastrale", value: sale.parcel }]),
];

// Fiche de la vente choisie. Les actes de vente ne mentionnent ni l'identité ni
// l'adresse précise : le repère est placé sur la parcelle cadastrale.
export const SaleCard = ({ sale, onClose }: SaleCardProps) => (
  <section className={styles.card} aria-label="Vente choisie">
    <div className={styles.header}>
      <p className={styles.eyebrow}>{sale.typeLabel}</p>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Fermer la fiche de la vente"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <p className={styles.price}>{formatPriceInEuros(sale.price)}</p>
    {sale.pricePerSqm !== null && (
      <p className={styles.perSqm}>{formatPricePerSqm(sale.pricePerSqm)}</p>
    )}
    <dl className={styles.rows}>
      {buildRows(sale).map(({ label, value }) => (
        <div key={label} className={styles.row}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);
