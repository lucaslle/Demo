import { Car, Clock } from "lucide-react";
import type { ChargingStation } from "../model/charging-station";
import { PlugList } from "./plug-list";
import { PowerBadge } from "./power-badge";
import styles from "./charging-details.module.css";

type ChargingDetailsProps = {
  station: ChargingStation;
  routeSummary?: string | null;
};

// Contenu de la fenêtre qui s'ouvre sur la carte au clic sur une borne.
export const ChargingDetails = ({
  station,
  routeSummary = null,
}: ChargingDetailsProps) => (
  <div className={styles.details}>
    <PowerBadge powerKw={station.maxPowerKw} />
    <p className={styles.name}>{station.name}</p>
    <p className={styles.operator}>{station.operator}</p>
    <p className={styles.address}>{station.address}</p>
    <PlugList plugs={station.plugs} />
    <p className={styles.meta}>
      {station.pointCount} point{station.pointCount > 1 ? "s" : ""} de charge
      {station.isFree ? " · gratuit" : ""}
    </p>
    {station.hours !== null && (
      <p className={styles.meta}>
        <Clock size={13} aria-hidden="true" />
        {station.hours}
      </p>
    )}
    {routeSummary !== null && (
      <p className={styles.route}>
        <Car size={16} aria-hidden="true" />
        {routeSummary}
      </p>
    )}
  </div>
);
