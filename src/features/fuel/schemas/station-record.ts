import { z } from "zod";
import { FUEL_TYPES, type FuelType } from "../model/fuel-types";
import type { FuelPrice, Station } from "../model/station";
import { normalizeParisTimestamp } from "./paris-timestamp";

const nullableNumber = z.number().nullable();
const nullableText = z.string().nullable();

// Champs du jeu « prix-des-carburants-en-france-flux-instantane-v2 » utilisés
// par l'application. Les champs `select` de la requête en sont déduits.
export const stationRecordSchema = z.object({
  id: z.number(),
  geom: z.object({ lon: z.number(), lat: z.number() }),
  adresse: nullableText,
  ville: nullableText,
  cp: nullableText,
  gazole_prix: nullableNumber,
  gazole_maj: nullableText,
  e10_prix: nullableNumber,
  e10_maj: nullableText,
  sp98_prix: nullableNumber,
  sp98_maj: nullableText,
  sp95_prix: nullableNumber,
  sp95_maj: nullableText,
  e85_prix: nullableNumber,
  e85_maj: nullableText,
  gplc_prix: nullableNumber,
  gplc_maj: nullableText,
});

export const STATION_SELECT_FIELDS = Object.keys(
  stationRecordSchema.shape,
).join(",");

type StationRecord = z.infer<typeof stationRecordSchema>;

const readFuelPrice = (
  record: StationRecord,
  fuel: FuelType,
): FuelPrice | undefined => {
  const amount = record[`${fuel}_prix`];
  if (amount === null) {
    return undefined;
  }
  return {
    amount,
    updatedAt: normalizeParisTimestamp(record[`${fuel}_maj`]),
  };
};

const toStation = (record: StationRecord): Station => {
  const prices: Station["prices"] = {};
  for (const fuel of FUEL_TYPES) {
    const price = readFuelPrice(record, fuel);
    if (price !== undefined) {
      prices[fuel] = price;
    }
  }

  return {
    id: record.id,
    position: { lat: record.geom.lat, lng: record.geom.lon },
    address: record.adresse ?? "Adresse inconnue",
    postalCode: record.cp ?? "",
    city: record.ville ?? "",
    prices,
  };
};

export type ParsedStations = {
  stations: Station[];
  rejectedCount: number;
};

// Chaque enregistrement est validé séparément : une station mal formée est
// écartée sans empêcher l'affichage des autres.
export const parseStationRecords = (
  rawRecords: readonly unknown[],
): ParsedStations => {
  const stations: Station[] = [];
  let rejectedCount = 0;

  for (const rawRecord of rawRecords) {
    const parsed = stationRecordSchema.safeParse(rawRecord);
    if (parsed.success) {
      stations.push(toStation(parsed.data));
    } else {
      rejectedCount += 1;
    }
  }

  return { stations, rejectedCount };
};
