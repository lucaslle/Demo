"use client";

import dynamic from "next/dynamic";

// Le graphique mesure son conteneur dans le navigateur : la page est rendue
// côté navigateur uniquement, le reste de la page reste pré-rendu.
const EmploymentExplorer = dynamic(
  () =>
    import("./employment-explorer").then((module) => ({
      default: module.EmploymentExplorer,
    })),
  { ssr: false },
);

export const EmploymentPageClient = () => <EmploymentExplorer />;
