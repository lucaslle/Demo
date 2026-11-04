import { formatPrice } from "@/shared/lib/format";
import { FUEL_LABELS, FUEL_TYPES, type FuelType } from "../model/fuel-types";
import type { DisplayedStation } from "../model/displayed-station";
import { PriceFreshness } from "./price-freshness";
import styles from "./station-details.module.css";

type StationDetailsProps = {
  displayedStation: DisplayedStation;
  fuel: FuelType;
  now: Date;
};

export const StationDetails = ({
  displayedStation,
  fuel,
  now,
}: StationDetailsProps) => {
  const { station, price } = displayedStation;
  const otherFuels = FUEL_TYPES.filter(
    (otherFuel) =>
      otherFuel !== fuel && station.prices[otherFuel] !== undefined,
  );

  return (
    <div className={styles.details}>
      <p className={styles.address}>
        {station.address}
        <br />
        {station.postalCode} {station.city}
      </p>
      <p className={styles.mainPrice}>
        {FUEL_LABELS[fuel]} : <strong>{formatPrice(price.amount)}</strong>
      </p>
      <p className={styles.freshness}>
        <PriceFreshness updatedAt={price.updatedAt} now={now} />
      </p>
      {otherFuels.length > 0 && (
        <ul className={styles.otherFuels}>
          {otherFuels.map((otherFuel) => {
            const otherPrice = station.prices[otherFuel];
            return (
              otherPrice !== undefined && (
                <li key={otherFuel}>
                  {FUEL_LABELS[otherFuel]} : {formatPrice(otherPrice.amount)}
                </li>
              )
            );
          })}
        </ul>
      )}
    </div>
  );
};
