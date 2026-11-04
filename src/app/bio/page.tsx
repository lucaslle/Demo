import type { Metadata } from "next";
import { Suspense } from "react";
import { BioPageClient } from "@/features/bio/components/bio-page-client";

export const metadata: Metadata = {
  title: "Producteurs et commerces bio – Autour de moi",
  description:
    "Carte des producteurs, transformateurs et distributeurs bio certifiés les plus proches, avec produits, contact et itinéraire, à partir de l'API Professionnels bio de l'Agence Bio.",
};

const BioPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <BioPageClient />
    </Suspense>
  </main>
);

export default BioPage;
