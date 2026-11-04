import { formatRelativeTime, isStaleDate } from "@/shared/lib/format";

type PriceFreshnessProps = {
  updatedAt: string | null;
  now: Date;
};

export const PriceFreshness = ({ updatedAt, now }: PriceFreshnessProps) => {
  if (updatedAt === null) {
    return <span>Date de mise à jour inconnue</span>;
  }

  const isStale = isStaleDate(updatedAt, now);

  return (
    <span>
      Mis à jour {formatRelativeTime(updatedAt, now)}
      {isStale && <strong> · prix ancien</strong>}
    </span>
  );
};
