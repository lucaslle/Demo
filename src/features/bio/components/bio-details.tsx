import { Car } from "lucide-react";
import {
  formatDistance,
  getPrimaryKind,
  KIND_LABELS,
  type BioOperator,
} from "../model/operator";
import styles from "./bio-details.module.css";

type BioDetailsProps = {
  operator: BioOperator;
  routeSummary?: string | null;
};

// Contenu de la fenêtre qui s'ouvre sur la carte au clic sur un opérateur.
export const BioDetails = ({
  operator,
  routeSummary = null,
}: BioDetailsProps) => (
  <div className={styles.details}>
    <p className={styles.kind}>
      {KIND_LABELS[getPrimaryKind(operator.activities)]}
    </p>
    <p className={styles.name}>{operator.name}</p>
    <p className={styles.address}>{operator.address}</p>
    <p className={styles.meta}>
      À {formatDistance(operator.distanceKm)} du centre de la carte
    </p>
    {routeSummary !== null && (
      <p className={styles.route}>
        <Car size={16} aria-hidden="true" />
        {routeSummary}
      </p>
    )}
  </div>
);
