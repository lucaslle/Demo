"use client";

import { Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { StatusMessage } from "@/shared/components/status-message";
import styles from "./charging-page-client.module.css";

// Leaflet accède à `window` dès son import : la carte n'est rendue que côté
// navigateur, le reste de la page reste pré-rendu.
const ChargingExplorer = dynamic(
  () =>
    import("./charging-explorer").then((module) => ({
      default: module.ChargingExplorer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <StatusMessage
          variant="info"
          icon={Zap}
          title="Chargement de la carte…"
        />
      </div>
    ),
  },
);

export const ChargingPageClient = () => <ChargingExplorer />;
