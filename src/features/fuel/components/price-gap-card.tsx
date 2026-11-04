import { formatEuros } from "@/shared/lib/format";
import { DEFAULT_TANK_LITERS, type Vehicle } from "@/shared/lib/vehicle";
import { computeTankCosts, type PriceSummary } from "../model/price-summary";
import styles from "./price-gap-card.module.css";

const MIN_GAP_TO_DISPLAY = 0.1;

type PriceGapCardProps = {
  summary: PriceSummary;
  vehicle: Vehicle | null;
};

// Écart, sur un plein, entre la station la moins chère et la plus chère de la
// zone affichée. Sans véhicule renseigné, on prend un réservoir de 50 L.
export const PriceGapCard = ({ summary, vehicle }: PriceGapCardProps) => {
  const liters = vehicle?.tankLiters ?? DEFAULT_TANK_LITERS;
  const costs = computeTankCosts(summary, liters);
  if (costs.gap < MIN_GAP_TO_DISPLAY) {
    return null;
  }

  const vehicleLabel = vehicle?.label.trim() ?? "";

  return (
    <aside className={styles.card} aria-label="Écart de prix sur un plein">
      <p className={styles.eyebrow}>
        Écart sur un plein de {liters} L
        {vehicleLabel !== "" && <span> · {vehicleLabel}</span>}
      </p>
      <p className={styles.amount}>{formatEuros(costs.gap)}</p>
      <p className={styles.text}>
        d&apos;écart dans la zone : {formatEuros(costs.cheapest)} dans la
        station la moins chère, {formatEuros(costs.priciest)} dans la plus
        chère.
      </p>
    </aside>
  );
};
