import "@fontsource-variable/inter";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { PreferencesSync } from "@/shared/components/preferences-sync";
import { SiteHeader } from "@/shared/components/site-header";
import { SITE_NAME } from "@/shared/lib/site";
import { PREFERENCES_STORAGE_KEY } from "@/shared/stores/preferences-store";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "Prix des carburants, équipements sportifs et risques autour de vous, à partir des données ouvertes de l'État.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d16" },
  ],
};

// Applique le thème enregistré avant le premier affichage, pour éviter un
// flash de la mauvaise couleur au chargement.
const THEME_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)})||"{}");var t=s.state&&s.state.theme;if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="fr" suppressHydrationWarning>
    <body>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Providers>
        <PreferencesSync />
        <SiteHeader />
        {children}
      </Providers>
    </body>
  </html>
);

export default RootLayout;
