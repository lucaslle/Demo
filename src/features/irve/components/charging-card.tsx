import { Clock, X } from "lucide-react";
import { RoutePanel } from "@/features/route/components/route-panel";
import type { RouteState } from "@/features/route/model/route-state";
import type { ChargingStation } from "../model/charging-station";
import { PlugList } from "./plug-list";
import { PowerBadge } from "./power-badge";
import { TariffInfo } from "./tariff-info";
import styles from "./charging-card.module.css";

type ChargingCardProps = {
  station: ChargingStation;
  routeState: RouteState;
  onRetryLocate: () => void;
  onClose: () => void;
};

// Fiche de la borne choisie : caractéristiques, tarif et itinéraire depuis la
// position de l'utilisateur.
export const ChargingCard = ({
  station,
  routeState,
  onRetryLocate,
  onClose,
}: ChargingCardProps) => (
  <section className={styles.card} aria-label="Borne de recharge choisie">
    <div className={styles.header}>
      <p className={styles.eyebrow}>Borne choisie</p>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Fermer la fiche de la borne"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <PowerBadge powerKw={station.maxPowerKw} />
    <p className={styles.name}>{station.name}</p>
    <p className={styles.address}>
      {station.operator} · {station.address}
    </p>
    <PlugList plugs={station.plugs} />
    <p className={styles.meta}>
      {station.pointCount} point{station.pointCount > 1 ? "s" : ""} de charge
      {station.isFree ? " · gratuit" : ""}
      {station.access !== null ? ` · ${station.access}` : ""}
    </p>
    {station.hours !== null && (
      <p className={styles.meta}>
        <Clock size={13} aria-hidden="true" />
        {station.hours}
      </p>
    )}
    <TariffInfo stationId={station.id} />
    <RoutePanel state={routeState} onRetryLocate={onRetryLocate} />
  </section>
);
