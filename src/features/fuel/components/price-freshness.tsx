import { Clock } from "lucide-react";
import { formatRelativeTime, isStaleDate } from "@/shared/lib/format";
import styles from "./price-freshness.module.css";

type PriceFreshnessProps = {
  updatedAt: string | null;
  now: Date;
};

export const PriceFreshness = ({ updatedAt, now }: PriceFreshnessProps) => {
  if (updatedAt === null) {
    return (
      <span className={styles.freshness}>
        <Clock size={13} aria-hidden="true" />
        Date de mise à jour inconnue
      </span>
    );
  }

  const isStale = isStaleDate(updatedAt, now);

  return (
    <span className={styles.freshness}>
      <Clock size={13} aria-hidden="true" />
      Mis à jour {formatRelativeTime(updatedAt, now)}
      {isStale && <strong className={styles.stale}>prix ancien</strong>}
    </span>
  );
};
