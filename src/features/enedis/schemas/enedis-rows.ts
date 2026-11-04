import { z } from "zod";
import {
  isSectorCode,
  type IrisRow,
  type SectorYearRow,
} from "../model/electricity";

const nullableNumber = z.number().nullable();

export const SECTOR_SELECT = [
  "annee",
  "code_grand_secteur",
  "sum(conso_totale_mwh) as mwh",
  "sum(nb_sites) as sites",
].join(",");

export const SECTOR_GROUP_BY = "annee,code_grand_secteur";

export const IRIS_SELECT = [
  "nom_iris",
  "code_iris",
  "sum(consommation_annuelle_totale_de_ladresse_mwh) as mwh",
  "sum(nombre_de_logements) as logements",
].join(",");

export const IRIS_GROUP_BY = "nom_iris,code_iris";

// Une ligne = une année et un grand secteur, sommés sur la commune. Les
// consommations secrétisées arrivent à null : elles comptent pour zéro.
export const sectorRowSchema = z.object({
  annee: z.string().regex(/^\d{4}$/),
  code_grand_secteur: z.string(),
  mwh: nullableNumber,
  sites: nullableNumber,
});

export const irisRowSchema = z.object({
  nom_iris: z.string(),
  code_iris: z.string(),
  mwh: nullableNumber,
  logements: nullableNumber,
});

// Un secteur inconnu est rangé sous « non classé » pour que le total reste
// exact ; une ligne de forme inattendue est écartée seule.
export const parseSectorRows = (rawRows: readonly unknown[]): SectorYearRow[] =>
  rawRows.flatMap((rawRow) => {
    const parsed = sectorRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      return [];
    }
    const { annee, code_grand_secteur, mwh, sites } = parsed.data;
    return [
      {
        year: Number(annee),
        sector: isSectorCode(code_grand_secteur)
          ? code_grand_secteur
          : "INCONNU",
        mwh: mwh ?? 0,
        sites: sites ?? 0,
      },
    ];
  });

export const parseIrisRows = (rawRows: readonly unknown[]): IrisRow[] =>
  rawRows.flatMap((rawRow) => {
    const parsed = irisRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      return [];
    }
    const { nom_iris, code_iris, mwh, logements } = parsed.data;
    return [
      {
        code: code_iris,
        name: nom_iris,
        mwh: mwh ?? 0,
        housing: logements ?? 0,
      },
    ];
  });
