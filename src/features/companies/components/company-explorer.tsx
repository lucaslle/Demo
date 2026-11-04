"use client";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { describeApiError } from "@/shared/api/describe-api-error";
import { StatusMessage } from "@/shared/components/status-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { formatInteger } from "@/shared/lib/format";
import {
  describeEmployeeBracket,
  formatSiren,
  MIN_QUERY_LENGTH,
  type Company,
} from "../model/company";
import {
  useCompanyBySiren,
  useCompanySearch,
  useCompanyUrlState,
} from "../hooks/use-companies";
import { CompanyDetails } from "./company-details";
import styles from "./company-explorer.module.css";

const SEARCH_DEBOUNCE_IN_MS = 400;
const EXAMPLE_QUERIES = ["danone", "boulangerie paris", "552032534"];

export const CompanyExplorer = () => {
  const searchInputId = useId();
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null);
  const { initialState, writeState } = useCompanyUrlState();
  const [queryInput, setQueryInput] = useState(initialState.query);
  const [onlyActive, setOnlyActive] = useState(initialState.onlyActive);
  const [page, setPage] = useState(initialState.page);
  const [selectedSiren, setSelectedSiren] = useState(initialState.siren);
  const debouncedQuery = useDebouncedValue(queryInput, SEARCH_DEBOUNCE_IN_MS);

  const searchQuery = useCompanySearch({
    query: debouncedQuery,
    onlyActive,
    page,
  });
  const companies = useMemo(
    () => searchQuery.data?.companies ?? [],
    [searchQuery.data],
  );

  // La fiche vient de la liste quand elle y figure ; sinon (lien partagé,
  // rechargement) on la demande par son SIREN.
  const selectedFromList = companies.find(
    ({ siren }) => siren === selectedSiren,
  );
  const selectedByLookup = useCompanyBySiren(
    selectedFromList === undefined ? selectedSiren : null,
  );
  const selectedCompany: Company | undefined =
    selectedFromList ?? selectedByLookup.data ?? undefined;

  useEffect(() => {
    writeState({
      query: debouncedQuery,
      onlyActive,
      page,
      siren: selectedSiren,
    });
  }, [debouncedQuery, onlyActive, page, selectedSiren, writeState]);

  const handleQueryChange = (nextQuery: string) => {
    setQueryInput(nextQuery);
    setPage(1);
  };

  const handleSelect = (siren: string) => {
    setSelectedSiren(siren);
    // Le titre de la fiche prend le focus une fois affiché.
    requestAnimationFrame(() => detailsHeadingRef.current?.focus());
  };

  const isTooShort = queryInput.trim().length < MIN_QUERY_LENGTH;
  const totalResults = searchQuery.data?.totalResults ?? 0;
  const totalPages = searchQuery.data?.totalPages ?? 0;

  const resultsSummary = isTooShort
    ? ""
    : searchQuery.isPending
      ? "Recherche en cours…"
      : searchQuery.isError
        ? ""
        : totalResults === 0
          ? "Aucune entreprise trouvée."
          : `${formatInteger(totalResults)} entreprise${totalResults > 1 ? "s" : ""} trouvée${totalResults > 1 ? "s" : ""}, page ${page} sur ${totalPages}.`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Recherche d&apos;entreprises</h1>
        <p className={styles.lead}>
          Infos légales, dirigeants, effectifs et établissements des entreprises
          françaises, à partir de l&apos;API officielle de l&apos;État.
        </p>
      </header>

      <form
        className={styles.search}
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.searchField}>
          <label htmlFor={searchInputId}>Nom, SIREN ou SIRET</label>
          <div className={styles.inputWrap}>
            <Search size={18} aria-hidden="true" />
            <input
              id={searchInputId}
              type="search"
              value={queryInput}
              placeholder="Ex. danone, boulangerie paris, 552032534"
              onChange={(event) => handleQueryChange(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(event) => {
              setOnlyActive(event.target.checked);
              setPage(1);
            }}
          />
          Entreprises en activité uniquement
        </label>
      </form>

      <div className={styles.grid}>
        <section className={styles.results} aria-labelledby="titre-resultats">
          <h2 id="titre-resultats" className={styles.resultsTitle}>
            Résultats
          </h2>
          <p className={styles.summary} role="status" aria-live="polite">
            {resultsSummary}
          </p>

          {isTooShort ? (
            <StatusMessage
              variant="info"
              icon={Search}
              title="Saisissez au moins 3 caractères"
              action={
                <div className={styles.examples}>
                  {EXAMPLE_QUERIES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="button button--secondary"
                      onClick={() => handleQueryChange(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              }
            >
              Essayez un exemple, ou cherchez par nom, SIREN ou SIRET.
            </StatusMessage>
          ) : searchQuery.isError && searchQuery.data === undefined ? (
            <StatusMessage
              variant="error"
              icon={TriangleAlert}
              title="Recherche impossible"
              action={
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    void searchQuery.refetch();
                  }}
                >
                  Réessayer
                </button>
              }
            >
              {describeApiError(searchQuery.error)}
            </StatusMessage>
          ) : searchQuery.isPending ? (
            <div className={styles.skeleton} aria-hidden="true" />
          ) : companies.length === 0 ? (
            <StatusMessage
              variant="empty"
              icon={SearchX}
              title="Aucune entreprise trouvée"
            >
              Vérifiez l&apos;orthographe, ou décochez « en activité uniquement
              » pour inclure les entreprises cessées.
            </StatusMessage>
          ) : (
            <>
              <ol
                className={styles.list}
                data-refreshing={searchQuery.isPlaceholderData || undefined}
              >
                {companies.map((company) => (
                  <li key={company.siren}>
                    <button
                      type="button"
                      className={styles.item}
                      aria-current={
                        company.siren === selectedSiren ? "true" : undefined
                      }
                      onClick={() => handleSelect(company.siren)}
                    >
                      <span className={styles.name}>{company.name}</span>
                      <span className={styles.meta}>
                        SIREN {formatSiren(company.siren)}
                        {company.headquarters?.city
                          ? ` · ${company.headquarters.city}`
                          : ""}
                      </span>
                      <span className={styles.tags}>
                        <span
                          className={styles.tag}
                          data-active={company.isActive}
                        >
                          {company.isActive ? "En activité" : "Cessée"}
                        </span>
                        <span className={styles.tag}>
                          {describeEmployeeBracket(company.employeeBracketCode)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <nav className={styles.pagination} aria-label="Pagination">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Précédent
                </button>
                <span className={styles.pageInfo}>
                  Page {page} sur {totalPages}
                </span>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </nav>
            </>
          )}
        </section>

        <div className={styles.details}>
          {selectedCompany !== undefined ? (
            <CompanyDetails company={selectedCompany} ref={detailsHeadingRef} />
          ) : selectedSiren !== null && selectedByLookup.isPending ? (
            <StatusMessage
              variant="info"
              icon={Search}
              title="Chargement de la fiche…"
            />
          ) : selectedSiren !== null ? (
            <StatusMessage
              variant="empty"
              icon={SearchX}
              title="Entreprise introuvable"
            >
              Aucune fiche ne correspond à ce SIREN.
            </StatusMessage>
          ) : (
            <StatusMessage
              variant="empty"
              icon={Search}
              title="Choisissez une entreprise"
            >
              Sa fiche s&apos;affichera ici : dirigeants, comptes,
              établissements.
            </StatusMessage>
          )}
        </div>
      </div>
    </div>
  );
};
