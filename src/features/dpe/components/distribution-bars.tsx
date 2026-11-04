import { formatInteger } from "@/shared/lib/format";
import { formatShare } from "../model/dpe";
import styles from "./distribution-bars.module.css";

export type DistributionItem = {
  key: string;
  label: string;
  count: number;
  // Couleur de fond et de texte de la barre : pour les étiquettes DPE.
  color?: { background: string; text: string };
};

type DistributionBarsProps = {
  ariaLabel: string;
  items: readonly DistributionItem[];
  unit: string;
};

// Barres horizontales proportionnelles à la part de chaque valeur. La valeur est
// toujours écrite en toutes lettres : la couleur n'est jamais seule porteuse du sens.
export const DistributionBars = ({
  ariaLabel,
  items,
  unit,
}: DistributionBarsProps) => {
  const total = items.reduce((sum, { count }) => sum + count, 0);
  const largest = Math.max(0, ...items.map(({ count }) => count));

  return (
    <ul className={styles.list} aria-label={ariaLabel}>
      {items.map(({ key, label, count, color }) => {
        const share = total === 0 ? 0 : (count / total) * 100;
        const barWidth = largest === 0 ? 0 : (count / largest) * 100;
        return (
          <li key={key} className={styles.row}>
            {color === undefined && (
              <span className={styles.name}>{label}</span>
            )}
            <span className={styles.track}>
              <span
                className={styles.fill}
                data-colored={color !== undefined || undefined}
                style={{
                  width: `max(${color === undefined ? "0.25rem" : "2.25rem"}, ${barWidth}%)`,
                  ...(color === undefined
                    ? {}
                    : { background: color.background, color: color.text }),
                }}
              >
                {color !== undefined && label}
              </span>
            </span>
            <span className={styles.value}>
              {formatInteger(count)} {unit} · {formatShare(share)}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
