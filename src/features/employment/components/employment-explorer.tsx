"use client";

import {
  Minus,
  SearchX,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { describeApiError } from "@/shared/api/describe-api-error";
import { ChipGroup } from "@/shared/components/chip-group";
import { StatusMessage } from "@/shared/components/status-message";
import {
  formatCompact,
  formatEuros,
  formatInteger,
  formatPercent,
} from "@/shared/lib/format";
import {
  useEmploymentSeries,
  useSectorBreakdown,
} from "../hooks/use-employment-data";
import { useEmploymentUrlState } from "../hooks/use-employment-url-state";
import {
  BRANCHES,
  computeChange,
  findBranchByCode,
  findSectorByKey,
  INDICATOR_LABELS,
  INDICATORS,
  INFORMATICS_BRANCH_CODE,
  QUARTERS_IN_FIVE_YEARS,
  QUARTERS_PER_YEAR,
  SECTORS,
  type Indicator,
  type QuarterPoint,
} from "../model/employment";
import {
  DEFAULT_TERRITORY,
  FRANCE_CODE,
  findTerritory,
  formatTerritoryLabel,
  TERRITORIES,
} from "../model/territories";
import { ALL_SECTORS_KEY } from "../model/url-state";
import { EmploymentChart } from "./employment-chart";
import styles from "./employment-explorer.module.css";

const INDICATOR_OPTIONS = INDICATORS.map((indicator) => ({
  value: indicator,
  label: INDICATOR_LABELS[indicator],
}));

const INFORMATICS_KEY = "informatique";
// Aucune puce cochée : une autre branche est choisie dans la liste déroulante.
const OTHER_BRANCH_KEY = "autre-branche";

const GRAND_SECTOR_OPTIONS = [
  { value: ALL_SECTORS_KEY, label: "Tous les secteurs" },
  ...SECTORS.map(({ key, label }) => ({ value: key, label })),
];

// L'informatique n'existe pas parmi les grands secteurs : elle vient du jeu de
// données par branche, disponible pour la France entière.
const NATIONAL_SECTOR_OPTIONS = [
  ...GRAND_SECTOR_OPTIONS,
  { value: INFORMATICS_KEY, label: "Informatique" },
];

const formatIndicatorValue = (indicator: Indicator, value: number): string =>
  indicator === "payroll" ? `${formatCompact(value)} €` : formatInteger(value);

type DeltaProps = {
  change: number | null;
  period: string;
};

// La tendance est exprimée par une icône et du texte, pas seulement par une couleur.
const Delta = ({ change, period }: DeltaProps) => {
  if (change === null) {
    return (
      <p className={styles.delta}>
        <Minus size={16} aria-hidden="true" />
        <span>Non disponible {period}</span>
      </p>
    );
  }

  const Icon =
    change > 0.05 ? TrendingUp : change < -0.05 ? TrendingDown : Minus;
  const trend = change > 0.05 ? "up" : change < -0.05 ? "down" : "flat";

  return (
    <p className={styles.delta} data-trend={trend}>
      <Icon size={16} aria-hidden="true" />
      <strong>{formatPercent(change)}</strong>
      <span>{period}</span>
    </p>
  );
};

const describeSeries = (
  indicator: Indicator,
  territoryLabel: string,
  points: readonly QuarterPoint[],
): string => {
  const latest = points[points.length - 1];
  const value = latest?.[indicator];
  if (latest === undefined || value === null || value === undefined) {
    return "";
  }
  const yearly = computeChange(points, indicator, QUARTERS_PER_YEAR);
  const fiveYears = computeChange(points, indicator, QUARTERS_IN_FIVE_YEARS);
  const parts = [
    `${INDICATOR_LABELS[indicator]}, ${territoryLabel} : ${
      indicator === "payroll" ? formatEuros(value) : formatInteger(value)
    } au ${latest.label}`,
    yearly === null ? null : `${formatPercent(yearly)} sur un an`,
    fiveYears === null ? null : `${formatPercent(fiveYears)} sur cinq ans`,
  ];
  return `${parts.filter((part) => part !== null).join(", ")}.`;
};

export const EmploymentExplorer = () => {
  const territorySelectId = useId();
  const branchSelectId = useId();
  const { initialState, writeState } = useEmploymentUrlState();
  const [territoryCode, setTerritoryCode] = useState(
    initialState.territory.code,
  );
  const [sectorKey, setSectorKey] = useState(
    initialState.sector?.key ?? ALL_SECTORS_KEY,
  );
  const [branchCode, setBranchCode] = useState<string | null>(
    initialState.branch?.code ?? null,
  );
  const [indicator, setIndicator] = useState<Indicator>(initialState.indicator);

  const territory = findTerritory(territoryCode) ?? DEFAULT_TERRITORY;
  const isNational = territory.code === FRANCE_CODE;
  // La branche fine n'existe qu'au niveau national : hors France on retombe sur
  // les grands secteurs sans perdre le choix si l'on revient à la France.
  const branch = isNational ? (findBranchByCode(branchCode) ?? null) : null;
  const sector = branch === null ? (findSectorByKey(sectorKey) ?? null) : null;
  const territoryLabel = formatTerritoryLabel(territory);

  const seriesQuery = useEmploymentSeries(territory, sector, branch);
  const points = useMemo(() => seriesQuery.data ?? [], [seriesQuery.data]);
  const latest = points[points.length - 1];
  const breakdownQuery = useSectorBreakdown(territory, latest?.date ?? null);

  useEffect(() => {
    writeState({ territory, sector, branch, indicator });
  }, [territory, sector, branch, indicator, writeState]);

  const chipValue =
    branch === null
      ? sectorKey
      : branch.code === INFORMATICS_BRANCH_CODE
        ? INFORMATICS_KEY
        : OTHER_BRANCH_KEY;

  const handleChipChange = (nextKey: string) => {
    if (nextKey === INFORMATICS_KEY) {
      setBranchCode(INFORMATICS_BRANCH_CODE);
      setSectorKey(ALL_SECTORS_KEY);
      return;
    }
    setBranchCode(null);
    setSectorKey(nextKey);
  };

  const handleBranchSelect = (nextCode: string) => {
    setBranchCode(nextCode === "" ? null : nextCode);
    setSectorKey(ALL_SECTORS_KEY);
  };

  const handleBreakdownClick = (clickedKey: string) => {
    setBranchCode(null);
    setSectorKey(sector?.key === clickedKey ? ALL_SECTORS_KEY : clickedKey);
  };

  const yearlyChange = computeChange(points, indicator, QUARTERS_PER_YEAR);
  const fiveYearChange = computeChange(
    points,
    indicator,
    QUARTERS_IN_FIVE_YEARS,
  );
  const latestValue = latest?.[indicator] ?? null;

  const breakdown = breakdownQuery.data ?? [];
  const breakdownTotal = breakdown.reduce(
    (total, share) =>
      total + (indicator === "payroll" ? share.payroll : share.employees),
    0,
  );

  const isRefreshing = seriesQuery.isPlaceholderData;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Emploi et salaires</h1>
        <p className={styles.lead}>
          Effectifs salariés et masse salariale du secteur privé, par
          département et par grand secteur, trimestre après trimestre depuis
          2001. Pour la France entière, le détail va jusqu&apos;à la branche
          d&apos;activité : informatique, santé, finance…
        </p>
      </header>

      <section className={styles.controls} aria-label="Choix des données">
        <div className={styles.field}>
          <label htmlFor={territorySelectId}>Territoire</label>
          <select
            id={territorySelectId}
            value={territory.code}
            onChange={(event) => setTerritoryCode(event.target.value)}
          >
            {TERRITORIES.map((option) => (
              <option key={option.code} value={option.code}>
                {formatTerritoryLabel(option)}
              </option>
            ))}
          </select>
        </div>
        <ChipGroup
          legend="Indicateur"
          options={INDICATOR_OPTIONS}
          value={indicator}
          onChange={setIndicator}
          layout="wrap"
        />
        <ChipGroup
          legend="Secteur"
          options={isNational ? NATIONAL_SECTOR_OPTIONS : GRAND_SECTOR_OPTIONS}
          value={chipValue}
          onChange={handleChipChange}
          layout="wrap"
        />
        {isNational ? (
          <div className={styles.field}>
            <label htmlFor={branchSelectId}>
              Autre branche d&apos;activité
            </label>
            <select
              id={branchSelectId}
              value={branch?.code ?? ""}
              onChange={(event) => handleBranchSelect(event.target.value)}
            >
              <option value="">Choisir une branche…</option>
              {BRANCHES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className={styles.note}>
            Le détail par branche (informatique, santé, finance…) n&apos;est
            publié que pour la France entière.
          </p>
        )}
      </section>

      {seriesQuery.isError && seriesQuery.data === undefined ? (
        <StatusMessage
          variant="error"
          icon={TriangleAlert}
          title="Impossible de charger les données"
          action={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                void seriesQuery.refetch();
              }}
            >
              Réessayer
            </button>
          }
        >
          {describeApiError(seriesQuery.error)}
        </StatusMessage>
      ) : seriesQuery.isPending ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : points.length === 0 ? (
        <StatusMessage
          variant="empty"
          icon={SearchX}
          title="Aucune donnée pour cette sélection"
        >
          Essayez un autre territoire ou un autre secteur.
        </StatusMessage>
      ) : (
        <div
          className={styles.results}
          data-refreshing={isRefreshing || undefined}
        >
          <dl className={styles.kpis}>
            <div className={styles.kpi}>
              <dt>{latest?.label ?? ""}</dt>
              <dd className={styles.kpiValue}>
                {latestValue === null
                  ? "—"
                  : formatIndicatorValue(indicator, latestValue)}
              </dd>
              <p className={styles.kpiHint}>
                {indicator === "payroll"
                  ? "masse salariale du trimestre"
                  : "salariés"}
              </p>
            </div>
            <div className={styles.kpi}>
              <dt>Sur un an</dt>
              <dd>
                <Delta change={yearlyChange} period="vs il y a un an" />
              </dd>
            </div>
            <div className={styles.kpi}>
              <dt>Sur cinq ans</dt>
              <dd>
                <Delta change={fiveYearChange} period="vs il y a cinq ans" />
              </dd>
            </div>
          </dl>

          <section className={styles.card} aria-labelledby="titre-evolution">
            <h2 id="titre-evolution" className={styles.cardTitle}>
              Évolution trimestrielle
            </h2>
            <p className={styles.caption}>
              {INDICATOR_LABELS[indicator]} · {territoryLabel}
              {sector !== null ? ` · ${sector.label}` : ""}
              {branch !== null ? ` · ${branch.label}` : ""} · corrigé des
              variations saisonnières
            </p>
            <EmploymentChart points={points} indicator={indicator} />
            <p className="visually-hidden">
              {describeSeries(indicator, territoryLabel, points)}
            </p>
            <details className={styles.details}>
              <summary>Voir les données en tableau</summary>
              <div className={styles.tableWrap}>
                <table>
                  <caption className="visually-hidden">
                    {INDICATOR_LABELS[indicator]} par trimestre,{" "}
                    {territoryLabel}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Trimestre</th>
                      <th scope="col">{INDICATOR_LABELS[indicator]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((point) => {
                      const value = point[indicator];
                      return (
                        <tr key={point.date}>
                          <th scope="row">{point.label}</th>
                          <td>
                            {value === null
                              ? "—"
                              : indicator === "payroll"
                                ? formatEuros(value)
                                : formatInteger(value)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section className={styles.card} aria-labelledby="titre-secteurs">
            <h2 id="titre-secteurs" className={styles.cardTitle}>
              Répartition par grand secteur
            </h2>
            <p className={styles.caption}>
              {latest?.label ?? ""} · {INDICATOR_LABELS[indicator]} ·{" "}
              {territoryLabel}
            </p>
            {breakdown.length === 0 ? (
              <p className={styles.kpiHint}>
                {breakdownQuery.isError
                  ? "Répartition momentanément indisponible."
                  : "Chargement de la répartition…"}
              </p>
            ) : (
              <ul className={styles.sectors}>
                {[...breakdown]
                  .sort((first, second) =>
                    indicator === "payroll"
                      ? second.payroll - first.payroll
                      : second.employees - first.employees,
                  )
                  .map((share) => {
                    const value =
                      indicator === "payroll" ? share.payroll : share.employees;
                    const ratio =
                      breakdownTotal === 0 ? 0 : value / breakdownTotal;
                    return (
                      <li key={share.sector.key}>
                        <button
                          type="button"
                          className={styles.sectorRow}
                          aria-pressed={sector?.key === share.sector.key}
                          onClick={() => handleBreakdownClick(share.sector.key)}
                        >
                          <span className={styles.sectorName}>
                            {share.sector.label}
                          </span>
                          <span className={styles.sectorValue}>
                            {formatIndicatorValue(indicator, value)} ·{" "}
                            {Math.round(ratio * 100)} %
                          </span>
                          <span className={styles.sectorBar} aria-hidden="true">
                            <span style={{ width: `${ratio * 100}%` }} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          <p className={styles.source}>
            Source : données ouvertes Urssaf (Licence ODbL), effectifs salariés
            et masse salariale du secteur privé relevant des Urssaf, corrigés
            des variations saisonnières. Dernier trimestre publié :{" "}
            {latest?.label ?? "—"}.
          </p>
        </div>
      )}
    </div>
  );
};
