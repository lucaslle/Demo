"use client";

import { AnimatedNumber } from "@/shared/components/animated-number";
import {
  formatInteger,
  formatPrice,
  formatRelativeTime,
} from "@/shared/lib/format";
import { useDepartmentPrices } from "../hooks/use-department-prices";
import styles from "./live-stats.module.css";

export const LiveStats = () => {
  const { data, isError, dataUpdatedAt } = useDepartmentPrices();

  if (isError) {
    return (
      <p className={styles.unavailable} role="status">
        Les statistiques en direct sont momentanément indisponibles.
      </p>
    );
  }

  const lastUpdatedAt = data?.lastUpdatedAt ?? null;

  return (
    <div className={styles.wrapper}>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Stations suivies</dt>
          <dd>
            <AnimatedNumber
              value={data?.totalStations ?? null}
              format={formatInteger}
            />
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>SP95-E10 moyen</dt>
          <dd>
            <AnimatedNumber
              value={data?.nationalAverages.e10 ?? null}
              format={formatPrice}
            />
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>Gazole moyen</dt>
          <dd>
            <AnimatedNumber
              value={data?.nationalAverages.gazole ?? null}
              format={formatPrice}
            />
          </dd>
        </div>
      </dl>
      {lastUpdatedAt !== null && (
        <p className={styles.freshness}>
          <span className={styles.pulse} aria-hidden="true" />
          Prix mis à jour{" "}
          {formatRelativeTime(lastUpdatedAt, new Date(dataUpdatedAt))}
        </p>
      )}
    </div>
  );
};
