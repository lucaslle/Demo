import styles from "./list-skeleton.module.css";

const SKELETON_ROW_COUNT = 5;

// Emplacement visuel pendant le chargement ; l'annonce vocale est portée par
// la région live du panneau.
export const ListSkeleton = () => (
  <ul className={styles.list} aria-hidden="true">
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
      <li key={rowIndex} className={styles.row}>
        <span className={styles.circle} />
        <span className={styles.lines}>
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.short}`} />
        </span>
      </li>
    ))}
  </ul>
);
