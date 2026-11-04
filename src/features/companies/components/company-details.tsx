import { ExternalLink, MapPin } from "lucide-react";
import { forwardRef } from "react";
import { formatCompact } from "@/shared/lib/format";
import {
  buildOfficialCompanyUrl,
  buildOpenStreetMapUrl,
  describeCompanyCategory,
  describeEmployeeBracket,
  describeLegalForm,
  formatSiren,
  type Company,
} from "../model/company";
import styles from "./company-details.module.css";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "UTC",
});

const formatDate = (isoDate: string | null): string | null => {
  if (isoDate === null) {
    return null;
  }
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

const formatMoney = (amount: number | null): string =>
  amount === null ? "—" : `${formatCompact(amount)} €`;

type DetailRowProps = {
  label: string;
  children: string | null;
};

const DetailRow = ({ label, children }: DetailRowProps) =>
  children === null ? null : (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );

type CompanyDetailsProps = {
  company: Company;
};

// Fiche d'une entreprise. Le titre reçoit le focus à la sélection pour que les
// lecteurs d'écran annoncent le changement de contenu.
export const CompanyDetails = forwardRef<
  HTMLHeadingElement,
  CompanyDetailsProps
>(({ company }, headingRef) => {
  const officialUrl = buildOfficialCompanyUrl(company.siren);
  const legalForm = describeLegalForm(company.legalFormCode);
  const headquarters = company.headquarters;

  return (
    <article className={styles.card} aria-labelledby="titre-fiche-entreprise">
      <header className={styles.header}>
        <h2
          id="titre-fiche-entreprise"
          className={styles.title}
          tabIndex={-1}
          ref={headingRef}
        >
          {company.name}
        </h2>
        <p className={styles.status} data-active={company.isActive}>
          {company.isActive ? "En activité" : "Cessée"}
        </p>
      </header>

      <dl className={styles.list}>
        <DetailRow label="SIREN">{formatSiren(company.siren)}</DetailRow>
        <DetailRow label="Forme juridique">{legalForm}</DetailRow>
        <DetailRow label="Création">{formatDate(company.createdAt)}</DetailRow>
        <DetailRow label="Activité (code NAF)">
          {company.activityCode}
        </DetailRow>
        <DetailRow label="Effectif">
          {describeEmployeeBracket(company.employeeBracketCode)}
        </DetailRow>
        <DetailRow label="Catégorie">
          {describeCompanyCategory(company.category)}
        </DetailRow>
        <DetailRow label="Établissements">
          {`${company.openEstablishmentCount} ouvert${company.openEstablishmentCount > 1 ? "s" : ""} sur ${company.establishmentCount}`}
        </DetailRow>
      </dl>

      {headquarters !== null && headquarters.address !== null && (
        <section className={styles.section} aria-labelledby="titre-siege">
          <h3 id="titre-siege" className={styles.sectionTitle}>
            Siège
          </h3>
          <p>{headquarters.address}</p>
          {headquarters.position !== null && (
            <a
              href={buildOpenStreetMapUrl(headquarters.position)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <MapPin size={14} aria-hidden="true" />
              Voir sur la carte
              <span className="visually-hidden"> (nouvel onglet)</span>
            </a>
          )}
        </section>
      )}

      {company.finances !== null && (
        <section className={styles.section} aria-labelledby="titre-comptes">
          <h3 id="titre-comptes" className={styles.sectionTitle}>
            Comptes {company.finances.year}
          </h3>
          <dl className={styles.finances}>
            <div>
              <dt>Chiffre d&apos;affaires</dt>
              <dd>{formatMoney(company.finances.revenue)}</dd>
            </div>
            <div>
              <dt>Résultat net</dt>
              <dd
                data-negative={
                  company.finances.netIncome !== null &&
                  company.finances.netIncome < 0
                }
              >
                {formatMoney(company.finances.netIncome)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {company.directors.length > 0 && (
        <section className={styles.section} aria-labelledby="titre-dirigeants">
          <h3 id="titre-dirigeants" className={styles.sectionTitle}>
            Dirigeants
          </h3>
          <ul className={styles.directors}>
            {company.directors.slice(0, 8).map((director, index) => (
              <li key={`${director.name}-${index}`}>
                <strong>{director.name}</strong>
                {director.role !== null && <span>{director.role}</span>}
              </li>
            ))}
          </ul>
          {company.directors.length > 8 && (
            <p className={styles.muted}>
              et {company.directors.length - 8} autre
              {company.directors.length - 8 > 1 ? "s" : ""} sur la fiche
              officielle.
            </p>
          )}
        </section>
      )}

      {officialUrl !== null && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.official}
        >
          Fiche officielle sur l&apos;Annuaire des entreprises
          <ExternalLink size={14} aria-hidden="true" />
          <span className="visually-hidden"> (nouvel onglet)</span>
        </a>
      )}
    </article>
  );
});

CompanyDetails.displayName = "CompanyDetails";
