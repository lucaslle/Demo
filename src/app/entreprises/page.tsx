import type { Metadata } from "next";
import { Suspense } from "react";
import { CompanyPageClient } from "@/features/companies/components/company-page-client";

export const metadata: Metadata = {
  title: "Recherche d'entreprises – Autour de moi",
  description:
    "Infos légales, dirigeants, effectifs et établissements des entreprises françaises, à partir de l'API Recherche d'entreprises de l'État.",
};

const CompaniesPage = () => (
  <main id="contenu">
    <Suspense fallback={null}>
      <CompanyPageClient />
    </Suspense>
  </main>
);

export default CompaniesPage;
