import type { Bounds } from "./bounds";

export type MapView = {
  lat: number;
  lng: number;
  zoom: number;
};

export type Viewport = {
  bounds: Bounds;
  center: { lat: number; lng: number };
  zoom: number;
};
