import styles from "./hero-preview.module.css";

type PreviewPill = {
  label: string;
  tier: "cheapest" | "low" | "medium" | "high";
  position: { top: string; left: string };
  delay: string;
};

const PILLS: PreviewPill[] = [
  {
    label: "1,849 €",
    tier: "cheapest",
    position: { top: "52%", left: "34%" },
    delay: "0s",
  },
  {
    label: "1,879 €",
    tier: "low",
    position: { top: "26%", left: "58%" },
    delay: "0.6s",
  },
  {
    label: "1,919 €",
    tier: "medium",
    position: { top: "68%", left: "66%" },
    delay: "1.2s",
  },
  {
    label: "1,969 €",
    tier: "high",
    position: { top: "30%", left: "18%" },
    delay: "1.8s",
  },
  {
    label: "1,899 €",
    tier: "low",
    position: { top: "78%", left: "20%" },
    delay: "2.4s",
  },
];

// Aperçu purement décoratif de l'interface : masqué aux lecteurs d'écran.
export const HeroPreview = () => (
  <div className={styles.preview} aria-hidden="true">
    <div className={styles.grid} />
    <div className={styles.river} />
    {PILLS.map(({ label, tier, position, delay }) => (
      <span
        key={label}
        className={`${styles.pill} ${styles[tier]}`}
        style={{ ...position, animationDelay: delay }}
      >
        {tier === "cheapest" && "★ "}
        {label}
      </span>
    ))}
  </div>
);
