"use client";

import { Leaf } from "lucide-react";
import dynamic from "next/dynamic";
import { StatusMessage } from "@/shared/components/status-message";
import styles from "./bio-page-client.module.css";

// Leaflet accède à `window` dès son import : la carte n'est rendue que côté
// navigateur, le reste de la page reste pré-rendu.
const BioExplorer = dynamic(
  () =>
    import("./bio-explorer").then((module) => ({
      default: module.BioExplorer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <StatusMessage
          variant="info"
          icon={Leaf}
          title="Chargement de la carte…"
        />
      </div>
    ),
  },
);

export const BioPageClient = () => <BioExplorer />;
