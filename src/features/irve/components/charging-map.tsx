"use client";

import "./charging-markers.css";
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
import type { ChargingStation } from "../model/charging-station";
import { formatPower, getPowerCategory } from "../model/power";
import { ChargingDetails } from "./charging-details";

const SELECTED_MARKER_Z_OFFSET = 1000;
const ULTRA_MARKER_Z_OFFSET = 500;

const BOLT_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor"/></svg>';

const buildChargingIcon = (station: ChargingStation, isSelected: boolean) => {
  const category = getPowerCategory(station.maxPowerKw);
  const label =
    station.maxPowerKw === null ? "?" : String(Math.round(station.maxPowerKw));

  return divIcon({
    className: `charge-marker charge-marker--${category}${isSelected ? " charge-marker--selected" : ""}`,
    html: `<span class="charge-marker__label">${BOLT_SVG}${label}</span>`,
    iconSize: [74, 30],
    iconAnchor: [37, 38],
  });
};

type ChargingMarkerProps = {
  station: ChargingStation;
  isSelected: boolean;
  routeSummary: string | null;
  onSelectStation: (stationId: string) => void;
  onDeselectStation: (stationId: string) => void;
};

const ChargingMarkerView = ({
  station,
  isSelected,
  routeSummary,
  onSelectStation,
  onDeselectStation,
}: ChargingMarkerProps) => {
  const markerRef = useRef<LeafletMarker | null>(null);
  const powerLabel = formatPower(station.maxPowerKw);

  const icon = useMemo(
    () => buildChargingIcon(station, isSelected),
    [station, isSelected],
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelectStation(station.id),
      popupclose: () => onDeselectStation(station.id),
    }),
    [onSelectStation, onDeselectStation, station.id],
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

  const category = getPowerCategory(station.maxPowerKw);
  const zIndexOffset = isSelected
    ? SELECTED_MARKER_Z_OFFSET
    : category === "ultra"
      ? ULTRA_MARKER_Z_OFFSET
      : 0;

  return (
    <Marker
      ref={markerRef}
      position={[station.position.lat, station.position.lng]}
      icon={icon}
      title={`${powerLabel} – ${station.name}`}
      alt={`Borne de recharge ${station.name}, ${powerLabel}`}
      zIndexOffset={zIndexOffset}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <ChargingDetails station={station} routeSummary={routeSummary} />
      </Popup>
    </Marker>
  );
};

// Voir StationMap : sans cette comparaison, un déplacement de la carte
// re-rendait chaque marqueur et bouclait avec le recadrage de la fenêtre.
const areMarkerPropsEqual = (
  previous: ChargingMarkerProps,
  next: ChargingMarkerProps,
): boolean =>
  previous.station === next.station &&
  previous.isSelected === next.isSelected &&
  previous.routeSummary === next.routeSummary &&
  previous.onSelectStation === next.onSelectStation &&
  previous.onDeselectStation === next.onDeselectStation;

const ChargingMarker = memo(ChargingMarkerView, areMarkerPropsEqual);

type ChargingMapProps = {
  initialView: MapView;
  stations: readonly ChargingStation[];
  selectedStationId: string | null;
  userPosition: LatLng | null;
  locationStatus: LocationStatus;
  routeState: RouteState;
  onSelectStation: (stationId: string) => void;
  onDeselectStation: (stationId: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onLocate: () => void;
};

export const ChargingMap = ({
  initialView,
  stations,
  selectedStationId,
  userPosition,
  locationStatus,
  routeState,
  onSelectStation,
  onDeselectStation,
  onViewportChange,
  onLocate,
}: ChargingMapProps) => {
  const route = routeState.status === "ready" ? routeState.route : null;
  const routeSummary = summarizeRouteState(routeState);

  return (
    <MapShell
      ariaLabel="Carte des bornes de recharge"
      initialView={initialView}
      userPosition={userPosition}
      locationStatus={locationStatus}
      route={route}
      onViewportChange={onViewportChange}
      onLocate={onLocate}
    >
      {stations.map((station) => {
        const isSelected = station.id === selectedStationId;
        return (
          <ChargingMarker
            key={station.id}
            station={station}
            isSelected={isSelected}
            routeSummary={isSelected ? routeSummary : null}
            onSelectStation={onSelectStation}
            onDeselectStation={onDeselectStation}
          />
        );
      })}
    </MapShell>
  );
};
