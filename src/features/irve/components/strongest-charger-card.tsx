import { MapPin } from "lucide-react";
import type { ChargingSummary } from "../model/displayed-charging";
import { formatPower, getPowerCategory } from "../model/power";
import styles from "./strongest-charger-card.module.css";

type StrongestChargerCardProps = {
  summary: ChargingSummary;
  onShowOnMap: (stationId: string) => void;
};

export const StrongestChargerCard = ({
  summary,
  onShowOnMap,
}: StrongestChargerCardProps) => {
  const { strongest, stationCount, fastCount } = summary;
  const category = getPowerCategory(strongest.maxPowerKw);

  return (
    <section className={styles.card} aria-label="Borne la plus puissante">
      <p className={styles.eyebrow}>Borne la plus puissante</p>
      <p className={`${styles.power} ${styles[category]}`}>
        {formatPower(strongest.maxPowerKw)}
      </p>
      <p className={styles.name}>{strongest.name}</p>
      <p className={styles.address}>{strongest.address}</p>
      <p className={styles.stats}>
        {stationCount} borne{stationCount > 1 ? "s" : ""} dans la zone, dont{" "}
        {fastCount} rapide{fastCount > 1 ? "s" : ""} (50 kW et plus)
      </p>
      <button
        type="button"
        className={styles.action}
        onClick={() => onShowOnMap(strongest.id)}
      >
        <MapPin size={16} aria-hidden="true" />
        Voir sur la carte
      </button>
    </section>
  );
};
