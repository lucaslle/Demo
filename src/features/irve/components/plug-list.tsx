import { PLUG_LABELS, type PlugType } from "../model/charging-station";
import styles from "./plug-list.module.css";

type PlugListProps = {
  plugs: readonly PlugType[];
};

export const PlugList = ({ plugs }: PlugListProps) =>
  plugs.length === 0 ? (
    <p className={styles.unknown}>Prises non renseignées</p>
  ) : (
    <ul className={styles.list} aria-label="Types de prises">
      {plugs.map((plug) => (
        <li key={plug} className={styles.plug}>
          {PLUG_LABELS[plug]}
        </li>
      ))}
    </ul>
  );
