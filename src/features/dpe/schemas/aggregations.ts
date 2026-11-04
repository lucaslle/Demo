import { z } from "zod";
import {
  DPE_LABELS,
  isDpeLabel,
  sortPeriods,
  type LabelCount,
  type PeriodCount,
} from "../model/dpe";

const bucketSchema = z.object({
  total: z.number(),
  value: z.string(),
  metric: z.number().nullish(),
});

// Réponse de `values_agg` (data-fair) : un compte par valeur du champ, plus la
// moyenne demandée par `metric`.
export const valuesAggSchema = z.object({
  total: z.number(),
  aggs: z.array(z.unknown()),
});

// Réponse de `metric_agg` : la date est renvoyée sous forme de texte.
export const metricAggSchema = z.object({
  total: z.number(),
  metric: z.union([z.number(), z.string()]).nullish(),
});

type Bucket = z.infer<typeof bucketSchema>;

const parseBuckets = (rawBuckets: readonly unknown[]): Bucket[] =>
  rawBuckets.flatMap((rawBucket) => {
    const parsed = bucketSchema.safeParse(rawBucket);
    return parsed.success ? [parsed.data] : [];
  });

// Toujours sept étiquettes, de A à G : une étiquette absente vaut zéro.
export const parseLabelCounts = (
  rawBuckets: readonly unknown[],
): LabelCount[] => {
  const buckets = parseBuckets(rawBuckets);
  return DPE_LABELS.map((label) => ({
    label,
    count: buckets.find((bucket) => bucket.value === label)?.total ?? 0,
  }));
};

// Moyenne pondérée par le nombre de diagnostics de chaque étiquette.
export const parseAverageConsumption = (
  rawBuckets: readonly unknown[],
): number | null => {
  const withMetric = parseBuckets(rawBuckets).flatMap((bucket) =>
    isDpeLabel(bucket.value) &&
    bucket.total > 0 &&
    typeof bucket.metric === "number"
      ? [{ total: bucket.total, metric: bucket.metric }]
      : [],
  );
  const total = withMetric.reduce((sum, { total: count }) => sum + count, 0);
  if (total === 0) {
    return null;
  }
  return (
    withMetric.reduce(
      (sum, { total: count, metric }) => sum + count * metric,
      0,
    ) / total
  );
};

export const parsePeriodCounts = (
  rawBuckets: readonly unknown[],
): PeriodCount[] =>
  sortPeriods(
    parseBuckets(rawBuckets).map(({ value, total }) => ({
      period: value,
      count: total,
    })),
  );

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}/;

export const parseLastDate = (
  metric: z.infer<typeof metricAggSchema>["metric"],
): string | null =>
  typeof metric === "string" && DAY_PATTERN.test(metric)
    ? metric.slice(0, 10)
    : null;
