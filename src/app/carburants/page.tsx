import type { Metadata } from "next";
import { Suspense } from "react";
import { FuelPageClient } from "@/features/fuel/components/fuel-page-client";

export const metadata: Metadata = {
  title: "Prix des carburants – Autour de moi",
  description:
    "Carte des stations-service avec les prix des carburants, mis à jour en continu à partir des données ouvertes de l'État.",
};

const FuelPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <FuelPageClient />
    </Suspense>
  </main>
);

export default FuelPage;
