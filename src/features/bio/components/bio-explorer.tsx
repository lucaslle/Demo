"use client";

import { Leaf, Search, SearchX, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import type { Viewport } from "@/features/map/model/viewport";
import { useRouteState } from "@/features/route/hooks/use-route-state";
import { useUserLocation } from "@/features/route/hooks/use-user-location";
import { describeApiError } from "@/shared/api/describe-api-error";
import { ChipGroup } from "@/shared/components/chip-group";
import { StatusMessage } from "@/shared/components/status-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { formatInteger } from "@/shared/lib/format";
import styles from "@/features/map/components/explorer-layout.module.css";
import { useBioUrlState } from "../hooks/use-bio-url-state";
import { useNearbyOperators } from "../hooks/use-nearby-operators";
import {
  ACTIVITY_FILTER_LABELS,
  ACTIVITY_FILTERS,
  formatDistance,
  MAX_QUERY_LENGTH,
  type ActivityFilter,
} from "../model/operator";
import { BioCard } from "./bio-card";
import searchStyles from "./bio-explorer.module.css";
import { BioList } from "./bio-list";
import { BioMap } from "./bio-map";

const VIEWPORT_DEBOUNCE_IN_MS = 500;
const QUERY_DEBOUNCE_IN_MS = 400;

const ACTIVITY_OPTIONS = ACTIVITY_FILTERS.map((filter) => ({
  value: filter,
  label: ACTIVITY_FILTER_LABELS[filter],
}));

export const BioExplorer = () => {
  const searchInputId = useId();
  const { initialState, writeState } = useBioUrlState();
  const [activity, setActivity] = useState<ActivityFilter>(
    initialState.activity,
  );
  const [queryInput, setQueryInput] = useState(initialState.query);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(
    null,
  );
  const userLocation = useUserLocation();
  const debouncedViewport = useDebouncedValue(
    viewport,
    VIEWPORT_DEBOUNCE_IN_MS,
  );
  const debouncedQuery = useDebouncedValue(queryInput, QUERY_DEBOUNCE_IN_MS);

  const operatorsQuery = useNearbyOperators({
    center: debouncedViewport?.center ?? null,
    activity,
    query: debouncedQuery,
  });

  const operators = operatorsQuery.data?.operators ?? [];
  const totalCount = operatorsQuery.data?.totalCount ?? 0;

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
      activity,
      query: debouncedQuery,
    });
  }, [debouncedViewport, activity, debouncedQuery, writeState]);

  const selectedOperator =
    selectedOperatorId === null
      ? undefined
      : operators.find(({ id }) => id === selectedOperatorId);

  // Choisir un opérateur déclenche la demande de position, une seule fois.
  const { status: locationStatus, locate } = userLocation;
  useEffect(() => {
    if (selectedOperatorId !== null && locationStatus === "idle") {
      locate();
    }
  }, [selectedOperatorId, locationStatus, locate]);

  const routeState = useRouteState({
    origin: userLocation.position,
    locationStatus,
    destination: selectedOperator?.position ?? null,
  });

  const handleActivityChange = (nextActivity: ActivityFilter) => {
    setActivity(nextActivity);
    setSelectedOperatorId(null);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQueryInput(nextQuery);
    setSelectedOperatorId(null);
  };

  const handleDeselectOperator = useCallback((operatorId: string) => {
    setSelectedOperatorId((current) =>
      current === operatorId ? null : current,
    );
  }, []);

  const isLoading = operatorsQuery.isPending && debouncedViewport !== null;
  const hasError = operatorsQuery.isError && operatorsQuery.data === undefined;
  const nearest = operators.at(0);
  const farthest = operators.at(-1);

  const liveSummary = describeResults({
    isLoading: isLoading || debouncedViewport === null,
    hasError,
    count: operators.length,
    nearestLabel:
      nearest === undefined ? null : formatDistance(nearest.distanceKm),
    farthestLabel:
      farthest === undefined ? null : formatDistance(farthest.distanceKm),
  });

  return (
    <div className={styles.layout}>
      <div className={styles.top}>
        <h1 className={styles.title}>Producteurs et commerces bio</h1>
        <div className={searchStyles.search}>
          <label htmlFor={searchInputId} className={searchStyles.label}>
            Rechercher un nom ou un produit
          </label>
          <div className={searchStyles.inputWrap}>
            <Search size={18} aria-hidden="true" />
            <input
              id={searchInputId}
              type="search"
              value={queryInput}
              maxLength={MAX_QUERY_LENGTH}
              placeholder="Ex. miel, boulangerie, ferme…"
              autoComplete="off"
              onChange={(event) => handleQueryChange(event.target.value)}
            />
          </div>
        </div>
        <ChipGroup
          legend="Activité"
          options={ACTIVITY_OPTIONS}
          value={activity}
          onChange={handleActivityChange}
          layout="wrap"
        />
        {selectedOperator !== undefined && (
          <BioCard
            operator={selectedOperator}
            routeState={routeState}
            onRetryLocate={userLocation.locate}
            onClose={() => setSelectedOperatorId(null)}
          />
        )}
        <p className={styles.summary} role="status" aria-live="polite">
          {liveSummary}
        </p>
        <a className={styles.skipToList} href="#liste-bio">
          Aller à la liste des opérateurs
        </a>
      </div>

      <div className={styles.map}>
        <BioMap
          initialView={initialState.view}
          operators={operators}
          selectedOperatorId={selectedOperatorId}
          userPosition={userLocation.position}
          locationStatus={locationStatus}
          routeState={routeState}
          onSelectOperator={setSelectedOperatorId}
          onDeselectOperator={handleDeselectOperator}
          onViewportChange={setViewport}
          onLocate={userLocation.locate}
        />
      </div>

      <section
        id="liste-bio"
        className={styles.list}
        aria-labelledby="titre-liste-bio"
      >
        <h2 id="titre-liste-bio" className={styles.listTitle}>
          Les plus proches du centre
          <span className={styles.listTag}>
            {formatInteger(totalCount)} en France
          </span>
        </h2>

        {hasError ? (
          <StatusMessage
            variant="error"
            icon={TriangleAlert}
            title="Impossible de charger les opérateurs"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  void operatorsQuery.refetch();
                }}
              >
                Réessayer
              </button>
            }
          >
            {describeApiError(operatorsQuery.error)}
          </StatusMessage>
        ) : isLoading || debouncedViewport === null ? (
          <StatusMessage variant="info" icon={Leaf} title="Chargement…" />
        ) : operators.length === 0 ? (
          <StatusMessage
            variant="empty"
            icon={SearchX}
            title="Aucun opérateur trouvé"
          >
            Essayez un autre mot, une autre activité ou déplacez la carte.
          </StatusMessage>
        ) : (
          <BioList
            operators={operators}
            selectedOperatorId={selectedOperatorId}
            onSelectOperator={setSelectedOperatorId}
          />
        )}
      </section>
    </div>
  );
};

type ResultsDescription = {
  isLoading: boolean;
  hasError: boolean;
  count: number;
  nearestLabel: string | null;
  farthestLabel: string | null;
};

const describeResults = ({
  isLoading,
  hasError,
  count,
  nearestLabel,
  farthestLabel,
}: ResultsDescription): string => {
  if (hasError) {
    return "";
  }
  if (isLoading) {
    return "Chargement des opérateurs bio…";
  }
  if (count === 0 || nearestLabel === null || farthestLabel === null) {
    return "Aucun opérateur trouvé.";
  }
  const countLabel =
    count === 1 ? "1 opérateur affiché" : `${count} opérateurs affichés`;
  return `${countLabel}, de ${nearestLabel} à ${farthestLabel} du centre de la carte. Déplacez la carte pour explorer une autre zone.`;
};
