import {
  Accessibility,
  ArrowRight,
  Dumbbell,
  ExternalLink,
  Fuel,
  Radio,
  ServerOff,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FrancePriceMap } from "@/features/fuel/components/france-price-map";
import { LiveStats } from "@/features/fuel/components/live-stats";
import { SiteFooter } from "@/shared/components/site-footer";
import { REPOSITORY_URL } from "@/shared/lib/site";
import styles from "./page.module.css";

type Highlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: Radio,
    title: "Données officielles",
    description:
      "Les prix viennent directement du service de l'État, mis à jour toutes les quelques minutes et validés avant affichage.",
  },
  {
    icon: ServerOff,
    title: "Zéro serveur",
    description:
      "Un site entièrement statique : les données sont lues depuis votre navigateur, sans backend ni abonnement.",
  },
  {
    icon: Accessibility,
    title: "Pensé pour tous",
    description:
      "Navigation au clavier, focus visible, contrastes soignés et une liste équivalente à la carte.",
  },
];

type Module = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string | null;
};

const MODULES: Module[] = [
  {
    icon: Fuel,
    title: "Carburants",
    description:
      "Trouvez la station la moins chère autour de vous et comparez les prix de la zone.",
    href: "/carburants/",
  },
  {
    icon: Dumbbell,
    title: "Équipements sportifs",
    description:
      "City-stades, gymnases, terrains : 334 000 équipements recensés par le ministère des Sports.",
    href: null,
  },
  {
    icon: ShieldAlert,
    title: "Risques",
    description:
      "Inondation, sols pollués, sites industriels : les risques connus près d'une adresse.",
    href: null,
  },
];

// Décale l'apparition de chaque élément du héros.
const revealDelay = (delayInMs: number): CSSProperties =>
  ({
    "--delay": `${delayInMs}ms`,
  }) as CSSProperties;

const HomePage = () => (
  <>
    <main id="contenu">
      <section className={styles.hero}>
        <div className={styles.aurora} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className={`${styles.badge} ${styles.reveal}`}>
              <span className={styles.badgeDot} aria-hidden="true" />
              Données ouvertes, mises à jour en continu
            </p>
            <h1
              className={`${styles.title} ${styles.reveal}`}
              style={revealDelay(80)}
            >
              Les données publiques, enfin utiles{" "}
              <span className={styles.titleAccent}>autour de vous</span>.
            </h1>
            <p
              className={`${styles.lead} ${styles.reveal}`}
              style={revealDelay(160)}
            >
              Comparez les prix des carburants sur une carte, station par
              station. D&apos;autres thèmes arrivent : équipements sportifs,
              risques, qualité de l&apos;eau.
            </p>
            <div
              className={`${styles.actions} ${styles.reveal}`}
              style={revealDelay(240)}
            >
              <Link className="button button--primary" href="/carburants/">
                Voir les prix des carburants
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a
                className="button button--secondary"
                href={REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Code source
                <ExternalLink size={16} aria-hidden="true" />
                <span className="visually-hidden"> (nouvel onglet)</span>
              </a>
            </div>
            <div className={styles.reveal} style={revealDelay(340)}>
              <LiveStats />
            </div>
          </div>
          <div
            className={`${styles.heroVisual} ${styles.reveal}`}
            style={revealDelay(200)}
          >
            <FrancePriceMap />
          </div>
        </div>
      </section>

      <section className="container" aria-labelledby="titre-modules">
        <h2 id="titre-modules" className={styles.sectionTitle}>
          Les thèmes
        </h2>
        <ul className={styles.modules}>
          {MODULES.map(({ icon: Icon, title, description, href }) => (
            <li key={title} className={styles.module}>
              <span className={styles.moduleIcon}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className={styles.moduleTitle}>
                {href === null ? (
                  title
                ) : (
                  <Link href={href} className={styles.moduleLink}>
                    {title}
                  </Link>
                )}
              </h3>
              <p className={styles.moduleText}>{description}</p>
              {href === null && <span className={styles.soon}>Bientôt</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="container" aria-labelledby="titre-coulisses">
        <h2 id="titre-coulisses" className={styles.sectionTitle}>
          Sous le capot
        </h2>
        <ul className={styles.highlights}>
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className={styles.highlight}>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
    <SiteFooter />
  </>
);

export default HomePage;
