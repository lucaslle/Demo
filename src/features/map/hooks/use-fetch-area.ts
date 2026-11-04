import { useState } from "react";
import {
  areBoundsEqual,
  needsNewFetchArea,
  padAndSnapBounds,
  type Bounds,
} from "../model/bounds";

// La zone chargée est plus large que la vue : on ne la recalcule que lorsque
// l'utilisateur en sort, pour ne pas relancer d'appel à chaque déplacement.
// `syncFetchArea` s'appelle pendant le rendu, après la requête qui dépend de
// `fetchArea` (React rejoue alors immédiatement le rendu avec la nouvelle zone).
export const useFetchArea = () => {
  const [fetchArea, setFetchArea] = useState<Bounds | null>(null);

  const syncFetchArea = (viewport: Bounds, isTruncated: boolean) => {
    if (
      fetchArea !== null &&
      !needsNewFetchArea(viewport, fetchArea, isTruncated)
    ) {
      return;
    }
    const nextFetchArea = padAndSnapBounds(viewport);
    if (fetchArea === null || !areBoundsEqual(nextFetchArea, fetchArea)) {
      setFetchArea(nextFetchArea);
    }
  };

  return { fetchArea, syncFetchArea };
};
