"use client";

import "./price-markers.css";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { memo, useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { MapShell } from "@/features/map/components/map-shell";
import type { Viewport } from "@/features/map/model/viewport";
import type { MapView } from "@/features/map/model/viewport";
import type { LocationStatus } from "@/features/route/hooks/use-user-location";
import type { LatLng } from "@/features/route/model/route";
import {
  summarizeRouteState,
  type RouteState,
} from "@/features/route/model/route-state";
import { formatPrice, splitPrice } from "@/shared/lib/format";
import type { DisplayedStation } from "../model/displayed-station";
import type { FuelType } from "../model/fuel-types";
import type { PriceTier } from "../model/price-tier";
import { StationDetails } from "./station-details";

const SELECTED_MARKER_Z_OFFSET = 1000;
const CHEAPEST_MARKER_Z_OFFSET = 500;

const buildPriceIcon = (
  amount: number,
  tier: PriceTier,
  isSelected: boolean,
) => {
  const { main, lastDigit } = splitPrice(amount);

  return divIcon({
    className: `price-marker price-marker--${tier}${isSelected ? " price-marker--selected" : ""}`,
    html: `<span class="price-marker__label">${main}<sup>${lastDigit}</sup></span>`,
    iconSize: [78, 30],
    iconAnchor: [39, 38],
  });
};

type StationMarkerProps = {
  displayedStation: DisplayedStation;
  fuel: FuelType;
  now: Date;
  isSelected: boolean;
  routeSummary: string | null;
  onSelectStation: (stationId: number) => void;
  onDeselectStation: (stationId: number) => void;
};

const StationMarkerView = ({
  displayedStation,
  fuel,
  now,
  isSelected,
  routeSummary,
  onSelectStation,
  onDeselectStation,
}: StationMarkerProps) => {
  const { station, price, tier } = displayedStation;
  const markerRef = useRef<LeafletMarker | null>(null);
  const priceLabel = formatPrice(price.amount);

  const icon = useMemo(
    () => buildPriceIcon(price.amount, tier, isSelected),
    [price.amount, tier, isSelected],
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelectStation(station.id),
      popupclose: () => onDeselectStation(station.id),
    }),
    [onSelectStation, onDeselectStation, station.id],
  );

  // La fenêtre suit la sélection, que celle-ci vienne de la carte, de la liste
  // ou du bouton de fermeture du panneau.
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

  const zIndexOffset = isSelected
    ? SELECTED_MARKER_Z_OFFSET
    : tier === "cheapest"
      ? CHEAPEST_MARKER_Z_OFFSET
      : 0;

  return (
    <Marker
      ref={markerRef}
      position={[station.position.lat, station.position.lng]}
      icon={icon}
      title={`${priceLabel} – ${station.address}, ${station.city}`}
      alt={`Station ${station.address}, ${station.city}, ${priceLabel}`}
      zIndexOffset={zIndexOffset}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <StationDetails
          displayedStation={displayedStation}
          fuel={fuel}
          now={now}
          routeSummary={routeSummary}
        />
      </Popup>
    </Marker>
  );
};

// Un déplacement de la carte recalcule la liste des stations affichées : sans
// cette comparaison, chaque marqueur se re-rendait et mettait à jour sa fenêtre
// ouverte, qui recadrait la carte et relançait un déplacement en boucle.
const areMarkerPropsEqual = (
  previous: StationMarkerProps,
  next: StationMarkerProps,
): boolean =>
  previous.displayedStation.station === next.displayedStation.station &&
  previous.displayedStation.price.amount ===
    next.displayedStation.price.amount &&
  previous.displayedStation.price.updatedAt ===
    next.displayedStation.price.updatedAt &&
  previous.displayedStation.tier === next.displayedStation.tier &&
  previous.fuel === next.fuel &&
  previous.now === next.now &&
  previous.isSelected === next.isSelected &&
  previous.routeSummary === next.routeSummary &&
  previous.onSelectStation === next.onSelectStation &&
  previous.onDeselectStation === next.onDeselectStation;

const StationMarker = memo(StationMarkerView, areMarkerPropsEqual);

type StationMapProps = {
  initialView: MapView;
  displayedStations: readonly DisplayedStation[];
  fuel: FuelType;
  now: Date;
  selectedStationId: number | null;
  userPosition: LatLng | null;
  locationStatus: LocationStatus;
  routeState: RouteState;
  onSelectStation: (stationId: number) => void;
  onDeselectStation: (stationId: number) => void;
  onViewportChange: (viewport: Viewport) => void;
  onLocate: () => void;
};

export const StationMap = ({
  initialView,
  displayedStations,
  fuel,
  now,
  selectedStationId,
  userPosition,
  locationStatus,
  routeState,
  onSelectStation,
  onDeselectStation,
  onViewportChange,
  onLocate,
}: StationMapProps) => {
  const route = routeState.status === "ready" ? routeState.route : null;
  const routeSummary = summarizeRouteState(routeState);

  return (
    <MapShell
      ariaLabel="Carte des stations-service"
      initialView={initialView}
      userPosition={userPosition}
      locationStatus={locationStatus}
      route={route}
      onViewportChange={onViewportChange}
      onLocate={onLocate}
    >
      {displayedStations.map((displayedStation) => {
        const isSelected = displayedStation.station.id === selectedStationId;
        return (
          <StationMarker
            key={displayedStation.station.id}
            displayedStation={displayedStation}
            fuel={fuel}
            now={now}
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
