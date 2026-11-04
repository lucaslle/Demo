"use client";

import "leaflet/dist/leaflet.css";
import "./map-shell.css";
import type { Map as LeafletMap } from "leaflet";
import { LoaderCircle, LocateFixed } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { RouteLayer } from "@/features/route/components/route-layer";
import type { LocationStatus } from "@/features/route/hooks/use-user-location";
import type { LatLng, Route } from "@/features/route/model/route";
import {
  LOCATION_DENIED_MESSAGE,
  LOCATION_UNAVAILABLE_MESSAGE,
} from "@/features/route/model/route-state";
import { useResolvedTheme } from "@/shared/hooks/use-resolved-theme";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from "../model/map-config";
import type { MapView, Viewport } from "../model/viewport";

// Fond de carte Plan IGN (Géoplateforme) : officiel, gratuit, sans clé. Le mode
// sombre est obtenu en retraitant les tuiles en CSS (voir map-shell.css).
const TILE_URL =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.ign.fr/">IGN</a> – Géoplateforme';

const LOCATE_ZOOM = 14;

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

type MapShellProps = {
  ariaLabel: string;
  initialView: MapView;
  userPosition: LatLng | null;
  locationStatus: LocationStatus;
  route: Route | null;
  onViewportChange: (viewport: Viewport) => void;
  onLocate: () => void;
  children: ReactNode;
};

// Socle commun aux cartes de l'application : fond IGN, suivi de la zone visible,
// position de l'utilisateur, itinéraire et bouton « Me localiser ». Les
// marqueurs propres à chaque thème sont fournis en enfants.
export const MapShell = ({
  ariaLabel,
  initialView,
  userPosition,
  locationStatus,
  route,
  onViewportChange,
  onLocate,
  children,
}: MapShellProps) => {
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

  return (
    <div
      className={
        theme === "dark"
          ? "map-shell-wrapper map-shell-wrapper--dark"
          : "map-shell-wrapper"
      }
      role="region"
      aria-label={ariaLabel}
    >
      <MapContainer
        ref={setMap}
        className="map-shell"
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
        {children}
      </MapContainer>

      <div className="map-shell-controls">
        {locateError !== null && (
          <p className="map-shell-controls__error" role="alert">
            {locateError}
          </p>
        )}
        <button
          type="button"
          className="map-shell-controls__locate"
          onClick={handleLocateClick}
          disabled={map === null || isLocating}
          aria-label={isLocating ? "Localisation en cours" : "Me localiser"}
          title="Me localiser"
        >
          {isLocating ? (
            <LoaderCircle
              className="map-shell-controls__spinner"
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
