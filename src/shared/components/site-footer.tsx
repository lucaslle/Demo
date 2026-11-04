import { REPOSITORY_URL, SITE_NAME } from "../lib/site";
import styles from "./site-footer.module.css";

export const SiteFooter = () => (
  <footer className={styles.footer}>
    <div className={`container ${styles.inner}`}>
      <p>
        <strong>{SITE_NAME}</strong> — projet de démonstration construit sur les
        données ouvertes de l&apos;État.
      </p>
      <p className={styles.sources}>
        Sources : prix-carburants.gouv.fr (via data.economie.gouv.fr) pour les
        prix, IGN (Géoplateforme) pour le fond de carte. Données sous Licence
        Ouverte 2.0.{" "}
        <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
          Code source sur GitHub
          <span className="visually-hidden"> (nouvel onglet)</span>
        </a>
      </p>
    </div>
  </footer>
);
