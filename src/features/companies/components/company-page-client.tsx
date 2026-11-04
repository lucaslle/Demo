"use client";

import dynamic from "next/dynamic";

// L'état de la recherche vit dans l'URL : la page est rendue côté navigateur,
// le reste de la page reste pré-rendu.
const CompanyExplorer = dynamic(
  () =>
    import("./company-explorer").then((module) => ({
      default: module.CompanyExplorer,
    })),
  { ssr: false },
);

export const CompanyPageClient = () => <CompanyExplorer />;
