import type { Metadata } from "next";
import { Suspense } from "react";
import { ChargingPageClient } from "@/features/irve/components/charging-page-client";

export const metadata: Metadata = {
  title: "Bornes de recharge – Autour de moi",
  description:
    "Carte des bornes de recharge pour véhicules électriques : puissance, prises, tarifs affichés et itinéraire, à partir des données ouvertes de l'État.",
};

const ChargingPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <ChargingPageClient />
    </Suspense>
  </main>
);

export default ChargingPage;
