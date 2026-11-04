import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FuelPageClient } from "@/features/fuel/components/fuel-page-client";

export const metadata: Metadata = {
  title: "Prix des carburants – Autour de moi",
  description:
    "Carte des stations-service avec les prix des carburants, mis à jour en continu à partir des données ouvertes de l'État.",
};

const FuelPage = () => (
  <main id="contenu" className="page page--wide">
    <p>
      <Link href="/">← Accueil</Link>
    </p>
    <h1>Prix des carburants</h1>
    <p>
      Déplacez la carte pour comparer les prix des stations-service autour de
      vous.
    </p>
    <Suspense fallback={null}>
      <FuelPageClient />
    </Suspense>
    <p className="page__source">
      Données : prix-carburants.gouv.fr, via data.economie.gouv.fr (Licence
      Ouverte 2.0). Fond de carte : IGN.
    </p>
  </main>
);

export default FuelPage;
