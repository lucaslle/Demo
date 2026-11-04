import { Car, ExternalLink, LoaderCircle } from "lucide-react";
import {
  buildOpenStreetMapDirectionsUrl,
  formatDistance,
  formatDuration,
} from "../model/route";
import { summarizeRouteState, type RouteState } from "../model/route-state";
import styles from "./route-panel.module.css";

type RoutePanelProps = {
  state: RouteState;
  onRetryLocate: () => void;
};

export const RoutePanel = ({ state, onRetryLocate }: RoutePanelProps) => {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "locating" || state.status === "loading") {
    return (
      <p className={styles.pending} role="status">
        <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
        {summarizeRouteState(state)}
      </p>
    );
  }

  if (state.status === "ready") {
    const { route, origin, destination } = state;

    return (
      <div className={styles.ready}>
        <p className={styles.summary} role="status">
          <Car size={20} aria-hidden="true" />
          <span className={styles.duration}>
            {formatDuration(route.durationInSeconds)}
          </span>
          <span className={styles.distance}>
            {formatDistance(route.distanceInMeters)}
          </span>
        </p>

        <details className={styles.steps}>
          <summary>Voir les étapes ({route.steps.length})</summary>
          <ol>
            {route.steps.map((step, index) => (
              <li key={index}>
                <span>{step.label}</span>
                <span className={styles.stepDistance}>
                  {formatDistance(step.distanceInMeters)}
                </span>
              </li>
            ))}
          </ol>
        </details>

        <a
          className={styles.external}
          href={buildOpenStreetMapDirectionsUrl(origin, destination)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir dans OpenStreetMap
          <ExternalLink size={14} aria-hidden="true" />
          <span className="visually-hidden"> (nouvel onglet)</span>
        </a>
        <p className={styles.credit}>
          Itinéraire en voiture, calculé par l&apos;IGN (Géoplateforme).
        </p>
      </div>
    );
  }

  const canRetry =
    state.status === "location-denied" ||
    state.status === "location-unavailable";

  return (
    <div className={styles.failure} role="alert">
      <p>{summarizeRouteState(state)}</p>
      {canRetry && (
        <button
          type="button"
          className="button button--secondary"
          onClick={onRetryLocate}
        >
          Réessayer
        </button>
      )}
    </div>
  );
};
