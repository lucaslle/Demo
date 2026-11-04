"use client";

import {
  Minus,
  PlugZap,
  SearchX,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { PlaceSearch } from "@/features/places/components/place-search";
import { useCommune } from "@/features/places/hooks/use-places";
import { isCommuneCode, type Place } from "@/features/places/model/place";
import { describeApiError } from "@/shared/api/describe-api-error";
import { StatusMessage } from "@/shared/components/status-message";
import {
  formatDecimal,
  formatInteger,
  formatPercent,
} from "@/shared/lib/format";
import { IRIS_ROWS_LIMIT } from "../api/fetch-enedis";
import { useIrisConsumption, useSectorSeries } from "../hooks/use-enedis-data";
import { useEnedisUrlState } from "../hooks/use-enedis-url-state";
import {
  buildSectorShares,
  buildYearPoints,
  computeYearChange,
  formatEnergy,
  formatMwhPerSite,
  rankIris,
  SECTOR_LABELS,
  type YearPoint,
} from "../model/electricity";
import { ElectricityChart } from "./electricity-chart";
import styles from "./electricity-explorer.module.css";

const EXAMPLE_COMMUNES = [
  { code: "33063", name: "Bordeaux" },
  { code: "69123", name: "Lyon" },
  { code: "35238", name: "Rennes" },
  { code: "75056", name: "Paris" },
];

const TOP_IRIS_COUNT = 10;

type DeltaProps = {
  change: number | null;
  previousYear: number;
};

// La tendance est exprimée par une icône et du texte, jamais par la couleur
// seule ; une hausse de consommation n'est ni bonne ni mauvaise en soi.
const Delta = ({ change, previousYear }: DeltaProps) => {
  if (change === null) {
    return (
      <p className={styles.delta}>
        <Minus size={16} aria-hidden="true" />
        <span>Non disponible vs {previousYear}</span>
      </p>
    );
  }
  const Icon =
    change > 0.05 ? TrendingUp : change < -0.05 ? TrendingDown : Minus;
  return (
    <p className={styles.delta}>
      <Icon size={16} aria-hidden="true" />
      <strong>{formatPercent(change)}</strong>
      <span>vs {previousYear}</span>
    </p>
  );
};

const describeSeries = (communeName: string, points: readonly YearPoint[]) => {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) {
    return "";
  }
  return `Consommation d'électricité de ${communeName} : ${formatEnergy(first.total)} en ${first.year}, ${formatEnergy(last.total)} en ${last.year}.`;
};

export const ElectricityExplorer = () => {
  const yearSelectId = useId();
  const { initialState, writeState } = useEnedisUrlState();
  const [communeCode, setCommuneCode] = useState(initialState.communeCode);
  const [requestedYear, setRequestedYear] = useState(initialState.year);

  const communeQuery = useCommune(communeCode);
  const seriesQuery = useSectorSeries(communeCode);
  const points = useMemo(
    () => buildYearPoints(seriesQuery.data ?? []),
    [seriesQuery.data],
  );
  const selectedPoint =
    points.find(({ year }) => year === requestedYear) ?? points.at(-1);
  const year = selectedPoint?.year ?? null;
  const irisQuery = useIrisConsumption(communeCode, year);

  useEffect(() => {
    writeState({ communeCode, year });
  }, [communeCode, year, writeState]);

  const communeName = communeQuery.data?.name ?? `Commune ${communeCode ?? ""}`;
  const ranking = useMemo(
    () => rankIris(irisQuery.data?.rows ?? []),
    [irisQuery.data],
  );
  const topIris = ranking.slice(0, TOP_IRIS_COUNT);
  const maxPerHousing = topIris[0]?.perHousing ?? 0;
  const irisTotalCount = irisQuery.data?.totalCount ?? 0;
  const shares =
    selectedPoint === undefined ? [] : buildSectorShares(selectedPoint);

  const handleSelectPlace = (place: Place) => {
    if (isCommuneCode(place.citycode)) {
      setCommuneCode(place.citycode);
      setRequestedYear(null);
    }
  };

  const handleSelectExample = (code: string) => {
    setCommuneCode(code);
    setRequestedYear(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Consommation électrique</h1>
        <p className={styles.lead}>
          Ce que consomme une commune, par secteur d&apos;activité et par année,
          et quels quartiers consomment le plus par logement, à partir des
          données ouvertes d&apos;Enedis.
        </p>
      </header>

      <section className={styles.controls} aria-label="Choix des données">
        <PlaceSearch
          label="Commune"
          placeholder="Ex. Bordeaux, Lyon, Rennes"
          scope="municipality"
          onSelect={handleSelectPlace}
        />
        {points.length > 0 && year !== null && (
          <div className={styles.field}>
            <label htmlFor={yearSelectId}>Année</label>
            <select
              id={yearSelectId}
              value={year}
              onChange={(event) => setRequestedYear(Number(event.target.value))}
            >
              {[...points].reverse().map((point) => (
                <option key={point.year} value={point.year}>
                  {point.year}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {communeCode === null ? (
        <StatusMessage
          variant="info"
          icon={PlugZap}
          title="Choisissez une commune"
          action={
            <div className={styles.examples}>
              {EXAMPLE_COMMUNES.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  className="button button--secondary"
                  onClick={() => handleSelectExample(code)}
                >
                  {name}
                </button>
              ))}
            </div>
          }
        >
          Cherchez une commune, ou essayez un exemple.
        </StatusMessage>
      ) : seriesQuery.isError ? (
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
      ) : selectedPoint === undefined || year === null ? (
        <StatusMessage
          variant="empty"
          icon={SearchX}
          title="Aucune donnée pour cette commune"
        >
          Enedis ne dessert pas toute la France (c&apos;est le cas de la Corse
          et d&apos;une partie de l&apos;outre-mer). Essayez une autre commune.
        </StatusMessage>
      ) : (
        <div className={styles.results}>
          <h2 className={styles.communeTitle}>
            {communeName}
            <span className={styles.year}>{year}</span>
          </h2>

          <dl className={styles.kpis}>
            <div className={styles.kpi}>
              <dt>Consommation totale</dt>
              <dd className={styles.kpiValue}>
                {formatEnergy(selectedPoint.total)}
              </dd>
              <dd>
                <Delta
                  change={computeYearChange(points, year, "total")}
                  previousYear={year - 1}
                />
              </dd>
            </div>
            <div className={styles.kpi}>
              <dt>Résidentiel</dt>
              <dd className={styles.kpiValue}>
                {formatEnergy(selectedPoint.residential)}
              </dd>
              <dd>
                <Delta
                  change={computeYearChange(points, year, "residential")}
                  previousYear={year - 1}
                />
              </dd>
            </div>
            <div className={styles.kpi}>
              <dt>Par site résidentiel</dt>
              <dd className={styles.kpiValue}>
                {selectedPoint.perResidentialSite === null
                  ? "—"
                  : formatMwhPerSite(selectedPoint.perResidentialSite)}
              </dd>
              <dd>
                <Delta
                  change={computeYearChange(points, year, "perResidentialSite")}
                  previousYear={year - 1}
                />
              </dd>
              <dd className={styles.kpiHint}>
                par an, sur {formatInteger(selectedPoint.residentialSites)}{" "}
                points de livraison
              </dd>
            </div>
          </dl>

          <section className={styles.card} aria-labelledby="titre-evolution">
            <h2 id="titre-evolution" className={styles.cardTitle}>
              Évolution annuelle
            </h2>
            <p className={styles.caption}>
              {communeName} · total (trait plein) et résidentiel (pointillés) ·
              avant 2018, les séries peuvent présenter des ruptures
            </p>
            <ElectricityChart points={points} />
            <p className="visually-hidden">
              {describeSeries(communeName, points)}
            </p>
            <details className={styles.details}>
              <summary>Voir les données en tableau</summary>
              <div className={styles.tableWrap}>
                <table>
                  <caption className="visually-hidden">
                    Consommation d&apos;électricité par année, {communeName}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Année</th>
                      <th scope="col">Total</th>
                      <th scope="col">Résidentiel</th>
                      <th scope="col">Par site résidentiel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((point) => (
                      <tr key={point.year}>
                        <th scope="row">{point.year}</th>
                        <td>{formatEnergy(point.total)}</td>
                        <td>{formatEnergy(point.residential)}</td>
                        <td>
                          {point.perResidentialSite === null
                            ? "—"
                            : formatMwhPerSite(point.perResidentialSite)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section className={styles.card} aria-labelledby="titre-secteurs">
            <h2 id="titre-secteurs" className={styles.cardTitle}>
              Répartition par secteur
            </h2>
            <p className={styles.caption}>
              {communeName} · {year}
            </p>
            <ul className={styles.bars}>
              {shares.map(({ sector, mwh, ratio }) => (
                <li key={sector} className={styles.bar}>
                  <span className={styles.barName}>
                    {SECTOR_LABELS[sector]}
                  </span>
                  <span className={styles.barValue}>
                    {formatEnergy(mwh)} · {Math.round(ratio * 100)} %
                  </span>
                  <span className={styles.barTrack} aria-hidden="true">
                    <span style={{ width: `${ratio * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card} aria-labelledby="titre-quartiers">
            <h2 id="titre-quartiers" className={styles.cardTitle}>
              Quartiers : consommation par logement
            </h2>
            <p className={styles.caption}>
              Résidentiel · {year} · quartiers IRIS de {communeName}
            </p>
            {irisQuery.isError ? (
              <StatusMessage
                variant="error"
                icon={TriangleAlert}
                title="Détail par quartier indisponible"
                action={
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      void irisQuery.refetch();
                    }}
                  >
                    Réessayer
                  </button>
                }
              >
                {describeApiError(irisQuery.error)}
              </StatusMessage>
            ) : irisQuery.isPending ? (
              <div className={styles.skeletonSmall} aria-hidden="true" />
            ) : ranking.length === 0 ? (
              <p className={styles.kpiHint}>
                Pas de détail par quartier pour cette commune en {year}.
              </p>
            ) : (
              <>
                <ol className={styles.bars}>
                  {topIris.map((iris) => (
                    <li key={iris.code} className={styles.bar}>
                      <span className={styles.barName}>{iris.name}</span>
                      <span className={styles.barValue}>
                        {formatDecimal(Number(iris.perHousing.toFixed(2)))} MWh
                        par logement
                      </span>
                      <span className={styles.barTrack} aria-hidden="true">
                        <span
                          style={{
                            width: `${maxPerHousing === 0 ? 0 : (iris.perHousing / maxPerHousing) * 100}%`,
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
                {irisTotalCount > IRIS_ROWS_LIMIT && (
                  <p className={styles.kpiHint}>
                    Cette commune compte {formatInteger(irisTotalCount)}{" "}
                    quartiers : seuls les {IRIS_ROWS_LIMIT} plus consommateurs
                    sont classés.
                  </p>
                )}
                <details className={styles.details}>
                  <summary>
                    Voir les {formatInteger(ranking.length)} quartiers en
                    tableau
                  </summary>
                  <div className={styles.tableWrap}>
                    <table>
                      <caption className="visually-hidden">
                        Consommation résidentielle par quartier, {communeName},{" "}
                        {year}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Quartier</th>
                          <th scope="col">Logements</th>
                          <th scope="col">Consommation</th>
                          <th scope="col">Par logement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((iris) => (
                          <tr key={iris.code}>
                            <th scope="row">{iris.name}</th>
                            <td>{formatInteger(iris.housing)}</td>
                            <td>{formatEnergy(iris.mwh)}</td>
                            <td>{formatMwhPerSite(iris.perHousing)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </section>

          <p className={styles.source}>
            Source : données ouvertes Enedis, consommations annuelles agrégées
            par commune et par secteur, et par quartier (IRIS) pour le
            résidentiel. Aucune adresse individuelle n&apos;est affichée. Le
            détail par quartier ne couvre qu&apos;une partie des logements, et
            les consommations les plus faibles peuvent être masquées pour
            respecter le secret statistique.
          </p>
        </div>
      )}
    </div>
  );
};
