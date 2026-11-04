import type { Metadata } from "next";
import { Suspense } from "react";
import { DvfPageClient } from "@/features/dvf/components/dvf-page-client";

export const metadata: Metadata = {
  title: "Ventes immobilières – Autour de moi",
  description:
    "Carte des ventes de logements autour d'une adresse : prix, surface, prix au mètre carré et localisation, à partir de l'API Données foncières DVF.",
};

const DvfPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <DvfPageClient />
    </Suspense>
  </main>
);

export default DvfPage;
