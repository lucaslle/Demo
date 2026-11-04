import { z } from "zod";
import {
  formatPersonName,
  type Company,
  type CompanyFinances,
  type Director,
} from "../model/company";

const text = z.string().nullish();

const directorSchema = z.object({
  nom: text,
  prenoms: text,
  denomination: text,
  qualite: text,
  type_dirigeant: text,
});

const headquartersSchema = z.object({
  siret: text,
  adresse: text,
  code_postal: text,
  libelle_commune: text,
  latitude: text,
  longitude: text,
});

// Résultat de l'API Recherche d'entreprises : seuls les champs utilisés sont lus.
export const companyRecordSchema = z.object({
  siren: z.string(),
  nom_complet: text,
  nom_raison_sociale: text,
  nature_juridique: text,
  activite_principale: text,
  tranche_effectif_salarie: text,
  date_creation: text,
  etat_administratif: text,
  nombre_etablissements: z.number().nullish(),
  nombre_etablissements_ouverts: z.number().nullish(),
  categorie_entreprise: text,
  siege: headquartersSchema.nullish(),
  dirigeants: z.array(directorSchema).nullish(),
  finances: z
    .record(
      z.string(),
      z.object({
        ca: z.number().nullish(),
        resultat_net: z.number().nullish(),
      }),
    )
    .nullish(),
});

export const companiesResponseSchema = z.object({
  results: z.array(z.unknown()),
  total_results: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
});

type CompanyRecord = z.infer<typeof companyRecordSchema>;

const parseCoordinate = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDirector = (raw: z.infer<typeof directorSchema>): Director | null => {
  const isLegalEntity = raw.type_dirigeant === "personne morale";
  const name = isLegalEntity
    ? (raw.denomination ?? "").trim()
    : formatPersonName(raw.prenoms, raw.nom);
  return name === ""
    ? null
    : { name, role: raw.qualite ?? null, isLegalEntity };
};

// Dernière année pour laquelle des comptes sont publiés.
const toLatestFinances = (
  finances: CompanyRecord["finances"],
): CompanyFinances | null => {
  const latestYear = Object.keys(finances ?? {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((first, second) => second - first)[0];
  const entry =
    latestYear === undefined ? undefined : finances?.[String(latestYear)];
  return latestYear === undefined || entry === undefined
    ? null
    : {
        year: latestYear,
        revenue: entry.ca ?? null,
        netIncome: entry.resultat_net ?? null,
      };
};

export const toCompany = (record: CompanyRecord): Company => {
  const latitude = parseCoordinate(record.siege?.latitude);
  const longitude = parseCoordinate(record.siege?.longitude);

  return {
    siren: record.siren,
    name:
      record.nom_complet ?? record.nom_raison_sociale ?? "Entreprise sans nom",
    legalFormCode: record.nature_juridique ?? null,
    activityCode: record.activite_principale ?? null,
    employeeBracketCode: record.tranche_effectif_salarie ?? null,
    createdAt: record.date_creation ?? null,
    isActive: record.etat_administratif === "A",
    establishmentCount: record.nombre_etablissements ?? 0,
    openEstablishmentCount: record.nombre_etablissements_ouverts ?? 0,
    category: record.categorie_entreprise ?? null,
    headquarters: record.siege
      ? {
          siret: record.siege.siret ?? null,
          address: record.siege.adresse ?? null,
          postalCode: record.siege.code_postal ?? null,
          city: record.siege.libelle_commune ?? null,
          position:
            latitude !== null && longitude !== null
              ? { lat: latitude, lng: longitude }
              : null,
        }
      : null,
    directors: (record.dirigeants ?? []).flatMap((director) => {
      const parsed = toDirector(director);
      return parsed === null ? [] : [parsed];
    }),
    finances: toLatestFinances(record.finances),
  };
};

// Chaque résultat est validé séparément : une fiche mal formée est écartée sans
// empêcher l'affichage des autres.
export const parseCompanyRecords = (
  rawRecords: readonly unknown[],
): Company[] =>
  rawRecords.flatMap((rawRecord) => {
    const parsed = companyRecordSchema.safeParse(rawRecord);
    return parsed.success ? [toCompany(parsed.data)] : [];
  });
