"use client";

import "./route-map.css";
import { divIcon, latLngBounds } from "leaflet";
import { useEffect, useMemo } from "react";
import { Marker, Polyline, useMap } from "react-leaflet";
import type { LatLng, Route } from "../model/route";

const FIT_PADDING_IN_PIXELS = 72;
const FIT_MAX_ZOOM = 16;

type RouteLayerProps = {
  userPosition: LatLng | null;
  route: Route | null;
};

// Tracé de l'itinéraire et position de l'utilisateur sur la carte. La carte se
// recadre sur le trajet quand un nouvel itinéraire arrive.
export const RouteLayer = ({ userPosition, route }: RouteLayerProps) => {
  const map = useMap();

  const userIcon = useMemo(
    () =>
      divIcon({
        className: "user-dot",
        html: '<span class="user-dot__pulse"></span><span class="user-dot__core"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  useEffect(() => {
    if (route === null) {
      return;
    }
    const bounds = latLngBounds(route.path.map(({ lat, lng }) => [lat, lng]));
    map.fitBounds(bounds, {
      padding: [FIT_PADDING_IN_PIXELS, FIT_PADDING_IN_PIXELS],
      maxZoom: FIT_MAX_ZOOM,
    });
  }, [map, route]);

  const positions = useMemo(
    () => route?.path.map(({ lat, lng }): [number, number] => [lat, lng]),
    [route],
  );

  return (
    <>
      {positions !== undefined && (
        <>
          <Polyline
            positions={positions}
            pathOptions={{
              className: "route-line route-line--casing",
              weight: 10,
              lineCap: "round",
              lineJoin: "round",
              interactive: false,
            }}
          />
          <Polyline
            positions={positions}
            pathOptions={{
              className: "route-line",
              weight: 5,
              lineCap: "round",
              lineJoin: "round",
              interactive: false,
            }}
          />
        </>
      )}
      {userPosition !== null && (
        <Marker
          position={[userPosition.lat, userPosition.lng]}
          icon={userIcon}
          title="Votre position"
          alt="Votre position"
          keyboard={false}
          interactive={false}
          zIndexOffset={900}
        />
      )}
    </>
  );
};
