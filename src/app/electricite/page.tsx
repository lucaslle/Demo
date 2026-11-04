import type { Metadata } from "next";
import { Suspense } from "react";
import { ElectricityPageClient } from "@/features/enedis/components/electricity-page-client";

export const metadata: Metadata = {
  title: "Consommation électrique – Autour de moi",
  description:
    "La consommation d'électricité d'une commune et de ses quartiers, par secteur d'activité et par année, à partir des données ouvertes d'Enedis.",
};

const ElectricityPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <ElectricityPageClient />
    </Suspense>
  </main>
);

export default ElectricityPage;
