import type { Metadata } from "next";
import { Suspense } from "react";
import { DpeExplorer } from "@/features/dpe/components/dpe-explorer";

export const metadata: Metadata = {
  title: "Diagnostics énergétiques – Autour de moi",
  description:
    "Étiquettes énergie et climat des logements et des bâtiments tertiaires d'une commune, à partir des diagnostics de performance énergétique de l'ADEME.",
};

const DpePage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <DpeExplorer />
    </Suspense>
  </main>
);

export default DpePage;
