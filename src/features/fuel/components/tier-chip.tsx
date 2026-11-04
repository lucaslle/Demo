import {
  Minus,
  Star,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { TIER_LABELS, type PriceTier } from "../model/price-tier";
import styles from "./tier-chip.module.css";

const TIER_ICONS: Record<PriceTier, LucideIcon> = {
  cheapest: Star,
  low: TrendingDown,
  medium: Minus,
  high: TrendingUp,
};

type TierChipProps = {
  tier: PriceTier;
};

// Le palier est exprimé par un libellé et une icône, pas seulement par une couleur.
export const TierChip = ({ tier }: TierChipProps) => {
  const Icon = TIER_ICONS[tier];

  return (
    <span className={`${styles.chip} ${styles[tier]}`}>
      <Icon size={13} aria-hidden="true" />
      {TIER_LABELS[tier]}
    </span>
  );
};
