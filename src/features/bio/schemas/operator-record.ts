import { z } from "zod";
import { distanceInKm } from "@/features/map/model/distance";
import type { LatLng } from "@/features/route/model/route";
import {
  formatPhone,
  toSafeWebUrl,
  type BioCertification,
  type BioOperator,
} from "../model/operator";

const namedItemSchema = z.object({ nom: z.string() });

const addressSchema = z.object({
  lieu: z.string().nullish(),
  codePostal: z.string().nullish(),
  ville: z.string().nullish(),
  lat: z.number().nullish(),
  long: z.number().nullish(),
  active: z.boolean().nullish(),
});

// Tolérant : l'API renvoie beaucoup de champs facultatifs. Un opérateur dont la
// forme est inattendue est écarté seul, sans faire échouer toute la liste.
const operatorRecordSchema = z.object({
  id: z.number(),
  raisonSociale: z.string().nullish(),
  denominationcourante: z.string().nullish(),
  telephoneNational: z.string().nullish(),
  telephoneCommerciale: z.string().nullish(),
  categories: z.array(namedItemSchema).nullish(),
  activites: z.array(namedItemSchema).nullish(),
  productions: z.array(namedItemSchema).nullish(),
  adressesOperateurs: z.array(addressSchema).nullish(),
  siteWebs: z
    .array(
      z.object({
        url: z.string(),
        active: z.boolean().nullish(),
        typeSiteWeb: z.object({ nom: z.string() }).nullish(),
      }),
    )
    .nullish(),
  certificats: z
    .array(
      z.object({
        organisme: z.string().nullish(),
        etatCertification: z.string().nullish(),
        url: z.string().nullish(),
      }),
    )
    .nullish(),
  venteAnnuaire: z
    .object({
      venteParticuliers: z.boolean().nullish(),
      venteProsGros: z.boolean().nullish(),
      venteProsDetail: z.boolean().nullish(),
      venteRestauCollective: z.boolean().nullish(),
      venteRestauCommerciale: z.boolean().nullish(),
    })
    .nullish(),
});

type OperatorRecord = z.infer<typeof operatorRecordSchema>;
type AddressRecord = z.infer<typeof addressSchema>;

// `nbTotal` arrive sous forme de chaîne.
export const operatorsResponseSchema = z.object({
  nbTotal: z.coerce.number(),
  items: z.array(z.unknown()),
});

const OFFICIAL_WEBSITE_TYPE = "Site Officiel";

const SALES_CHANNEL_LABELS = [
  ["venteParticuliers", "Particuliers"],
  ["venteProsGros", "Professionnels (gros)"],
  ["venteProsDetail", "Professionnels (détail)"],
  ["venteRestauCollective", "Restauration collective"],
  ["venteRestauCommerciale", "Restauration commerciale"],
] as const;

type LocatedAddress = AddressRecord & { lat: number; long: number };

const isLocated = (address: AddressRecord): address is LocatedAddress =>
  address.active !== false &&
  typeof address.lat === "number" &&
  typeof address.long === "number" &&
  Number.isFinite(address.lat) &&
  Number.isFinite(address.long);

const describeAddress = ({
  lieu,
  codePostal,
  ville,
}: AddressRecord): string => {
  const city = [codePostal, ville]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ");
  return [lieu?.trim(), city]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
};

// Un opérateur a souvent plusieurs adresses (siège, lieux de vente) : on garde
// celle qui est la plus proche du centre de la recherche.
const findNearestAddress = (
  addresses: readonly AddressRecord[],
  origin: LatLng,
): { address: LocatedAddress; distanceKm: number } | null => {
  let nearest: { address: LocatedAddress; distanceKm: number } | null = null;
  for (const address of addresses.filter(isLocated)) {
    const distanceKm = distanceInKm(origin, {
      lat: address.lat,
      lng: address.long,
    });
    if (nearest === null || distanceKm < nearest.distanceKm) {
      nearest = { address, distanceKm };
    }
  }
  return nearest;
};

const pickWebsite = (record: OperatorRecord): string | null => {
  const sites = (record.siteWebs ?? []).filter(
    ({ active }) => active !== false,
  );
  const official = sites.find(
    ({ typeSiteWeb }) => typeSiteWeb?.nom === OFFICIAL_WEBSITE_TYPE,
  );
  return official === undefined ? null : toSafeWebUrl(official.url);
};

const pickCertification = (record: OperatorRecord): BioCertification | null => {
  const certificate = record.certificats?.find(
    ({ organisme }) => organisme !== null && organisme !== undefined,
  );
  if (certificate?.organisme === undefined || certificate.organisme === null) {
    return null;
  }
  return {
    body: certificate.organisme,
    status: certificate.etatCertification ?? null,
    url:
      certificate.url === null || certificate.url === undefined
        ? null
        : toSafeWebUrl(certificate.url),
  };
};

const pickPhone = (record: OperatorRecord): string | null => {
  const phone = record.telephoneCommerciale ?? record.telephoneNational;
  return phone === null || phone === undefined || phone.trim() === ""
    ? null
    : formatPhone(phone);
};

const toOperator = (
  record: OperatorRecord,
  origin: LatLng,
): BioOperator | null => {
  const nearest = findNearestAddress(record.adressesOperateurs ?? [], origin);
  if (nearest === null) {
    return null;
  }

  const channels = record.venteAnnuaire;
  return {
    id: String(record.id),
    name:
      record.raisonSociale?.trim() ||
      record.denominationcourante?.trim() ||
      "Opérateur bio",
    categories: (record.categories ?? []).map(({ nom }) => nom),
    activities: (record.activites ?? []).map(({ nom }) => nom),
    address: describeAddress(nearest.address),
    position: { lat: nearest.address.lat, lng: nearest.address.long },
    distanceKm: nearest.distanceKm,
    products: (record.productions ?? []).map(({ nom }) => nom),
    certification: pickCertification(record),
    website: pickWebsite(record),
    phone: pickPhone(record),
    salesChannels:
      channels === null || channels === undefined
        ? []
        : SALES_CHANNEL_LABELS.filter(([key]) => channels[key] === true).map(
            ([, label]) => label,
          ),
  };
};

// Valide chaque opérateur séparément, puis les classe du plus proche au plus
// éloigné du centre de la recherche.
export const parseOperatorRecords = (
  records: readonly unknown[],
  origin: LatLng,
): BioOperator[] =>
  records
    .flatMap((record) => {
      const parsed = operatorRecordSchema.safeParse(record);
      if (!parsed.success) {
        return [];
      }
      const operator = toOperator(parsed.data, origin);
      return operator === null ? [] : [operator];
    })
    .sort((first, second) => first.distanceKm - second.distanceKm);
