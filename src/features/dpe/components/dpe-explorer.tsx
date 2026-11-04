"use client";

import { Gauge, SearchX, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PlaceSearch } from "@/features/places/components/place-search";
import { useCommune } from "@/features/places/hooks/use-places";
import { describeApiError } from "@/shared/api/describe-api-error";
import { ChipGroup } from "@/shared/components/chip-group";
import { StatusMessage } from "@/shared/components/status-message";
import { formatInteger } from "@/shared/lib/format";
import { useDpeSummary, useDpeUrlState } from "../hooks/use-dpe";
import {
  BEST_LABELS,
  computeShare,
  formatShare,
  getReadableTextColor,
  KIND_LABELS,
  KINDS,
  LABEL_COLORS,
  PARC_LABELS,
  PARCS,
  THERMAL_SIEVE_LABELS,
  type DpeSummary,
  type Kind,
  type Parc,
} from "../model/dpe";
import { DistributionBars } from "./distribution-bars";
import styles from "./dpe-explorer.module.css";

const PARC_OPTIONS = PARCS.map((parc) => ({
  value: parc,
  label: PARC_LABELS[parc],
}));

const KIND_OPTIONS = KINDS.map((kind) => ({
  value: kind,
  label: KIND_LABELS[kind],
}));

const EXAMPLE_COMMUNES = [
  { code: "33063", name: "Bordeaux" },
  { code: "59350", name: "Lille" },
  { code: "13055", name: "Marseille" },
  { code: "69123", name: "Lyon" },
  { code: "2A004", name: "Ajaccio" },
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "UTC",
});

const formatDay = (isoDay: string | null): string => {
  if (isoDay === null) {
    return "date inconnue";
  }
  const date = new Date(`${isoDay}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "date inconnue"
    : dateFormatter.format(date);
};

const describeSummary = (
  summary: DpeSummary,
  communeName: string,
  parc: Parc,
  kind: Kind,
): string => {
  const sieves = computeShare(summary.counts, THERMAL_SIEVE_LABELS);
  const best = computeShare(summary.counts, BEST_LABELS);
  return `${communeName}, ${PARC_LABELS[parc].toLowerCase()} : ${formatInteger(summary.total)} diagnostics, étiquette ${KIND_LABELS[kind]}. ${formatShare(best)} classés A ou B, ${formatShare(sieves)} classés F ou G.`;
};

export const DpeExplorer = () => {
  const { initialState, writeState } = useDpeUrlState();
  const [communeCode, setCommuneCode] = useState(initialState.communeCode);
  const [parc, setParc] = useState<Parc>(initialState.parc);
  const [kind, setKind] = useState<Kind>(initialState.kind);

  const communeQuery = useCommune(communeCode);
  const summaryQuery = useDpeSummary(communeCode, parc, kind);

  useEffect(() => {
    writeState({ communeCode, parc, kind });
  }, [communeCode, parc, kind, writeState]);

  const communeName = communeQuery.data?.name ?? communeCode ?? "";
  const summary = summaryQuery.data;
  const labelItems = useMemo(
    () =>
      (summary?.counts ?? []).map(({ label, count }) => ({
        key: label,
        label,
        count,
        color: {
          background: LABEL_COLORS[label],
          text: getReadableTextColor(LABEL_COLORS[label]),
        },
      })),
    [summary],
  );
  const periodItems = useMemo(
    () =>
      (summary?.periods ?? []).map(({ period, count }) => ({
        key: period,
        label: period,
        count,
      })),
    [summary],
  );

  const sieveShare = summary
    ? computeShare(summary.counts, THERMAL_SIEVE_LABELS)
    : null;
  const bestShare = summary ? computeShare(summary.counts, BEST_LABELS) : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Diagnostics énergétiques</h1>
        <p className={styles.lead}>
          Étiquettes énergie et climat des logements et des bâtiments tertiaires
          d&apos;une commune, d&apos;après la base des diagnostics de
          performance énergétique de l&apos;ADEME.
        </p>
      </header>

      <section className={styles.controls} aria-label="Choix des données">
        <PlaceSearch
          key={communeQuery.data?.name ?? "aucune"}
          label="Commune"
          placeholder="Ex. Bordeaux, Lille, Ajaccio…"
          scope="municipality"
          initialQuery={communeQuery.data?.name ?? ""}
          onSelect={(place) => {
            if (place.citycode !== null) {
              setCommuneCode(place.citycode);
            }
          }}
        />
        <ChipGroup
          legend="Parc"
          options={PARC_OPTIONS}
          value={parc}
          onChange={setParc}
          layout="wrap"
        />
        <ChipGroup
          legend="Étiquette"
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
          layout="wrap"
        />
      </section>

      {communeCode === null ? (
        <StatusMessage
          variant="info"
          icon={Gauge}
          title="Choisissez une commune"
          action={
            <div className={styles.examples}>
              {EXAMPLE_COMMUNES.map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  className="button button--secondary"
                  onClick={() => setCommuneCode(code)}
                >
                  {name}
                </button>
              ))}
            </div>
          }
        >
          Cherchez une commune ci-dessus, ou essayez un exemple.
        </StatusMessage>
      ) : summaryQuery.isError && summary === undefined ? (
        <StatusMessage
          variant="error"
          icon={TriangleAlert}
          title="Impossible de charger les diagnostics"
          action={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                void summaryQuery.refetch();
              }}
            >
              Réessayer
            </button>
          }
        >
          {describeApiError(summaryQuery.error)}
        </StatusMessage>
      ) : summaryQuery.isPending || summary === undefined ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : summary.total === 0 ? (
        <StatusMessage
          variant="empty"
          icon={SearchX}
          title="Aucun diagnostic pour cette sélection"
        >
          {communeName} n&apos;a aucun diagnostic enregistré pour ce parc.
          Essayez l&apos;autre parc ou une autre commune.
        </StatusMessage>
      ) : (
        <div
          className={styles.results}
          data-refreshing={summaryQuery.isPlaceholderData || undefined}
        >
          <dl className={styles.kpis}>
            <div className={styles.kpi}>
              <dt>Diagnostics</dt>
              <dd className={styles.kpiValue}>
                {formatInteger(summary.total)}
              </dd>
              <p className={styles.kpiHint}>
                {PARC_LABELS[parc].toLowerCase()} · {communeName}
              </p>
            </div>
            <div className={styles.kpi}>
              <dt>Classés F ou G</dt>
              <dd className={styles.kpiValue}>{formatShare(sieveShare)}</dd>
              <p className={styles.kpiHint}>
                {parc === "logements"
                  ? "« passoires thermiques »"
                  : "les plus énergivores"}
              </p>
            </div>
            <div className={styles.kpi}>
              <dt>Classés A ou B</dt>
              <dd className={styles.kpiValue}>{formatShare(bestShare)}</dd>
              <p className={styles.kpiHint}>les plus économes</p>
            </div>
            <div className={styles.kpi}>
              <dt>Consommation moyenne</dt>
              <dd className={styles.kpiValue}>
                {summary.averageConsumption === null
                  ? "—"
                  : formatInteger(summary.averageConsumption)}
              </dd>
              <p className={styles.kpiHint}>
                kWh d&apos;énergie primaire / m² / an
              </p>
            </div>
          </dl>

          <section className={styles.card} aria-labelledby="titre-etiquettes">
            <h2 id="titre-etiquettes" className={styles.cardTitle}>
              Répartition par étiquette
            </h2>
            <p className={styles.caption}>
              {KIND_LABELS[kind]} · {PARC_LABELS[parc]} · {communeName}
            </p>
            <DistributionBars
              ariaLabel="Diagnostics par étiquette, de A à G"
              items={labelItems}
              unit="diagnostics"
            />
            <p className="visually-hidden">
              {describeSummary(summary, communeName, parc, kind)}
            </p>
            <details className={styles.details}>
              <summary>Voir les données en tableau</summary>
              <div className={styles.tableWrap}>
                <table>
                  <caption className="visually-hidden">
                    Diagnostics par étiquette, {communeName}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Étiquette</th>
                      <th scope="col">Diagnostics</th>
                      <th scope="col">Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.counts.map(({ label, count }) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{formatInteger(count)}</td>
                        <td>
                          {formatShare(
                            summary.total === 0
                              ? null
                              : (count / summary.total) * 100,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          {periodItems.length > 0 && (
            <section className={styles.card} aria-labelledby="titre-periodes">
              <h2 id="titre-periodes" className={styles.cardTitle}>
                Répartition par période de construction
              </h2>
              <p className={styles.caption}>
                {PARC_LABELS[parc]} · {communeName}
              </p>
              <DistributionBars
                ariaLabel="Diagnostics par période de construction"
                items={periodItems}
                unit="diagnostics"
              />
            </section>
          )}

          <p className={styles.source}>
            Source : ADEME, diagnostics de performance énergétique (
            {parc === "logements"
              ? "logements existants depuis juillet 2021"
              : "tertiaire depuis juillet 2021"}
            ). Dernier diagnostic enregistré :{" "}
            {formatDay(summary.lastDiagnosticDate)}. Ces diagnostics sont
            établis lors d&apos;une vente, d&apos;une location ou d&apos;une
            construction : ils ne recensent pas tout le parc de la commune.
          </p>
        </div>
      )}
    </div>
  );
};
