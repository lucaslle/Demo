"use client";

import dynamic from "next/dynamic";
import { StatusMessage } from "@/shared/components/status-message";

// Leaflet accède à `window` dès son import : la carte n'est rendue que côté
// navigateur, le reste de la page reste pré-rendu.
const FuelExplorer = dynamic(
  () =>
    import("./fuel-explorer").then((module) => ({
      default: module.FuelExplorer,
    })),
  {
    ssr: false,
    loading: () => (
      <StatusMessage variant="info" title="Chargement de la carte…" />
    ),
  },
);

export const FuelPageClient = () => <FuelExplorer />;
