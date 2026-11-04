import {
  formatDistance,
  getPrimaryKind,
  KIND_LABELS,
  type BioOperator,
} from "../model/operator";
import styles from "./bio-list.module.css";

type BioListProps = {
  operators: readonly BioOperator[];
  selectedOperatorId: string | null;
  onSelectOperator: (operatorId: string) => void;
};

const formatRank = (index: number): string =>
  String(index + 1).padStart(2, "0");

export const BioList = ({
  operators,
  selectedOperatorId,
  onSelectOperator,
}: BioListProps) => (
  <ol className={styles.list}>
    {operators.map((operator, index) => (
      <li key={operator.id}>
        <button
          type="button"
          className={styles.item}
          aria-current={operator.id === selectedOperatorId ? "true" : undefined}
          onClick={() => onSelectOperator(operator.id)}
        >
          <span className={styles.rank} aria-hidden="true">
            {formatRank(index)}
          </span>
          <span className={styles.body}>
            <span className={styles.top}>
              <span
                className={styles.kind}
                data-kind={getPrimaryKind(operator.activities)}
              >
                {KIND_LABELS[getPrimaryKind(operator.activities)]}
              </span>
              <span className={styles.distance}>
                {formatDistance(operator.distanceKm)}
              </span>
            </span>
            <span className={styles.name}>{operator.name}</span>
            <span className={styles.address}>{operator.address}</span>
          </span>
        </button>
      </li>
    ))}
  </ol>
);
