"use client";

import "leaflet/dist/leaflet.css";
import "./fuel-map.css";
import {
  divIcon,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from "leaflet";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useResolvedTheme } from "@/shared/hooks/use-resolved-theme";
import { formatPrice } from "@/shared/lib/format";
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
const LOCATE_TIMEOUT_IN_MS = 10_000;
const SELECTED_MARKER_Z_OFFSET = 1000;
const CHEAPEST_MARKER_Z_OFFSET = 500;

const buildPriceIcon = (label: string, tier: PriceTier, isSelected: boolean) =>
  divIcon({
    className: `price-marker price-marker--${tier}${isSelected ? " price-marker--selected" : ""}`,
    html: `<span class="price-marker__label">${label}</span>`,
    iconSize: [78, 30],
    iconAnchor: [39, 38],
  });

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
  onSelectStation: (stationId: number) => void;
  onDeselectStation: (stationId: number) => void;
};

const StationMarker = ({
  displayedStation,
  fuel,
  now,
  isSelected,
  onSelectStation,
  onDeselectStation,
}: StationMarkerProps) => {
  const { station, price, tier } = displayedStation;
  const markerRef = useRef<LeafletMarker | null>(null);
  const priceLabel = formatPrice(price.amount);

  const icon = useMemo(
    () => buildPriceIcon(priceLabel, tier, isSelected),
    [priceLabel, tier, isSelected],
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelectStation(station.id),
      popupclose: () => onDeselectStation(station.id),
    }),
    [onSelectStation, onDeselectStation, station.id],
  );

  useEffect(() => {
    if (isSelected) {
      markerRef.current?.openPopup();
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
        />
      </Popup>
    </Marker>
  );
};

type StationMapProps = {
  initialView: MapView;
  displayedStations: readonly DisplayedStation[];
  fuel: FuelType;
  now: Date;
  selectedStationId: number | null;
  onSelectStation: (stationId: number) => void;
  onDeselectStation: (stationId: number) => void;
  onViewportChange: (viewport: Viewport) => void;
};

export const StationMap = ({
  initialView,
  displayedStations,
  fuel,
  now,
  selectedStationId,
  onSelectStation,
  onDeselectStation,
  onViewportChange,
}: StationMapProps) => {
  const theme = useResolvedTheme();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const locateUser = () => {
    if (map === null) {
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocateError(
        "La géolocalisation n'est pas disponible sur ce navigateur.",
      );
      return;
    }

    setLocateError(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        map.flyTo([coords.latitude, coords.longitude], LOCATE_ZOOM);
      },
      () => {
        setIsLocating(false);
        setLocateError(
          "Position indisponible. Autorisez la géolocalisation ou déplacez la carte.",
        );
      },
      { timeout: LOCATE_TIMEOUT_IN_MS },
    );
  };

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
        {displayedStations.map((displayedStation) => (
          <StationMarker
            key={displayedStation.station.id}
            displayedStation={displayedStation}
            fuel={fuel}
            now={now}
            isSelected={displayedStation.station.id === selectedStationId}
            onSelectStation={onSelectStation}
            onDeselectStation={onDeselectStation}
          />
        ))}
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
          onClick={locateUser}
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
