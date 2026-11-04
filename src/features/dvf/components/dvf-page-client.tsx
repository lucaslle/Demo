"use client";

import { House } from "lucide-react";
import dynamic from "next/dynamic";
import { StatusMessage } from "@/shared/components/status-message";
import styles from "./dvf-page-client.module.css";

// Leaflet accède à `window` dès son import : la carte n'est rendue que côté
// navigateur, le reste de la page reste pré-rendu.
const DvfExplorer = dynamic(
  () =>
    import("./dvf-explorer").then((module) => ({
      default: module.DvfExplorer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <StatusMessage
          variant="info"
          icon={House}
          title="Chargement de la carte…"
        />
      </div>
    ),
  },
);

export const DvfPageClient = () => <DvfExplorer />;
