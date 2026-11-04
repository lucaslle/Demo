import type { Bounds } from "./bounds";

export type MapView = {
  lat: number;
  lng: number;
  zoom: number;
};

// Cible vers laquelle la carte se déplace (résultat d'une recherche de lieu).
// Chaque cible est un nouvel objet : choisir deux fois le même lieu recentre
// donc la carte deux fois.
export type MapFocusTarget = MapView;

export type Viewport = {
  bounds: Bounds;
  center: { lat: number; lng: number };
  zoom: number;
};
