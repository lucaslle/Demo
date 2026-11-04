import { Car } from "lucide-react";
import { PriceDisplay } from "@/shared/components/price-display";
import { formatPrice } from "@/shared/lib/format";
import type { DisplayedStation } from "../model/displayed-station";
import { FUEL_LABELS, FUEL_TYPES, type FuelType } from "../model/fuel-types";
import { PriceFreshness } from "./price-freshness";
import styles from "./station-details.module.css";
import { TierChip } from "./tier-chip";

type StationDetailsProps = {
  displayedStation: DisplayedStation;
  fuel: FuelType;
  now: Date;
  routeSummary?: string | null;
};

export const StationDetails = ({
  displayedStation,
  fuel,
  now,
  routeSummary = null,
}: StationDetailsProps) => {
  const { station, price, tier } = displayedStation;
  const otherFuels = FUEL_TYPES.flatMap((otherFuel) => {
    const otherPrice = station.prices[otherFuel];
    return otherFuel !== fuel && otherPrice !== undefined
      ? [{ fuel: otherFuel, amount: otherPrice.amount }]
      : [];
  });

  return (
    <div className={styles.details}>
      <TierChip tier={tier} />
      <p className={styles.mainPrice}>
        <PriceDisplay amount={price.amount} size="lg" />
        <span className={styles.fuelName}>{FUEL_LABELS[fuel]}</span>
      </p>
      <p className={styles.address}>
        {station.address}
        <br />
        {station.postalCode} {station.city}
      </p>
      <p className={styles.freshness}>
        <PriceFreshness updatedAt={price.updatedAt} now={now} />
      </p>
      {routeSummary !== null && (
        <p className={styles.route}>
          <Car size={16} aria-hidden="true" />
          {routeSummary}
        </p>
      )}
      {otherFuels.length > 0 && (
        <ul className={styles.otherFuels}>
          {otherFuels.map((otherFuel) => (
            <li key={otherFuel.fuel}>
              <span>{FUEL_LABELS[otherFuel.fuel]}</span>
              <strong>{formatPrice(otherFuel.amount)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
