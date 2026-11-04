import type { Metadata } from "next";
import { ComparatorPageClient } from "@/features/comparator/components/comparator-page-client";

export const metadata: Metadata = {
  title: "Comparateur carburant ou électrique – Autour de moi",
  description:
    "Comparez le coût d'un trajet entre carburant, recharge à domicile et bornes publiques, à partir des prix et tarifs ouverts de l'État.",
};

const ComparatorPage = () => (
  <main id="contenu">
    <ComparatorPageClient />
  </main>
);

export default ComparatorPage;
