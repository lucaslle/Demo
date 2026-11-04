import { formatPrice } from "@/shared/lib/format";
import { useStationTariffs } from "../hooks/use-station-tariffs";
import styles from "./tariff-info.module.css";

const MAX_INLINE_TEXT_LENGTH = 140;
const LINK_PATTERN = /^https?:\/\/\S+$/i;

type TariffInfoProps = {
  stationId: string;
};

// Le tarif est saisi librement par l'opérateur : on affiche le prix au kWh quand
// il est lisible, le texte quand il est court, et sinon on renvoie vers
// l'opérateur plutôt que d'inventer un prix.
export const TariffInfo = ({ stationId }: TariffInfoProps) => {
  const { data, isPending, isError } = useStationTariffs(stationId);

  if (isPending) {
    return <p className={styles.muted}>Recherche du tarif…</p>;
  }
  if (isError) {
    return <p className={styles.muted}>Tarif momentanément indisponible.</p>;
  }

  const [first] = data;
  if (first === undefined) {
    return (
      <p className={styles.muted}>
        Tarif non communiqué : consultez l&apos;application de l&apos;opérateur.
      </p>
    );
  }

  const pricePerKwh = data
    .map((tariff) => tariff.pricePerKwh)
    .find((price) => price !== null);
  if (pricePerKwh !== undefined && pricePerKwh !== null) {
    return (
      <p className={styles.tariff}>
        <span className={styles.label}>Tarif affiché</span>
        <strong>{formatPrice(pricePerKwh)}/kWh</strong>
      </p>
    );
  }

  // Seuls les liens http(s) sont rendus cliquables : le champ est saisi librement.
  const link = data
    .map(({ text }) => text.trim())
    .find((text) => LINK_PATTERN.test(text));
  if (link !== undefined) {
    return (
      <p className={styles.muted}>
        <a href={link} target="_blank" rel="noopener noreferrer">
          Voir les tarifs de l&apos;opérateur
          <span className="visually-hidden"> (nouvel onglet)</span>
        </a>
      </p>
    );
  }

  const isShortText = first.text.length <= MAX_INLINE_TEXT_LENGTH;
  return (
    <p className={styles.muted}>
      {isShortText
        ? `Tarif : ${first.text}`
        : "Tarif détaillé disponible auprès de l'opérateur."}
    </p>
  );
};
