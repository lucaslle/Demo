import { describe, expect, it } from "vitest";
import {
  metricAggSchema,
  parseAverageConsumption,
  parseLabelCounts,
  parseLastDate,
  parsePeriodCounts,
  valuesAggSchema,
} from "./aggregations";

const buckets = [
  { total: 46453, value: "C", results: [], metric: 137 },
  { total: 1364, value: "A", results: [], metric: 57 },
  { total: 2102, value: "G", results: [], metric: 528 },
];

describe("parseLabelCounts", () => {
  it("renvoie toujours sept étiquettes de A à G, absentes à zéro", () => {
    const counts = parseLabelCounts(buckets);

    expect(counts.map(({ label }) => label)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
    expect(counts.find(({ label }) => label === "A")?.count).toBe(1364);
    expect(counts.find(({ label }) => label === "B")?.count).toBe(0);
  });

  it("ignore une valeur inconnue ou mal formée", () => {
    const counts = parseLabelCounts([
      { total: 5, value: "Z" },
      { value: "A" },
      "texte",
      { total: 7, value: "B" },
    ]);

    expect(counts.reduce((sum, { count }) => sum + count, 0)).toBe(7);
  });
});

describe("parseAverageConsumption", () => {
  it("pondère la moyenne par le nombre de diagnostics", () => {
    const average = parseAverageConsumption([
      { total: 1, value: "A", metric: 100 },
      { total: 3, value: "B", metric: 200 },
    ]);

    expect(average).toBeCloseTo(175, 10);
  });

  it("renvoie null sans moyenne exploitable", () => {
    expect(parseAverageConsumption([])).toBeNull();
    expect(
      parseAverageConsumption([{ total: 4, value: "A", metric: null }]),
    ).toBeNull();
  });
});

describe("parsePeriodCounts", () => {
  it("trie les périodes chronologiquement", () => {
    const periods = parsePeriodCounts([
      { total: 3, value: "2013-2021" },
      { total: 9, value: "avant 1948" },
    ]);

    expect(periods).toEqual([
      { period: "avant 1948", count: 9 },
      { period: "2013-2021", count: 3 },
    ]);
  });
});

describe("parseLastDate", () => {
  it("garde le jour d'une date valide", () => {
    expect(parseLastDate("2026-10-25")).toBe("2026-10-25");
    expect(parseLastDate("2026-10-25T10:00:00Z")).toBe("2026-10-25");
  });

  it("renvoie null pour une valeur absente ou invalide", () => {
    expect(parseLastDate(undefined)).toBeNull();
    expect(parseLastDate(42)).toBeNull();
    expect(parseLastDate("hier")).toBeNull();
  });
});

describe("schémas de réponse", () => {
  it("accepte les réponses de values_agg et metric_agg", () => {
    expect(valuesAggSchema.safeParse({ total: 1, aggs: [] }).success).toBe(
      true,
    );
    expect(
      metricAggSchema.safeParse({ total: 1, metric: "2026-10-25" }).success,
    ).toBe(true);
  });

  it("refuse une réponse sans total", () => {
    expect(valuesAggSchema.safeParse({ aggs: [] }).success).toBe(false);
  });
});
