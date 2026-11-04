import { Zap } from "lucide-react";
import {
  formatPower,
  getPowerCategory,
  POWER_CATEGORY_LABELS,
} from "../model/power";
import styles from "./power-badge.module.css";

type PowerBadgeProps = {
  powerKw: number | null;
};

// La catégorie est exprimée par un libellé et une icône, pas seulement par une couleur.
export const PowerBadge = ({ powerKw }: PowerBadgeProps) => {
  const category = getPowerCategory(powerKw);

  return (
    <span className={`${styles.badge} ${styles[category]}`}>
      <Zap size={13} aria-hidden="true" />
      {formatPower(powerKw)}
      <span className={styles.category}>{POWER_CATEGORY_LABELS[category]}</span>
    </span>
  );
};
