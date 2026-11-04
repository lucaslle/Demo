"use client";

import { SearchX, TriangleAlert, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Viewport } from "@/features/map/model/viewport";
import { useRouteState } from "@/features/route/hooks/use-route-state";
import { useUserLocation } from "@/features/route/hooks/use-user-location";
import { describeApiError } from "@/shared/api/describe-api-error";
import { ChipGroup } from "@/shared/components/chip-group";
import { StatusMessage } from "@/shared/components/status-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import styles from "@/features/map/components/explorer-layout.module.css";
import { useChargingStationsInViewport } from "../hooks/use-charging-stations-in-viewport";
import { MIN_ZOOM_FOR_CHARGING } from "../hooks/use-charging-stations-in-viewport";
import { useChargingUrlState } from "../hooks/use-charging-url-state";
import {
  buildDisplayedChargingStations,
  summarizeChargingStations,
} from "../model/displayed-charging";
import {
  formatPower,
  POWER_FILTER_LABELS,
  POWER_FILTERS,
  type PowerFilter,
} from "../model/power";
import { ChargingCard } from "./charging-card";
import { ChargingList } from "./charging-list";
import { ChargingMap } from "./charging-map";
import { StrongestChargerCard } from "./strongest-charger-card";

const VIEWPORT_DEBOUNCE_IN_MS = 300;

const POWER_OPTIONS = POWER_FILTERS.map((filter) => ({
  value: filter,
  label: POWER_FILTER_LABELS[filter],
}));

export const ChargingExplorer = () => {
  const { initialState, writeState } = useChargingUrlState();
  const [powerFilter, setPowerFilter] = useState<PowerFilter>(
    initialState.powerFilter,
  );
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );
  const userLocation = useUserLocation();
  const debouncedViewport = useDebouncedValue(
    viewport,
    VIEWPORT_DEBOUNCE_IN_MS,
  );

  const { chargingQuery, isZoomSufficient } = useChargingStationsInViewport({
    viewport: debouncedViewport,
    powerFilter,
  });

  const stations = chargingQuery.data?.stations;
  const displayedStations = useMemo(
    () =>
      buildDisplayedChargingStations(
        stations ?? [],
        debouncedViewport?.bounds ?? null,
      ),
    [stations, debouncedViewport],
  );
  const summary = useMemo(
    () => summarizeChargingStations(displayedStations),
    [displayedStations],
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
      powerFilter,
    });
  }, [debouncedViewport, powerFilter, writeState]);

  const selectedStation =
    selectedStationId === null
      ? undefined
      : stations?.find(({ id }) => id === selectedStationId);

  // Choisir une borne déclenche la demande de position, une seule fois.
  const { status: locationStatus, locate } = userLocation;
  useEffect(() => {
    if (selectedStationId !== null && locationStatus === "idle") {
      locate();
    }
  }, [selectedStationId, locationStatus, locate]);

  const routeState = useRouteState({
    origin: userLocation.position,
    locationStatus,
    destination: selectedStation?.position ?? null,
  });

  const handlePowerFilterChange = (nextFilter: PowerFilter) => {
    setPowerFilter(nextFilter);
    setSelectedStationId(null);
  };

  const handleDeselectStation = useCallback((stationId: string) => {
    setSelectedStationId((current) => (current === stationId ? null : current));
  }, []);

  const isLoading = isZoomSufficient && chargingQuery.isPending;
  const hasError = isZoomSufficient && chargingQuery.isError;
  const isTruncated = chargingQuery.data?.isTruncated ?? false;

  const liveSummary = describeResults({
    isZoomSufficient,
    isLoading,
    hasError,
    isRefreshing: chargingQuery.isFetching,
    displayedCount: displayedStations.length,
    strongestLabel:
      summary === null
        ? null
        : `${formatPower(summary.strongest.maxPowerKw)}, ${summary.strongest.name}`,
  });

  return (
    <div className={styles.layout}>
      <div className={styles.top}>
        <h1 className={styles.title}>Bornes de recharge</h1>
        <ChipGroup
          legend="Puissance"
          options={POWER_OPTIONS}
          value={powerFilter}
          onChange={handlePowerFilterChange}
        />
        {selectedStation !== undefined ? (
          <ChargingCard
            station={selectedStation}
            routeState={routeState}
            onRetryLocate={userLocation.locate}
            onClose={() => setSelectedStationId(null)}
          />
        ) : (
          summary !== null &&
          !hasError && (
            <StrongestChargerCard
              summary={summary}
              onShowOnMap={setSelectedStationId}
            />
          )
        )}
        <p className={styles.summary} role="status" aria-live="polite">
          {liveSummary}
        </p>
        <a className={styles.skipToList} href="#liste-bornes">
          Aller à la liste des bornes
        </a>
      </div>

      <div className={styles.map}>
        <ChargingMap
          initialView={initialState.view}
          stations={displayedStations}
          selectedStationId={selectedStationId}
          userPosition={userLocation.position}
          locationStatus={locationStatus}
          routeState={routeState}
          onSelectStation={setSelectedStationId}
          onDeselectStation={handleDeselectStation}
          onViewportChange={setViewport}
          onLocate={userLocation.locate}
        />
      </div>

      <section
        id="liste-bornes"
        className={styles.list}
        aria-labelledby="titre-liste-bornes"
      >
        <h2 id="titre-liste-bornes" className={styles.listTitle}>
          Bornes dans la zone
          <span className={styles.listTag}>
            {POWER_FILTER_LABELS[powerFilter]}
          </span>
        </h2>

        {isTruncated && !hasError && (
          <p className={styles.truncatedNotice}>
            Zone très dense : seules les bornes les plus puissantes sont
            affichées. Zoomez pour affiner.
          </p>
        )}

        {!isZoomSufficient ? (
          <StatusMessage
            variant="info"
            icon={ZoomIn}
            title="Zoomez sur la carte"
          >
            Les bornes s&apos;affichent à partir du niveau de zoom{" "}
            {MIN_ZOOM_FOR_CHARGING}.
          </StatusMessage>
        ) : hasError ? (
          <StatusMessage
            variant="error"
            icon={TriangleAlert}
            title="Impossible de charger les bornes"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  void chargingQuery.refetch();
                }}
              >
                Réessayer
              </button>
            }
          >
            {describeApiError(chargingQuery.error)}
          </StatusMessage>
        ) : isLoading ? (
          <StatusMessage variant="info" icon={ZoomIn} title="Chargement…" />
        ) : displayedStations.length === 0 ? (
          <StatusMessage
            variant="empty"
            icon={SearchX}
            title="Aucune borne dans cette zone"
          >
            Déplacez la carte ou choisissez un autre niveau de puissance.
          </StatusMessage>
        ) : (
          <ChargingList
            stations={displayedStations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
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
  isRefreshing: boolean;
  displayedCount: number;
  strongestLabel: string | null;
};

const describeResults = ({
  isZoomSufficient,
  isLoading,
  hasError,
  isRefreshing,
  displayedCount,
  strongestLabel,
}: ResultsDescription): string => {
  if (!isZoomSufficient) {
    return "Zoomez sur la carte pour afficher les bornes.";
  }
  if (hasError) {
    return "";
  }
  if (isLoading || (isRefreshing && displayedCount === 0)) {
    return "Chargement des bornes…";
  }
  if (displayedCount === 0 || strongestLabel === null) {
    return "Aucune borne dans cette zone.";
  }

  const countLabel =
    displayedCount === 1
      ? "1 borne affichée"
      : `${displayedCount} bornes affichées`;
  return `${countLabel}. La plus puissante : ${strongestLabel}.`;
};
