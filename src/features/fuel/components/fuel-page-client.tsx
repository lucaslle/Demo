"use client";

import { Map } from "lucide-react";
import dynamic from "next/dynamic";
import { StatusMessage } from "@/shared/components/status-message";
import { usePreferencesHydrated } from "@/shared/hooks/use-preferences-hydrated";
import styles from "./fuel-page-client.module.css";

const MapLoading = () => (
  <div className={styles.loading}>
    <StatusMessage variant="info" icon={Map} title="Chargement de la carte…" />
  </div>
);

// Leaflet accède à `window` dès son import : la carte n'est rendue que côté
// navigateur, le reste de la page reste pré-rendu.
const FuelExplorer = dynamic(
  () =>
    import("./fuel-explorer").then((module) => ({
      default: module.FuelExplorer,
    })),
  { ssr: false, loading: MapLoading },
);

// Attend la restauration des préférences (carburant favori) avant d'afficher
// la carte, pour que l'état initial en tienne compte.
export const FuelPageClient = () => {
  const arePreferencesHydrated = usePreferencesHydrated();

  return arePreferencesHydrated ? <FuelExplorer /> : <MapLoading />;
};
