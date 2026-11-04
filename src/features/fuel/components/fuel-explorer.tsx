"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { describeApiError } from "@/shared/api/describe-api-error";
import { StatusMessage } from "@/shared/components/status-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { formatPrice } from "@/shared/lib/format";
import { useFuelUrlState } from "../hooks/use-fuel-url-state";
import {
  MIN_ZOOM_FOR_STATIONS,
  useStationsInViewport,
} from "../hooks/use-stations-in-viewport";
import { buildDisplayedStations } from "../model/displayed-station";
import { FUEL_LABELS, type FuelType } from "../model/fuel-types";
import type { Viewport } from "../model/viewport";
import styles from "./fuel-explorer.module.css";
import { FuelSelect } from "./fuel-select";
import { StationList } from "./station-list";
import { StationMap } from "./station-map";

const VIEWPORT_DEBOUNCE_IN_MS = 300;

export const FuelExplorer = () => {
  const { initialState, writeState } = useFuelUrlState();
  const [fuel, setFuel] = useState<FuelType>(initialState.fuel);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );
  const debouncedViewport = useDebouncedValue(
    viewport,
    VIEWPORT_DEBOUNCE_IN_MS,
  );

  const { stationsQuery, isZoomSufficient } = useStationsInViewport({
    viewport: debouncedViewport,
    fuel,
  });

  const stations = stationsQuery.data?.stations;
  const displayedStations = useMemo(
    () =>
      buildDisplayedStations(
        stations ?? [],
        fuel,
        debouncedViewport?.bounds ?? null,
      ),
    [stations, fuel, debouncedViewport],
  );
  const now = useMemo(
    () => new Date(stationsQuery.dataUpdatedAt),
    [stationsQuery.dataUpdatedAt],
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
      fuel,
    });
  }, [debouncedViewport, fuel, writeState]);

  const handleFuelChange = (nextFuel: FuelType) => {
    setFuel(nextFuel);
    setSelectedStationId(null);
  };

  const handleDeselectStation = useCallback((stationId: number) => {
    setSelectedStationId((current) => (current === stationId ? null : current));
  }, []);

  const isLoading = isZoomSufficient && stationsQuery.isPending;
  const hasError = isZoomSufficient && stationsQuery.isError;
  const totalCount = stationsQuery.data?.totalCount ?? 0;
  const isTruncated = stationsQuery.data?.isTruncated ?? false;
  const cheapestStation = displayedStations[0];

  const summary = describeResults({
    isZoomSufficient,
    isLoading,
    hasError,
    isRefreshing: stationsQuery.isFetching,
    displayedCount: displayedStations.length,
    cheapestLabel:
      cheapestStation === undefined
        ? null
        : `${formatPrice(cheapestStation.price.amount)}, ${cheapestStation.station.address}, ${cheapestStation.station.city}`,
  });

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <FuelSelect value={fuel} onChange={handleFuelChange} />
        <a className={styles.skipToList} href="#liste-stations">
          Aller à la liste des stations
        </a>
      </div>

      <p className={styles.summary} role="status" aria-live="polite">
        {summary}
      </p>

      <div className={styles.layout}>
        <StationMap
          initialView={initialState.view}
          displayedStations={displayedStations}
          fuel={fuel}
          now={now}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          onDeselectStation={handleDeselectStation}
          onViewportChange={setViewport}
        />

        <section
          id="liste-stations"
          className={styles.listPanel}
          aria-labelledby="titre-liste-stations"
        >
          <h2 id="titre-liste-stations" className={styles.listTitle}>
            Stations dans la zone ({FUEL_LABELS[fuel]})
          </h2>

          {isTruncated && !hasError && (
            <p className={styles.truncatedNotice}>
              {totalCount} stations dans la zone chargée : seules les moins
              chères sont affichées. Zoomez pour affiner.
            </p>
          )}

          {!isZoomSufficient ? (
            <StatusMessage variant="info" title="Zoomez sur la carte">
              Les prix s&apos;affichent à partir du niveau de zoom{" "}
              {MIN_ZOOM_FOR_STATIONS}.
            </StatusMessage>
          ) : hasError ? (
            <StatusMessage
              variant="error"
              title="Impossible de charger les prix"
              action={
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    void stationsQuery.refetch();
                  }}
                >
                  Réessayer
                </button>
              }
            >
              {describeApiError(stationsQuery.error)}
            </StatusMessage>
          ) : isLoading ? (
            <StatusMessage variant="info" title="Chargement des stations…" />
          ) : displayedStations.length === 0 ? (
            <StatusMessage
              variant="empty"
              title="Aucune station dans cette zone"
            >
              Aucune station ne propose {FUEL_LABELS[fuel]} ici. Déplacez la
              carte ou choisissez un autre carburant.
            </StatusMessage>
          ) : (
            <StationList
              displayedStations={displayedStations}
              selectedStationId={selectedStationId}
              now={now}
              onSelectStation={setSelectedStationId}
            />
          )}
        </section>
      </div>
    </div>
  );
};

type ResultsDescription = {
  isZoomSufficient: boolean;
  isLoading: boolean;
  hasError: boolean;
  isRefreshing: boolean;
  displayedCount: number;
  cheapestLabel: string | null;
};

const describeResults = ({
  isZoomSufficient,
  isLoading,
  hasError,
  isRefreshing,
  displayedCount,
  cheapestLabel,
}: ResultsDescription): string => {
  if (!isZoomSufficient) {
    return "Zoomez sur la carte pour afficher les stations.";
  }
  if (hasError) {
    return "";
  }
  if (isLoading || (isRefreshing && displayedCount === 0)) {
    return "Chargement des stations…";
  }
  if (displayedCount === 0 || cheapestLabel === null) {
    return "Aucune station dans cette zone pour ce carburant.";
  }

  const countLabel =
    displayedCount === 1
      ? "1 station affichée"
      : `${displayedCount} stations affichées`;
  return `${countLabel}. La moins chère : ${cheapestLabel}.`;
};
