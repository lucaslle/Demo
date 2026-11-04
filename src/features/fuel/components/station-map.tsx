"use client";

import "leaflet/dist/leaflet.css";
import "./fuel-map.css";
import {
  divIcon,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from "leaflet";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { RouteLayer } from "@/features/route/components/route-layer";
import type { LocationStatus } from "@/features/route/hooks/use-user-location";
import type { LatLng } from "@/features/route/model/route";
import {
  LOCATION_DENIED_MESSAGE,
  LOCATION_UNAVAILABLE_MESSAGE,
  summarizeRouteState,
  type RouteState,
} from "@/features/route/model/route-state";
import { useResolvedTheme } from "@/shared/hooks/use-resolved-theme";
import { formatPrice, splitPrice } from "@/shared/lib/format";
import type { DisplayedStation } from "../model/displayed-station";
import type { FuelType } from "../model/fuel-types";
import type { PriceTier } from "../model/price-tier";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from "../model/url-state";
import type { MapView, Viewport } from "../model/viewport";
import { StationDetails } from "./station-details";

// Fond de carte Plan IGN (Géoplateforme) : officiel, gratuit, sans clé. Le mode
// sombre est obtenu en retraitant les tuiles en CSS (voir fuel-map.css).
const TILE_URL =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.ign.fr/">IGN</a> – Géoplateforme';

const LOCATE_ZOOM = 14;
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

type ViewportReporterProps = {
  onViewportChange: (viewport: Viewport) => void;
};

const ViewportReporter = ({ onViewportChange }: ViewportReporterProps) => {
  const map = useMap();

  const reportViewport = useCallback(() => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onViewportChange({
      bounds: {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      },
      center: { lat: center.lat, lng: center.lng },
      zoom: map.getZoom(),
    });
  }, [map, onViewportChange]);

  useMapEvents({ moveend: reportViewport });

  useEffect(() => {
    reportViewport();
  }, [reportViewport]);

  return null;
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
  const theme = useResolvedTheme();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [hasPressedLocate, setHasPressedLocate] = useState(false);
  const shouldFlyToUserRef = useRef(false);

  // Après un clic sur « Me localiser », la carte se centre dès que la position
  // arrive (la demande au navigateur peut prendre quelques secondes).
  useEffect(() => {
    if (shouldFlyToUserRef.current && userPosition !== null && map !== null) {
      shouldFlyToUserRef.current = false;
      map.flyTo([userPosition.lat, userPosition.lng], LOCATE_ZOOM);
    }
  }, [userPosition, map]);

  const handleLocateClick = () => {
    setHasPressedLocate(true);
    if (userPosition !== null && map !== null) {
      map.flyTo([userPosition.lat, userPosition.lng], LOCATE_ZOOM);
    } else {
      shouldFlyToUserRef.current = true;
    }
    onLocate();
  };

  const isLocating = locationStatus === "locating";
  const locateError =
    hasPressedLocate && locationStatus === "denied"
      ? LOCATION_DENIED_MESSAGE
      : hasPressedLocate && locationStatus === "unavailable"
        ? LOCATION_UNAVAILABLE_MESSAGE
        : null;

  const route = routeState.status === "ready" ? routeState.route : null;
  const routeSummary = summarizeRouteState(routeState);

  return (
    <div
      className={
        theme === "dark"
          ? "fuel-map-wrapper fuel-map-wrapper--dark"
          : "fuel-map-wrapper"
      }
      role="region"
      aria-label="Carte des stations-service"
    >
      <MapContainer
        ref={setMap}
        className="fuel-map"
        center={[initialView.lat, initialView.lng]}
        zoom={initialView.zoom}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={MAP_MAX_ZOOM}
        />
        <ViewportReporter onViewportChange={onViewportChange} />
        <RouteLayer userPosition={userPosition} route={route} />
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
      </MapContainer>

      <div className="fuel-map-controls">
        {locateError !== null && (
          <p className="fuel-map-controls__error" role="alert">
            {locateError}
          </p>
        )}
        <button
          type="button"
          className="fuel-map-controls__locate"
          onClick={handleLocateClick}
          disabled={map === null || isLocating}
          aria-label={isLocating ? "Localisation en cours" : "Me localiser"}
          title="Me localiser"
        >
          {isLocating ? (
            <LoaderCircle
              className="fuel-map-controls__spinner"
              size={22}
              aria-hidden="true"
            />
          ) : (
            <LocateFixed size={22} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
};
