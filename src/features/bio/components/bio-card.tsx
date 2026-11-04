import { ExternalLink, Globe, Phone, ShieldCheck, X } from "lucide-react";
import { RoutePanel } from "@/features/route/components/route-panel";
import type { RouteState } from "@/features/route/model/route-state";
import {
  buildPhoneHref,
  describeCertificationStatus,
  formatDistance,
  getPrimaryKind,
  KIND_LABELS,
  type BioOperator,
} from "../model/operator";
import styles from "./bio-card.module.css";

const MAX_PRODUCTS_SHOWN = 5;

type BioCardProps = {
  operator: BioOperator;
  routeState: RouteState;
  onRetryLocate: () => void;
  onClose: () => void;
};

// Fiche de l'opérateur choisi : rôle, certification, produits, contact et
// itinéraire depuis la position de l'utilisateur.
export const BioCard = ({
  operator,
  routeState,
  onRetryLocate,
  onClose,
}: BioCardProps) => {
  const certification = operator.certification;
  const certificationStatus = describeCertificationStatus(
    certification?.status ?? null,
  );
  const phoneHref =
    operator.phone === null ? null : buildPhoneHref(operator.phone);
  const hiddenProductCount = operator.products.length - MAX_PRODUCTS_SHOWN;

  return (
    <section className={styles.card} aria-label="Opérateur bio choisi">
      <div className={styles.header}>
        <p className={styles.eyebrow}>
          {KIND_LABELS[getPrimaryKind(operator.activities)]}
        </p>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fermer la fiche de l'opérateur"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <p className={styles.name}>{operator.name}</p>
      <p className={styles.address}>{operator.address}</p>
      <p className={styles.meta}>
        À {formatDistance(operator.distanceKm)} du centre de la carte
      </p>

      {(operator.activities.length > 0 || operator.categories.length > 0) && (
        <ul className={styles.tags} aria-label="Activités">
          {[...operator.activities, ...operator.categories].map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      {certification !== null && (
        <p className={styles.meta}>
          <ShieldCheck size={14} aria-hidden="true" />
          {certificationStatus === null
            ? `Certifié par ${certification.body}`
            : `${certificationStatus} · ${certification.body}`}
          {certification.url !== null && (
            <a
              href={certification.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.inlineLink}
            >
              Certificat
              <ExternalLink size={12} aria-hidden="true" />
              <span className="visually-hidden"> (nouvel onglet)</span>
            </a>
          )}
        </p>
      )}

      {operator.products.length > 0 && (
        <div className={styles.block}>
          <p className={styles.blockTitle}>Produits bio</p>
          <ul className={styles.products}>
            {operator.products.slice(0, MAX_PRODUCTS_SHOWN).map((product) => (
              <li key={product}>{product}</li>
            ))}
          </ul>
          {hiddenProductCount > 0 && (
            <p className={styles.meta}>
              et {hiddenProductCount} autre{hiddenProductCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {operator.salesChannels.length > 0 && (
        <p className={styles.meta}>
          Vente : {operator.salesChannels.join(", ")}
        </p>
      )}

      {(operator.website !== null || operator.phone !== null) && (
        <div className={styles.contacts}>
          {operator.website !== null && (
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <Globe size={14} aria-hidden="true" />
              Site web
              <span className="visually-hidden"> (nouvel onglet)</span>
            </a>
          )}
          {operator.phone !== null &&
            (phoneHref === null ? (
              <span className={styles.meta}>
                <Phone size={14} aria-hidden="true" />
                {operator.phone}
              </span>
            ) : (
              <a href={phoneHref} className={styles.link}>
                <Phone size={14} aria-hidden="true" />
                {operator.phone}
              </a>
            ))}
        </div>
      )}

      <RoutePanel state={routeState} onRetryLocate={onRetryLocate} />
    </section>
  );
};
