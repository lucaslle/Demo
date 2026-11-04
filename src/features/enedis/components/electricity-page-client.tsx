"use client";

import dynamic from "next/dynamic";

// Le graphique mesure son conteneur dans le navigateur : la page est rendue
// côté navigateur uniquement, le reste de la page reste pré-rendu.
const ElectricityExplorer = dynamic(
  () =>
    import("./electricity-explorer").then((module) => ({
      default: module.ElectricityExplorer,
    })),
  { ssr: false },
);

export const ElectricityPageClient = () => <ElectricityExplorer />;
