"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  findModuleByPathname,
  getModulesByCategory,
  isAvailable,
} from "../model/modules";
import styles from "./modules-menu.module.css";

// Menu de navigation entre les modules, construit depuis le registre. Schéma
// « disclosure » : un bouton qui déplie un panneau de liens, fermé par Échap,
// par un clic à l'extérieur ou par un changement de page.
export const ModulesMenu = () => {
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Le menu est ouvert « pour une page » : il se referme tout seul dès qu'on
  // navigue, sans effet de bord.
  const [openForPathname, setOpenForPathname] = useState<string | null>(null);
  const isOpen = openForPathname === pathname;
  const currentModule = findModuleByPathname(pathname);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenForPathname(null);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        containerRef.current?.contains(event.target) !== true
      ) {
        setOpenForPathname(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpenForPathname(isOpen ? null : pathname)}
      >
        <LayoutGrid size={18} aria-hidden="true" />
        <span className={styles.label}>
          {currentModule?.title ?? "Modules"}
        </span>
        <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
      </button>

      <nav
        id={panelId}
        className={styles.panel}
        aria-label="Modules"
        hidden={!isOpen}
      >
        <div className={styles.columns}>
          {getModulesByCategory().map(({ category, modules }) => (
            <section key={category.id} className={styles.category}>
              <h2 className={styles.categoryTitle}>
                <category.icon size={16} aria-hidden="true" />
                {category.title}
              </h2>
              <ul className={styles.list}>
                {modules.map((appModule) => (
                  <li key={appModule.id}>
                    {isAvailable(appModule) && appModule.href !== null ? (
                      <Link
                        href={appModule.href}
                        className={styles.link}
                        aria-current={
                          appModule.id === currentModule?.id
                            ? "page"
                            : undefined
                        }
                      >
                        <appModule.icon size={18} aria-hidden="true" />
                        <span>{appModule.title}</span>
                      </Link>
                    ) : (
                      <span className={styles.soon}>
                        <appModule.icon size={18} aria-hidden="true" />
                        <span>{appModule.title}</span>
                        <span className={styles.soonBadge}>Bientôt</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Link href="/" className={styles.home}>
          Retour à l&apos;accueil
        </Link>
      </nav>
    </div>
  );
};
