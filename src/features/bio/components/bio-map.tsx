"use client";

import "./bio-markers.css";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { memo, useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { MapShell } from "@/features/map/components/map-shell";
import type { MapView, Viewport } from "@/features/map/model/viewport";
import type { LocationStatus } from "@/features/route/hooks/use-user-location";
import type { LatLng } from "@/features/route/model/route";
import {
  summarizeRouteState,
  type RouteState,
} from "@/features/route/model/route-state";
import {
  getPrimaryKind,
  KIND_LABELS,
  type BioOperator,
} from "../model/operator";
import { BioDetails } from "./bio-details";

const SELECTED_MARKER_Z_OFFSET = 1000;

const LEAF_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M5 21c0-9 5-15 15-16-.5 10-6 16-15 16Zm0 0c3-6 6-9 10-11" fill="currentColor"/></svg>';

const buildBioIcon = (
  operator: BioOperator,
  rank: number,
  isSelected: boolean,
) =>
  divIcon({
    className: `bio-marker bio-marker--${getPrimaryKind(operator.activities)}${isSelected ? " bio-marker--selected" : ""}`,
    html: `<span class="bio-marker__label">${LEAF_SVG}${rank}</span>`,
    iconSize: [52, 30],
    iconAnchor: [26, 38],
  });

type BioMarkerProps = {
  operator: BioOperator;
  rank: number;
  isSelected: boolean;
  routeSummary: string | null;
  onSelectOperator: (operatorId: string) => void;
  onDeselectOperator: (operatorId: string) => void;
};

const BioMarkerView = ({
  operator,
  rank,
  isSelected,
  routeSummary,
  onSelectOperator,
  onDeselectOperator,
}: BioMarkerProps) => {
  const markerRef = useRef<LeafletMarker | null>(null);

  const icon = useMemo(
    () => buildBioIcon(operator, rank, isSelected),
    [operator, rank, isSelected],
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelectOperator(operator.id),
      popupclose: () => onDeselectOperator(operator.id),
    }),
    [onSelectOperator, onDeselectOperator, operator.id],
  );

  useEffect(() => {
    const marker = markerRef.current;
    if (marker === null) {
      return;
    }
    if (isSelected) {
      marker.openPopup();
    } else {
      marker.closePopup();
    }
  }, [isSelected]);

  const kindLabel = KIND_LABELS[getPrimaryKind(operator.activities)];

  return (
    <Marker
      ref={markerRef}
      position={[operator.position.lat, operator.position.lng]}
      icon={icon}
      title={`${operator.name} – ${kindLabel}`}
      alt={`${kindLabel} bio ${operator.name}`}
      zIndexOffset={isSelected ? SELECTED_MARKER_Z_OFFSET : 0}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <BioDetails operator={operator} routeSummary={routeSummary} />
      </Popup>
    </Marker>
  );
};

// Voir StationMap : sans cette comparaison, un déplacement de la carte
// re-rendait chaque marqueur et bouclait avec le recadrage de la fenêtre.
const areMarkerPropsEqual = (
  previous: BioMarkerProps,
  next: BioMarkerProps,
): boolean =>
  previous.operator === next.operator &&
  previous.rank === next.rank &&
  previous.isSelected === next.isSelected &&
  previous.routeSummary === next.routeSummary &&
  previous.onSelectOperator === next.onSelectOperator &&
  previous.onDeselectOperator === next.onDeselectOperator;

const BioMarker = memo(BioMarkerView, areMarkerPropsEqual);

type BioMapProps = {
  initialView: MapView;
  operators: readonly BioOperator[];
  selectedOperatorId: string | null;
  userPosition: LatLng | null;
  locationStatus: LocationStatus;
  routeState: RouteState;
  onSelectOperator: (operatorId: string) => void;
  onDeselectOperator: (operatorId: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onLocate: () => void;
};

export const BioMap = ({
  initialView,
  operators,
  selectedOperatorId,
  userPosition,
  locationStatus,
  routeState,
  onSelectOperator,
  onDeselectOperator,
  onViewportChange,
  onLocate,
}: BioMapProps) => {
  const route = routeState.status === "ready" ? routeState.route : null;
  const routeSummary = summarizeRouteState(routeState);

  return (
    <MapShell
      ariaLabel="Carte des producteurs et commerces bio"
      initialView={initialView}
      userPosition={userPosition}
      locationStatus={locationStatus}
      route={route}
      onViewportChange={onViewportChange}
      onLocate={onLocate}
    >
      {operators.map((operator, index) => {
        const isSelected = operator.id === selectedOperatorId;
        return (
          <BioMarker
            key={operator.id}
            operator={operator}
            rank={index + 1}
            isSelected={isSelected}
            routeSummary={isSelected ? routeSummary : null}
            onSelectOperator={onSelectOperator}
            onDeselectOperator={onDeselectOperator}
          />
        );
      })}
    </MapShell>
  );
};
