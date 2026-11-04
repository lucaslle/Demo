import { MapPin } from "lucide-react";
import { PriceDisplay } from "@/shared/components/price-display";
import type { DisplayedStation } from "../model/displayed-station";
import { FUEL_LABELS, type FuelType } from "../model/fuel-types";
import styles from "./best-price-card.module.css";

type BestPriceCardProps = {
  displayedStation: DisplayedStation;
  fuel: FuelType;
  onShowOnMap: (stationId: number) => void;
};

export const BestPriceCard = ({
  displayedStation,
  fuel,
  onShowOnMap,
}: BestPriceCardProps) => {
  const { station, price } = displayedStation;

  return (
    <section className={styles.card} aria-label="Meilleur prix de la zone">
      <p className={styles.eyebrow}>Meilleur prix · {FUEL_LABELS[fuel]}</p>
      <p className={styles.price}>
        <PriceDisplay amount={price.amount} size="xl" />
        <span className={styles.unit} aria-hidden="true">
          €/L
        </span>
      </p>
      <p className={styles.address}>
        {station.address}, {station.postalCode} {station.city}
      </p>
      <button
        type="button"
        className={styles.action}
        onClick={() => onShowOnMap(station.id)}
      >
        <MapPin size={16} aria-hidden="true" />
        Voir sur la carte
      </button>
    </section>
  );
};
