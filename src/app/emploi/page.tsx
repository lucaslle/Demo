import type { Metadata } from "next";
import { Suspense } from "react";
import { EmploymentPageClient } from "@/features/employment/components/employment-page-client";

export const metadata: Metadata = {
  title: "Emploi et salaires – Autour de moi",
  description:
    "Effectifs salariés et masse salariale du secteur privé par département et par grand secteur, trimestre après trimestre, à partir des données ouvertes Urssaf.",
};

const EmploymentPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <EmploymentPageClient />
    </Suspense>
  </main>
);

export default EmploymentPage;
