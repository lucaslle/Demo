import { z } from "zod";
import { FUEL_TYPES, type FuelType } from "../model/fuel-types";
import { normalizeParisTimestamp } from "./paris-timestamp";

const nullableNumber = z.number().nullable();

export const departmentRecordSchema = z.object({
  code_departement: z.string().nullable(),
  stations: z.number(),
  gazole: nullableNumber,
  e10: nullableNumber,
  sp98: nullableNumber,
  sp95: nullableNumber,
  e85: nullableNumber,
  gplc: nullableNumber,
  n_gazole: z.number(),
  n_e10: z.number(),
  n_sp98: z.number(),
  n_sp95: z.number(),
  n_e85: z.number(),
  n_gplc: z.number(),
  last_update: z.string().nullable(),
});

type DepartmentRecord = z.infer<typeof departmentRecordSchema>;

// Une seule requête agrégée : prix moyen et nombre de stations par carburant,
// pour chaque département.
export const DEPARTMENT_SELECT = [
  "code_departement",
  "count(*) as stations",
  ...FUEL_TYPES.flatMap((fuel) => [
    `avg(${fuel}_prix) as ${fuel}`,
    `count(${fuel}_prix) as n_${fuel}`,
  ]),
  "max(e10_maj) as last_update",
].join(",");

export type FuelAverage = {
  average: number;
  stationCount: number;
};

export type DepartmentPrice = {
  code: string;
  stationCount: number;
  averages: Partial<Record<FuelType, FuelAverage>>;
};

export type DepartmentPrices = {
  departments: DepartmentPrice[];
  totalStations: number;
  nationalAverages: Partial<Record<FuelType, number>>;
  lastUpdatedAt: string | null;
};

const readAverages = (
  record: DepartmentRecord,
): DepartmentPrice["averages"] => {
  const averages: DepartmentPrice["averages"] = {};
  for (const fuel of FUEL_TYPES) {
    const average = record[fuel];
    const stationCount = record[`n_${fuel}`];
    if (average !== null && stationCount > 0) {
      averages[fuel] = { average, stationCount };
    }
  }
  return averages;
};

const computeNationalAverages = (
  records: readonly DepartmentRecord[],
): DepartmentPrices["nationalAverages"] => {
  const nationalAverages: DepartmentPrices["nationalAverages"] = {};
  for (const fuel of FUEL_TYPES) {
    let weightedTotal = 0;
    let stationCount = 0;
    for (const record of records) {
      const average = record[fuel];
      if (average !== null) {
        const count = record[`n_${fuel}`];
        weightedTotal += average * count;
        stationCount += count;
      }
    }
    if (stationCount > 0) {
      nationalAverages[fuel] = weightedTotal / stationCount;
    }
  }
  return nationalAverages;
};

const findLatestUpdate = (
  records: readonly DepartmentRecord[],
): string | null =>
  records
    .map(({ last_update }) => normalizeParisTimestamp(last_update))
    .reduce<string | null>(
      (latest, current) =>
        current !== null && (latest === null || current > latest)
          ? current
          : latest,
      null,
    );

// Les groupes mal formés sont écartés ; les stations sans département connu
// comptent dans les moyennes nationales mais pas dans la carte.
export const parseDepartmentRecords = (
  rawRecords: readonly unknown[],
): DepartmentPrices => {
  const records = rawRecords.flatMap((rawRecord) => {
    const parsed = departmentRecordSchema.safeParse(rawRecord);
    return parsed.success ? [parsed.data] : [];
  });

  const departments = records.flatMap((record) =>
    record.code_departement === null
      ? []
      : [
          {
            code: record.code_departement,
            stationCount: record.stations,
            averages: readAverages(record),
          },
        ],
  );

  return {
    departments,
    totalStations: records.reduce(
      (total, record) => total + record.stations,
      0,
    ),
    nationalAverages: computeNationalAverages(records),
    lastUpdatedAt: findLatestUpdate(records),
  };
};
