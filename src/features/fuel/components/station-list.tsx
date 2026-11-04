import { formatPrice } from "@/shared/lib/format";
import type { DisplayedStation } from "../model/displayed-station";
import { PriceFreshness } from "./price-freshness";
import styles from "./station-list.module.css";

type StationListProps = {
  displayedStations: readonly DisplayedStation[];
  selectedStationId: number | null;
  now: Date;
  onSelectStation: (stationId: number) => void;
};

export const StationList = ({
  displayedStations,
  selectedStationId,
  now,
  onSelectStation,
}: StationListProps) => (
  <ol className={styles.list}>
    {displayedStations.map(({ station, price, tier }) => {
      const isSelected = station.id === selectedStationId;

      return (
        <li key={station.id}>
          <button
            type="button"
            className={styles.item}
            data-tier={tier}
            aria-current={isSelected ? "true" : undefined}
            onClick={() => onSelectStation(station.id)}
          >
            <span className={styles.price}>{formatPrice(price.amount)}</span>
            <span className={styles.address}>
              {station.address}, {station.postalCode} {station.city}
            </span>
            <span className={styles.freshness}>
              <PriceFreshness updatedAt={price.updatedAt} now={now} />
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);
