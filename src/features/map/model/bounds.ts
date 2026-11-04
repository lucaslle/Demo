export type Bounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type Position = { lat: number; lng: number };

const GRID_STEP_IN_DEGREES = 0.02;
const PADDING_RATIO = 0.25;
const SHRINK_RATIO_TRIGGERING_REFETCH = 0.4;
const COORDINATE_DECIMALS = 4;

const roundCoordinate = (value: number): number =>
  Number(value.toFixed(COORDINATE_DECIMALS));

const snapDown = (value: number): number =>
  roundCoordinate(
    Math.floor(value / GRID_STEP_IN_DEGREES) * GRID_STEP_IN_DEGREES,
  );

const snapUp = (value: number): number =>
  roundCoordinate(
    Math.ceil(value / GRID_STEP_IN_DEGREES) * GRID_STEP_IN_DEGREES,
  );

const computeArea = (bounds: Bounds): number =>
  (bounds.north - bounds.south) * (bounds.east - bounds.west);

// Agrandit la zone visible puis l'aligne sur une grille : des déplacements
// légers de la carte restent dans la zone déjà chargée et réutilisent le cache.
export const padAndSnapBounds = (bounds: Bounds): Bounds => {
  const latitudePadding = (bounds.north - bounds.south) * PADDING_RATIO;
  const longitudePadding = (bounds.east - bounds.west) * PADDING_RATIO;

  return {
    south: snapDown(bounds.south - latitudePadding),
    west: snapDown(bounds.west - longitudePadding),
    north: snapUp(bounds.north + latitudePadding),
    east: snapUp(bounds.east + longitudePadding),
  };
};

export const areBoundsEqual = (first: Bounds, second: Bounds): boolean =>
  first.south === second.south &&
  first.west === second.west &&
  first.north === second.north &&
  first.east === second.east;

export const containsBounds = (outer: Bounds, inner: Bounds): boolean =>
  inner.south >= outer.south &&
  inner.north <= outer.north &&
  inner.west >= outer.west &&
  inner.east <= outer.east;

export const isPositionInBounds = (
  position: Position,
  bounds: Bounds,
): boolean =>
  position.lat >= bounds.south &&
  position.lat <= bounds.north &&
  position.lng >= bounds.west &&
  position.lng <= bounds.east;

// Une nouvelle zone est nécessaire quand la vue sort de la zone chargée, ou,
// si la liste était tronquée, quand l'utilisateur zoome nettement : les
// stations moins chères de la zone resserrée n'ont peut-être pas été reçues.
export const needsNewFetchArea = (
  viewport: Bounds,
  fetchArea: Bounds,
  isTruncated: boolean,
): boolean => {
  if (!containsBounds(fetchArea, viewport)) {
    return true;
  }
  return (
    isTruncated &&
    computeArea(viewport) <
      computeArea(fetchArea) * SHRINK_RATIO_TRIGGERING_REFETCH
  );
};
