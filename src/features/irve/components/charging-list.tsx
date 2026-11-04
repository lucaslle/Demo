import type { ChargingStation } from "../model/charging-station";
import { PlugList } from "./plug-list";
import { PowerBadge } from "./power-badge";
import styles from "./charging-list.module.css";

type ChargingListProps = {
  stations: readonly ChargingStation[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
};

const formatRank = (index: number): string =>
  String(index + 1).padStart(2, "0");

export const ChargingList = ({
  stations,
  selectedStationId,
  onSelectStation,
}: ChargingListProps) => (
  <ol className={styles.list}>
    {stations.map((station, index) => (
      <li key={station.id}>
        <button
          type="button"
          className={styles.item}
          aria-current={station.id === selectedStationId ? "true" : undefined}
          onClick={() => onSelectStation(station.id)}
        >
          <span className={styles.rank} aria-hidden="true">
            {formatRank(index)}
          </span>
          <span className={styles.body}>
            <span className={styles.top}>
              <PowerBadge powerKw={station.maxPowerKw} />
              <span className={styles.points}>
                {station.pointCount} point{station.pointCount > 1 ? "s" : ""} de
                charge
              </span>
            </span>
            <span className={styles.name}>{station.name}</span>
            <span className={styles.address}>
              {station.operator} · {station.address}
            </span>
            <PlugList plugs={station.plugs} />
          </span>
        </button>
      </li>
    ))}
  </ol>
);
