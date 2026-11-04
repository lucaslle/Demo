"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { describeApiError } from "@/shared/api/describe-api-error";
import { formatPrice } from "@/shared/lib/format";
import { DEPARTMENT_NAMES, FRANCE_MAP } from "../data/departments";
import { useDepartmentPrices } from "../hooks/use-department-prices";
import { buildDepartmentHref } from "../model/department-link";
import {
  findPriceBounds,
  getScaleBin,
  rankDepartments,
  readDepartmentAverages,
  type DepartmentAverage,
} from "../model/department-prices";
import { DEFAULT_FUEL, FUEL_LABELS, type FuelType } from "../model/fuel-types";
import { FuelChips } from "./fuel-chips";
import styles from "./france-price-map.module.css";

const RANKING_SIZE = 3;
const SWEEP_DURATION_IN_MS = 700;
const WESTERNMOST_LONGITUDE = -5;
const LONGITUDE_SPAN = 14;

const nameOf = (code: string): string => DEPARTMENT_NAMES.get(code) ?? code;

// Fait « balayer » les couleurs de l'ouest vers l'est à l'arrivée des données.
const computeSweepDelay = (longitude: number): number => {
  const ratio = (longitude - WESTERNMOST_LONGITUDE) / LONGITUDE_SPAN;
  return Math.round(Math.min(1, Math.max(0, ratio)) * SWEEP_DURATION_IN_MS);
};

type RankingProps = {
  title: string;
  entries: readonly DepartmentAverage[];
  fuel: FuelType;
};

const Ranking = ({ title, entries, fuel }: RankingProps) => (
  <div>
    <h3 className={styles.rankingTitle}>{title}</h3>
    <ol className={styles.rankingList}>
      {entries.map(({ code, average }) => {
        const center = FRANCE_MAP.departments.find(
          (department) => department.code === code,
        )?.center;
        return (
          <li key={code}>
            {center === undefined ? (
              <span>{nameOf(code)}</span>
            ) : (
              <Link href={buildDepartmentHref(center, fuel)}>
                {nameOf(code)}
              </Link>
            )}
            <strong>{formatPrice(average)}</strong>
          </li>
        );
      })}
    </ol>
  </div>
);

export const FrancePriceMap = () => {
  const router = useRouter();
  const [fuel, setFuel] = useState<FuelType>(DEFAULT_FUEL);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const { data, isPending, isError, error, refetch } = useDepartmentPrices();

  const averages = useMemo(
    () => readDepartmentAverages(data?.departments ?? [], fuel),
    [data, fuel],
  );
  const averageByCode = useMemo(
    () => new Map(averages.map((entry) => [entry.code, entry])),
    [averages],
  );
  const bounds = useMemo(() => findPriceBounds(averages), [averages]);
  const ranking = useMemo(() => rankDepartments(averages), [averages]);

  const hoveredShape =
    hoveredCode === null
      ? undefined
      : FRANCE_MAP.departments.find(({ code }) => code === hoveredCode);
  const hoveredAverage =
    hoveredCode === null ? undefined : averageByCode.get(hoveredCode);

  const cheapest = ranking.slice(0, RANKING_SIZE);
  const priciest = ranking.slice(-RANKING_SIZE).reverse();

  const { width, height } = FRANCE_MAP.viewBox;

  return (
    <section className={styles.card} aria-labelledby="titre-carte-france">
      <div className={styles.header}>
        <h2 id="titre-carte-france" className={styles.title}>
          Prix moyen par département
        </h2>
        <FuelChips value={fuel} onChange={setFuel} />
      </div>

      <div className={styles.mapArea}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          focusable="false"
        >
          {FRANCE_MAP.departments.map(({ code, path, center }) => {
            const entry = averageByCode.get(code);
            const hasPrice = entry !== undefined && bounds !== null;
            return (
              <path
                key={code}
                d={path}
                className={styles.department}
                data-loading={isPending ? "true" : undefined}
                style={{
                  fill: hasPrice
                    ? `var(--scale-${getScaleBin(entry.average, bounds)})`
                    : "var(--surface-2)",
                  transitionDelay: `${computeSweepDelay(center[1])}ms`,
                }}
                onPointerEnter={() => setHoveredCode(code)}
                onPointerLeave={() => setHoveredCode(null)}
                onClick={() => router.push(buildDepartmentHref(center, fuel))}
              />
            );
          })}
          {hoveredShape !== undefined && (
            <path
              d={hoveredShape.path}
              className={styles.hoverOutline}
              pointerEvents="none"
            />
          )}
        </svg>

        <div className={styles.readout} aria-hidden="true">
          {hoveredShape === undefined ? (
            <span className={styles.readoutHint}>
              Survolez la carte, cliquez pour voir les stations
            </span>
          ) : (
            <>
              <strong>{hoveredShape.name}</strong>
              <span>
                {hoveredAverage === undefined
                  ? "Pas de prix"
                  : `${FUEL_LABELS[fuel]} ${formatPrice(hoveredAverage.average)} · ${hoveredAverage.stationCount} stations`}
              </span>
            </>
          )}
        </div>
      </div>

      {bounds !== null && (
        <div className={styles.legend} aria-hidden="true">
          <span>{formatPrice(bounds.min)}</span>
          <span className={styles.legendBar} />
          <span>{formatPrice(bounds.max)}</span>
        </div>
      )}

      {isError && (
        <div className={styles.error} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>{describeApiError(error)}</span>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              void refetch();
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {ranking.length > 0 && (
        <div className={styles.rankings}>
          <Ranking title="Les moins chers" entries={cheapest} fuel={fuel} />
          <Ranking title="Les plus chers" entries={priciest} fuel={fuel} />
        </div>
      )}
    </section>
  );
};
