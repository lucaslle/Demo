import {
  Accessibility,
  ArrowRight,
  ExternalLink,
  Radio,
  ServerOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FrancePriceMap } from "@/features/fuel/components/france-price-map";
import { LiveStats } from "@/features/fuel/components/live-stats";
import { ModuleDirectory } from "@/features/hub/components/module-directory";
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
      "Les données viennent directement des services de l'État, mises à jour en continu et validées avant affichage.",
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
      "Navigation au clavier, focus visible, contrastes soignés et une liste équivalente à chaque carte.",
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
              Carburants, bornes de recharge, entreprises, commerces bio, emploi
              : explorez les API ouvertes de l&apos;État sur une carte ou en
              graphiques, sans compte ni clé.
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

      <ModuleDirectory />

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
