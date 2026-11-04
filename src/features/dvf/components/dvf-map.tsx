"use client";

import "./dvf-markers.css";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { memo, useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { MapShell } from "@/features/map/components/map-shell";
import type {
  MapFocusTarget,
  MapView,
  Viewport,
} from "@/features/map/model/viewport";
import type { LocationStatus } from "@/features/route/hooks/use-user-location";
import type { LatLng } from "@/features/route/model/route";
import type { Sale } from "../model/sale";
import { formatMarkerLabel, formatPriceInEuros } from "../model/sale-format";
import type { PriceTier } from "../model/sale-stats";
import { SaleDetails } from "./sale-details";

const SELECTED_MARKER_Z_OFFSET = 1000;

const buildSaleIcon = (sale: Sale, tier: PriceTier, isSelected: boolean) =>
  divIcon({
    className: `dvf-marker dvf-marker--${tier}${isSelected ? " dvf-marker--selected" : ""}`,
    html: `<span class="dvf-marker__label">${formatMarkerLabel(sale.pricePerSqm, sale.price)}</span>`,
    iconSize: [92, 28],
    iconAnchor: [46, 36],
  });

type SaleMarkerProps = {
  sale: Sale;
  tier: PriceTier;
  isSelected: boolean;
  onSelectSale: (saleId: string) => void;
  onDeselectSale: (saleId: string) => void;
};

const SaleMarkerView = ({
  sale,
  tier,
  isSelected,
  onSelectSale,
  onDeselectSale,
}: SaleMarkerProps) => {
  const markerRef = useRef<LeafletMarker | null>(null);

  const icon = useMemo(
    () => buildSaleIcon(sale, tier, isSelected),
    [sale, tier, isSelected],
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelectSale(sale.id),
      popupclose: () => onDeselectSale(sale.id),
    }),
    [onSelectSale, onDeselectSale, sale.id],
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

  return (
    <Marker
      ref={markerRef}
      position={[sale.position.lat, sale.position.lng]}
      icon={icon}
      title={`${sale.typeLabel} – ${formatPriceInEuros(sale.price)}`}
      alt={`Vente : ${sale.typeLabel}, ${formatPriceInEuros(sale.price)}`}
      zIndexOffset={isSelected ? SELECTED_MARKER_Z_OFFSET : 0}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <SaleDetails sale={sale} />
      </Popup>
    </Marker>
  );
};

// Voir StationMap : sans cette comparaison, un déplacement de la carte
// re-rendait chaque marqueur et bouclait avec le recadrage de la fenêtre.
const areMarkerPropsEqual = (
  previous: SaleMarkerProps,
  next: SaleMarkerProps,
): boolean =>
  previous.sale === next.sale &&
  previous.tier === next.tier &&
  previous.isSelected === next.isSelected &&
  previous.onSelectSale === next.onSelectSale &&
  previous.onDeselectSale === next.onDeselectSale;

const SaleMarker = memo(SaleMarkerView, areMarkerPropsEqual);

export type TieredSale = {
  sale: Sale;
  tier: PriceTier;
};

type DvfMapProps = {
  initialView: MapView;
  sales: readonly TieredSale[];
  selectedSaleId: string | null;
  focusTarget: MapFocusTarget | null;
  userPosition: LatLng | null;
  locationStatus: LocationStatus;
  onSelectSale: (saleId: string) => void;
  onDeselectSale: (saleId: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onLocate: () => void;
};

export const DvfMap = ({
  initialView,
  sales,
  selectedSaleId,
  focusTarget,
  userPosition,
  locationStatus,
  onSelectSale,
  onDeselectSale,
  onViewportChange,
  onLocate,
}: DvfMapProps) => (
  <MapShell
    ariaLabel="Carte des ventes immobilières"
    initialView={initialView}
    userPosition={userPosition}
    locationStatus={locationStatus}
    route={null}
    focusTarget={focusTarget}
    onViewportChange={onViewportChange}
    onLocate={onLocate}
  >
    {sales.map(({ sale, tier }) => (
      <SaleMarker
        key={sale.id}
        sale={sale}
        tier={tier}
        isSelected={sale.id === selectedSaleId}
        onSelectSale={onSelectSale}
        onDeselectSale={onDeselectSale}
      />
    ))}
  </MapShell>
);
