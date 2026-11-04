"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { StatusMessage } from "@/shared/components/status-message";
import {
  getModulesByCategory,
  isAvailable,
  searchModules,
  type AppModule,
} from "../model/modules";
import styles from "./module-directory.module.css";

type ModuleCardProps = {
  appModule: AppModule;
};

const ModuleCard = ({ appModule }: ModuleCardProps) => {
  const Icon = appModule.icon;

  return (
    <li className={styles.card} data-available={isAvailable(appModule)}>
      <span className={styles.icon}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <h4 className={styles.cardTitle}>
        {appModule.href === null ? (
          appModule.title
        ) : (
          <Link href={appModule.href} className={styles.cardLink}>
            {appModule.title}
          </Link>
        )}
      </h4>
      <p className={styles.cardText}>{appModule.description}</p>
      <p className={styles.meta}>
        <span className={styles.source}>{appModule.source}</span>
        {appModule.href === null ? (
          <span className={styles.badge}>Bientôt</span>
        ) : (
          <span className={styles.badge}>
            {appModule.requiresApiKey ? "Clé API requise" : "Sans clé API"}
          </span>
        )}
      </p>
    </li>
  );
};

export const ModuleDirectory = () => {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchModules(query), [query]);
  const groups = getModulesByCategory(results);

  return (
    <section className="container" aria-labelledby="titre-modules">
      <div className={styles.header}>
        <h2 id="titre-modules" className={styles.title}>
          Explorer les données
        </h2>
        <div className={styles.search}>
          <label htmlFor={searchId} className="visually-hidden">
            Rechercher un module
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Rechercher : bio, siren, borne…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <p className="visually-hidden" role="status">
        {results.length === 0
          ? "Aucun module trouvé"
          : `${results.length} module${results.length > 1 ? "s" : ""} affiché${results.length > 1 ? "s" : ""}`}
      </p>

      {groups.length === 0 ? (
        <StatusMessage
          variant="empty"
          icon={SearchX}
          title="Aucun module ne correspond"
        >
          Essayez un autre mot, par exemple « carburant », « entreprise » ou «
          emploi ».
        </StatusMessage>
      ) : (
        groups.map(({ category, modules }) => (
          <div key={category.id} className={styles.category}>
            <h3 className={styles.categoryTitle}>
              <category.icon size={18} aria-hidden="true" />
              {category.title}
            </h3>
            <p className={styles.categoryText}>{category.description}</p>
            <ul className={styles.grid}>
              {modules.map((appModule) => (
                <ModuleCard key={appModule.id} appModule={appModule} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
};
