import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { REPOSITORY_URL, SITE_NAME } from "../lib/site";
import { BrandLogo } from "./brand-logo";
import { NavLink } from "./nav-link";
import styles from "./site-header.module.css";
import { ThemeToggle } from "./theme-toggle";

export const SiteHeader = () => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <Link href="/" className={styles.brand}>
        <BrandLogo />
        <span>{SITE_NAME}</span>
      </Link>

      <nav aria-label="Navigation principale" className={styles.nav}>
        <NavLink href="/carburants/">Carburants</NavLink>
        <a
          className={`${styles.navLink} ${styles.hideOnMobile}`}
          href={REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Code source
          <ExternalLink size={14} aria-hidden="true" />
          <span className="visually-hidden"> (nouvel onglet)</span>
        </a>
        <ThemeToggle />
      </nav>
    </div>
  </header>
);
