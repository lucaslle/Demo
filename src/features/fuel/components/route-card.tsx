import { X } from "lucide-react";
import { PriceDisplay } from "@/shared/components/price-display";
import { RoutePanel } from "@/features/route/components/route-panel";
import type { RouteState } from "@/features/route/model/route-state";
import { FUEL_LABELS, type FuelType } from "../model/fuel-types";
import type { FuelPrice, Station } from "../model/station";
import styles from "./route-card.module.css";

type RouteCardProps = {
  station: Station;
  price: FuelPrice;
  fuel: FuelType;
  routeState: RouteState;
  onRetryLocate: () => void;
  onClose: () => void;
};

// Fiche de la station choisie : son prix et l'itinéraire depuis la position de
// l'utilisateur. Remplace le « meilleur prix » tant qu'une station est choisie.
export const RouteCard = ({
  station,
  price,
  fuel,
  routeState,
  onRetryLocate,
  onClose,
}: RouteCardProps) => (
  <section className={styles.card} aria-label="Itinéraire vers la station">
    <div className={styles.header}>
      <p className={styles.eyebrow}>Station choisie</p>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Fermer l'itinéraire"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <p className={styles.price}>
      <PriceDisplay amount={price.amount} size="lg" />
      <span className={styles.fuel}>{FUEL_LABELS[fuel]}</span>
    </p>
    <p className={styles.address}>
      {station.address}, {station.postalCode} {station.city}
    </p>
    <RoutePanel state={routeState} onRetryLocate={onRetryLocate} />
  </section>
);
