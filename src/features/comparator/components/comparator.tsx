"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDepartmentPrices } from "@/features/fuel/hooks/use-department-prices";
import { FuelChips } from "@/features/fuel/components/fuel-chips";
import { FUEL_LABELS } from "@/features/fuel/model/fuel-types";
import { useObservedTariffs } from "@/features/irve/hooks/use-observed-tariffs";
import { NumberField } from "@/shared/components/number-field";
import {
  formatEuros,
  formatPrice,
  formatRelativeTime,
} from "@/shared/lib/format";
import { describeComparison } from "../model/comparison-summary";
import {
  breakEvenPricePerKwh,
  buildScenarios,
  costPer100Km,
} from "../model/cost";
import {
  DEFAULT_HOME_PRICE_PER_KWH,
  FALLBACK_FAST_PRICE_PER_KWH,
  FALLBACK_FUEL_PRICE_PER_LITER,
  FALLBACK_NORMAL_PRICE_PER_KWH,
  LIMITS,
} from "../model/defaults";
import { useComparatorStore } from "../stores/comparator-store";
import styles from "./comparator.module.css";

const kmFormatter = new Intl.NumberFormat("fr-FR");

export const Comparator = () => {
  const settings = useComparatorStore();
  const { update, reset } = settings;
  const [resetCount, setResetCount] = useState(0);
  const departmentPrices = useDepartmentPrices();
  const observedTariffs = useObservedTariffs();

  const arePricesLoading =
    departmentPrices.isPending || observedTariffs.isPending;

  const observedNormal = observedTariffs.data?.normal ?? null;
  const observedFast = observedTariffs.data?.fast ?? null;
  const nationalFuelPrice =
    departmentPrices.data?.nationalAverages[settings.fuel] ?? null;

  const fuelPrice =
    settings.fuelPriceOverride ??
    nationalFuelPrice ??
    FALLBACK_FUEL_PRICE_PER_LITER;
  const homePrice = settings.homePriceOverride ?? DEFAULT_HOME_PRICE_PER_KWH;
  const normalPrice =
    settings.normalPriceOverride ??
    observedNormal?.medianPerKwh ??
    FALLBACK_NORMAL_PRICE_PER_KWH;
  const fastPrice =
    settings.fastPriceOverride ??
    observedFast?.medianPerKwh ??
    FALLBACK_FAST_PRICE_PER_KWH;

  const scenarios = buildScenarios({
    fuelLabel: FUEL_LABELS[settings.fuel],
    fuelPricePerLiter: fuelPrice,
    litersPer100Km: settings.litersPer100Km,
    kwhPer100Km: settings.kwhPer100Km,
    annualKm: settings.annualKm,
    homePricePerKwh: homePrice,
    normalPricePerKwh: normalPrice,
    fastPricePerKwh: fastPrice,
  });
  const highestCost = Math.max(...scenarios.map((s) => s.costPer100Km));
  const breakEven = breakEvenPricePerKwh(
    costPer100Km(fuelPrice, settings.litersPer100Km),
    settings.kwhPer100Km,
  );

  const handleReset = () => {
    reset();
    setResetCount((count) => count + 1);
  };

  // Les champs de prix prennent leur valeur initiale au premier affichage : on
  // attend donc les données avant de les montrer.
  const fieldsKey = `${resetCount}-${settings.fuel}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Carburant ou électrique ?</h1>
        <p className={styles.lead}>
          Comparez ce que coûte un trajet selon le carburant, la recharge à
          domicile ou les bornes publiques. Les prix viennent des données
          ouvertes ; vos hypothèses sont modifiables.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="titre-hypotheses">
          <h2 id="titre-hypotheses" className={styles.cardTitle}>
            Vos hypothèses
          </h2>

          <FuelChips
            value={settings.fuel}
            onChange={(fuel) => update({ fuel, fuelPriceOverride: null })}
          />

          {arePricesLoading ? (
            <p className={styles.loading} role="status">
              Chargement des prix en direct…
            </p>
          ) : (
            <div className={styles.fields} key={fieldsKey}>
              <NumberField
                label="Consommation thermique"
                unit="L/100 km"
                value={settings.litersPer100Km}
                min={LIMITS.litersPer100Km.min}
                max={LIMITS.litersPer100Km.max}
                onChange={(litersPer100Km) => update({ litersPer100Km })}
              />
              <NumberField
                label="Consommation électrique"
                unit="kWh/100 km"
                value={settings.kwhPer100Km}
                min={LIMITS.kwhPer100Km.min}
                max={LIMITS.kwhPer100Km.max}
                hint="Pertes de charge comprises (environ 15 à 20 pour une citadine)."
                onChange={(kwhPer100Km) => update({ kwhPer100Km })}
              />
              <NumberField
                label="Distance par an"
                unit="km"
                value={settings.annualKm}
                min={LIMITS.annualKm.min}
                max={LIMITS.annualKm.max}
                onChange={(annualKm) => update({ annualKm })}
              />
              <NumberField
                label={`Prix du ${FUEL_LABELS[settings.fuel]}`}
                unit="€/L"
                value={Number(fuelPrice.toFixed(3))}
                min={LIMITS.fuelPricePerLiter.min}
                max={LIMITS.fuelPricePerLiter.max}
                hint={
                  nationalFuelPrice === null
                    ? "Valeur indicative : moyenne nationale indisponible."
                    : "Moyenne nationale du jour, modifiable."
                }
                onChange={(price) => update({ fuelPriceOverride: price })}
              />
              <NumberField
                label="Électricité à domicile"
                unit="€/kWh"
                value={homePrice}
                min={LIMITS.pricePerKwh.min}
                max={LIMITS.pricePerKwh.max}
                hint="Hypothèse : dépend de votre contrat."
                onChange={(price) => update({ homePriceOverride: price })}
              />
              <NumberField
                label="Borne publique normale"
                unit="€/kWh"
                value={Number(normalPrice.toFixed(3))}
                min={LIMITS.pricePerKwh.min}
                max={LIMITS.pricePerKwh.max}
                hint={
                  observedNormal === null
                    ? "Valeur indicative."
                    : "Médiane des tarifs affichés, modifiable."
                }
                onChange={(price) => update({ normalPriceOverride: price })}
              />
              <NumberField
                label="Borne publique rapide"
                unit="€/kWh"
                value={Number(fastPrice.toFixed(3))}
                min={LIMITS.pricePerKwh.min}
                max={LIMITS.pricePerKwh.max}
                hint={
                  observedFast === null
                    ? "Valeur indicative."
                    : "Médiane des tarifs affichés, modifiable."
                }
                onChange={(price) => update({ fastPriceOverride: price })}
              />
            </div>
          )}

          <button
            type="button"
            className="button button--secondary"
            onClick={handleReset}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Réinitialiser
          </button>
        </section>

        <section className={styles.card} aria-labelledby="titre-resultats">
          <h2 id="titre-resultats" className={styles.cardTitle}>
            Ce que ça coûte
          </h2>
          <p className={styles.headline} role="status">
            {describeComparison(scenarios, settings.annualKm)}
          </p>

          <ul className={styles.scenarios}>
            {scenarios.map((scenario) => (
              <li
                key={scenario.id}
                className={styles.scenario}
                data-cheapest={scenario.isCheapest || undefined}
                data-kind={scenario.id === "fuel" ? "fuel" : "electric"}
              >
                <div className={styles.scenarioHead}>
                  <span className={styles.scenarioName}>
                    {scenario.label}
                    {scenario.isCheapest && (
                      <span className={styles.badge}>Le moins cher</span>
                    )}
                  </span>
                  <span className={styles.cost}>
                    {formatEuros(scenario.costPer100Km)}
                    <span className={styles.per}> /100 km</span>
                  </span>
                </div>
                <div className={styles.bar} aria-hidden="true">
                  <span
                    style={{
                      width: `${(scenario.costPer100Km / highestCost) * 100}%`,
                    }}
                  />
                </div>
                <p className={styles.detail}>
                  {formatEuros(scenario.annualCost)} par an · à{" "}
                  {formatPrice(scenario.unitPrice).replace(" €", "")}{" "}
                  {scenario.unit}
                  {scenario.id !== "fuel" &&
                    (scenario.annualSavingsVsFuel >= 0
                      ? ` · ${formatEuros(scenario.annualSavingsVsFuel)} d'économie par an`
                      : ` · ${formatEuros(Math.abs(scenario.annualSavingsVsFuel))} de plus par an`)}
                </p>
              </li>
            ))}
          </ul>

          {breakEven !== null && (
            <p className={styles.breakEven}>
              <strong>Seuil de rentabilité :</strong> à {formatPrice(breakEven)}
              /kWh, recharger coûte autant que le carburant.
            </p>
          )}

          <div className={styles.sources}>
            <h3 className={styles.sourcesTitle}>
              D&apos;où viennent les prix ?
            </h3>
            <ul>
              <li>
                {nationalFuelPrice !== null && departmentPrices.data ? (
                  <>
                    Carburant : moyenne nationale du{" "}
                    {FUEL_LABELS[settings.fuel]} (
                    {formatPrice(nationalFuelPrice)}
                    /L sur{" "}
                    {kmFormatter.format(
                      departmentPrices.data.totalStations,
                    )}{" "}
                    stations
                    {departmentPrices.data.lastUpdatedAt !== null
                      ? `, mise à jour ${formatRelativeTime(departmentPrices.data.lastUpdatedAt, new Date(departmentPrices.dataUpdatedAt))}`
                      : ""}
                    ).
                  </>
                ) : (
                  "Carburant : valeur indicative, moyenne nationale indisponible."
                )}
              </li>
              <li>
                {observedNormal !== null && observedFast !== null
                  ? `Bornes : médiane des tarifs affichés par les opérateurs dans la base nationale des bornes (${kmFormatter.format(observedNormal.sampleSize)} points en charge normale, ${kmFormatter.format(observedFast.sampleSize)} en charge rapide).`
                  : "Bornes : valeurs indicatives, tarifs affichés indisponibles."}
              </li>
              <li>Domicile : hypothèse, à adapter à votre contrat.</li>
            </ul>
            <p className={styles.disclaimer}>
              Calcul indicatif : hors achat du véhicule, entretien, assurance et
              abonnements des opérateurs.
            </p>
          </div>

          <div className={styles.links}>
            <Link className="button button--primary" href="/carburants/">
              Stations proches
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button button--secondary" href="/recharge/">
              Bornes proches
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
