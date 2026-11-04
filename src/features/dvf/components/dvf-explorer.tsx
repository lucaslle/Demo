"use client";

import { House, SearchX, TriangleAlert, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapFocusTarget, Viewport } from "@/features/map/model/viewport";
import { PlaceSearch } from "@/features/places/components/place-search";
import type { Place } from "@/features/places/model/place";
import { useUserLocation } from "@/features/route/hooks/use-user-location";
import { describeApiError } from "@/shared/api/describe-api-error";
import { ChipGroup } from "@/shared/components/chip-group";
import { StatusMessage } from "@/shared/components/status-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { formatInteger } from "@/shared/lib/format";
import styles from "@/features/map/components/explorer-layout.module.css";
import { useDvfUrlState } from "../hooks/use-dvf-url-state";
import { useSales } from "../hooks/use-sales";
import { selectDisplayedSales } from "../model/displayed-sales";
import {
  MIN_ZOOM_FOR_SALES,
  PERIOD_LABELS,
  PERIOD_YEARS,
  PROPERTY_FILTER_LABELS,
  PROPERTY_FILTERS,
  type PeriodYears,
  type PropertyFilter,
} from "../model/sale";
import { getPriceTier, summarizePricePerSqm } from "../model/sale-stats";
import { DvfMap } from "./dvf-map";
import { PriceStatsCard } from "./price-stats-card";
import { SaleCard } from "./sale-card";
import { SaleList } from "./sale-list";

const VIEWPORT_DEBOUNCE_IN_MS = 500;
const MAX_LISTED_SALES = 100;
const ADDRESS_ZOOM = 17;
const AREA_ZOOM = 16;

const PROPERTY_OPTIONS = PROPERTY_FILTERS.map((filter) => ({
  value: filter,
  label: PROPERTY_FILTER_LABELS[filter],
}));

const PERIOD_OPTIONS = PERIOD_YEARS.map((years) => ({
  value: String(years),
  label: PERIOD_LABELS[years],
}));

export const DvfExplorer = () => {
  const { initialState, writeState } = useDvfUrlState();
  const [property, setProperty] = useState<PropertyFilter>(
    initialState.property,
  );
  const [years, setYears] = useState<PeriodYears>(initialState.years);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const userLocation = useUserLocation();
  const debouncedViewport = useDebouncedValue(
    viewport,
    VIEWPORT_DEBOUNCE_IN_MS,
  );

  const { salesQuery, isZoomSufficient } = useSales({
    center: debouncedViewport?.center ?? null,
    zoom: debouncedViewport?.zoom ?? null,
    property,
    years,
  });

  const sales = salesQuery.data?.sales;
  const displayedSales = useMemo(
    () => selectDisplayedSales(sales ?? [], debouncedViewport?.bounds ?? null),
    [sales, debouncedViewport],
  );
  const stats = useMemo(
    () => summarizePricePerSqm(displayedSales),
    [displayedSales],
  );
  const median = stats?.median ?? null;
  const tieredSales = useMemo(
    () =>
      displayedSales.map((sale) => ({
        sale,
        tier: getPriceTier(sale.pricePerSqm, median),
      })),
    [displayedSales, median],
  );

  useEffect(() => {
    if (debouncedViewport === null) {
      return;
    }
    writeState({
      view: {
        lat: debouncedViewport.center.lat,
        lng: debouncedViewport.center.lng,
        zoom: debouncedViewport.zoom,
      },
      property,
      years,
    });
  }, [debouncedViewport, property, years, writeState]);

  const selectedSale =
    selectedSaleId === null
      ? undefined
      : displayedSales.find(({ id }) => id === selectedSaleId);

  const handlePlaceSelect = (place: Place) => {
    setSelectedSaleId(null);
    setFocusTarget({
      lat: place.position.lat,
      lng: place.position.lng,
      zoom: place.kind === "address" ? ADDRESS_ZOOM : AREA_ZOOM,
    });
  };

  const handlePropertyChange = (nextProperty: PropertyFilter) => {
    setProperty(nextProperty);
    setSelectedSaleId(null);
  };

  const handleYearsChange = (nextYears: string) => {
    const parsed = PERIOD_YEARS.find((value) => String(value) === nextYears);
    if (parsed !== undefined) {
      setYears(parsed);
      setSelectedSaleId(null);
    }
  };

  const handleDeselectSale = useCallback((saleId: string) => {
    setSelectedSaleId((current) => (current === saleId ? null : current));
  }, []);

  const isLoading =
    isZoomSufficient && salesQuery.isPending && debouncedViewport !== null;
  const hasError =
    isZoomSufficient && salesQuery.isError && salesQuery.data === undefined;
  const isTruncated = salesQuery.data?.isTruncated ?? false;

  const liveSummary = describeResults({
    isZoomSufficient,
    isLoading,
    hasError,
    count: displayedSales.length,
  });

  return (
    <div className={styles.layout}>
      <div className={styles.top}>
        <h1 className={styles.title}>Ventes immobilières</h1>
        <PlaceSearch
          label="Rechercher une adresse"
          placeholder="Ex. 8 rue du port, Bordeaux"
          scope="any"
          onSelect={handlePlaceSelect}
        />
        <ChipGroup
          legend="Type de bien"
          options={PROPERTY_OPTIONS}
          value={property}
          onChange={handlePropertyChange}
          layout="wrap"
        />
        <ChipGroup
          legend="Période"
          options={PERIOD_OPTIONS}
          value={String(years)}
          onChange={handleYearsChange}
          layout="wrap"
        />
        {selectedSale !== undefined ? (
          <SaleCard
            sale={selectedSale}
            onClose={() => setSelectedSaleId(null)}
          />
        ) : (
          stats !== null &&
          !hasError && (
            <PriceStatsCard stats={stats} saleCount={displayedSales.length} />
          )
        )}
        <p className={styles.summary} role="status" aria-live="polite">
          {liveSummary}
        </p>
        <a className={styles.skipToList} href="#liste-ventes">
          Aller à la liste des ventes
        </a>
      </div>

      <div className={styles.map}>
        <DvfMap
          initialView={initialState.view}
          sales={tieredSales}
          selectedSaleId={selectedSaleId}
          focusTarget={focusTarget}
          userPosition={userLocation.position}
          locationStatus={userLocation.status}
          onSelectSale={setSelectedSaleId}
          onDeselectSale={handleDeselectSale}
          onViewportChange={setViewport}
          onLocate={userLocation.locate}
        />
      </div>

      <section
        id="liste-ventes"
        className={styles.list}
        aria-labelledby="titre-liste-ventes"
      >
        <h2 id="titre-liste-ventes" className={styles.listTitle}>
          Ventes dans la zone
          <span className={styles.listTag}>{PERIOD_LABELS[years]}</span>
        </h2>

        {isTruncated && !hasError && (
          <p className={styles.truncatedNotice}>
            Zone très dense : {formatInteger(sales?.length ?? 0)} ventes sur{" "}
            {formatInteger(salesQuery.data?.totalCount ?? 0)} sont chargées.
            Zoomez pour afficher les autres.
          </p>
        )}

        {!isZoomSufficient ? (
          <StatusMessage
            variant="info"
            icon={ZoomIn}
            title="Zoomez sur la carte"
          >
            Les ventes s&apos;affichent à partir du niveau de zoom{" "}
            {MIN_ZOOM_FOR_SALES}. Cherchez une adresse pour vous y rendre
            directement.
          </StatusMessage>
        ) : hasError ? (
          <StatusMessage
            variant="error"
            icon={TriangleAlert}
            title="Impossible de charger les ventes"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  void salesQuery.refetch();
                }}
              >
                Réessayer
              </button>
            }
          >
            {describeApiError(salesQuery.error)}
          </StatusMessage>
        ) : isLoading ? (
          <StatusMessage variant="info" icon={House} title="Chargement…" />
        ) : displayedSales.length === 0 ? (
          <StatusMessage
            variant="empty"
            icon={SearchX}
            title="Aucune vente dans cette zone"
          >
            Essayez une période plus longue, un autre type de bien ou déplacez
            la carte.
          </StatusMessage>
        ) : (
          <SaleList
            sales={displayedSales.slice(0, MAX_LISTED_SALES)}
            median={median}
            selectedSaleId={selectedSaleId}
            onSelectSale={setSelectedSaleId}
          />
        )}
      </section>
    </div>
  );
};

type ResultsDescription = {
  isZoomSufficient: boolean;
  isLoading: boolean;
  hasError: boolean;
  count: number;
};

const describeResults = ({
  isZoomSufficient,
  isLoading,
  hasError,
  count,
}: ResultsDescription): string => {
  if (!isZoomSufficient) {
    return "Zoomez sur la carte pour afficher les ventes.";
  }
  if (hasError) {
    return "";
  }
  if (isLoading) {
    return "Chargement des ventes…";
  }
  if (count === 0) {
    return "Aucune vente dans cette zone.";
  }
  return count === 1 ? "1 vente affichée." : `${count} ventes affichées.`;
};
