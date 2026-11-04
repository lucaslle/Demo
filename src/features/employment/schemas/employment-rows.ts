import { z } from "zod";
import {
  findSectorByValue,
  formatQuarterLabel,
  type QuarterPoint,
  type SectorShare,
} from "../model/employment";

const nullableNumber = z.number().nullable();

// Une ligne = un trimestre, sommé sur le territoire et le secteur demandés.
export const quarterRowSchema = z.object({
  dernier_jour_du_trimestre: z.string(),
  annee: z.string(),
  trimestre: z.number(),
  effectifs: nullableNumber,
  masse: nullableNumber,
});

export const sectorRowSchema = z.object({
  grand_secteur_d_activite: z.string(),
  e: nullableNumber,
  m: nullableNumber,
});

export const QUARTER_SELECT = [
  "annee",
  "trimestre",
  "dernier_jour_du_trimestre",
  "sum(effectifs_salaries_cvs) as effectifs",
  "sum(masse_salariale_cvs) as masse",
].join(",");

export const QUARTER_GROUP_BY = "annee,trimestre,dernier_jour_du_trimestre";

export const SECTOR_SELECT = [
  "grand_secteur_d_activite",
  "sum(effectifs_salaries_cvs) as e",
  "sum(masse_salariale_cvs) as m",
].join(",");

// Les dates arrivent en ISO complet (« 2026-06-30T00:00:00+00:00 ») : on ne
// garde que le jour.
const toDay = (isoDate: string): string => isoDate.slice(0, 10);

// Les lignes invalides sont écartées ; le résultat est trié du plus ancien au
// plus récent, ordre attendu par le graphique.
export const parseQuarterRows = (rawRows: readonly unknown[]): QuarterPoint[] =>
  rawRows
    .flatMap((rawRow) => {
      const parsed = quarterRowSchema.safeParse(rawRow);
      if (!parsed.success) {
        return [];
      }
      const { dernier_jour_du_trimestre, annee, trimestre, effectifs, masse } =
        parsed.data;
      const year = Number(annee.slice(0, 4));
      return [
        {
          date: toDay(dernier_jour_du_trimestre),
          year,
          quarter: trimestre,
          label: formatQuarterLabel(year, trimestre),
          employees: effectifs,
          payroll: masse,
        },
      ];
    })
    .sort((first, second) => first.date.localeCompare(second.date));

export const parseSectorRows = (rawRows: readonly unknown[]): SectorShare[] =>
  rawRows.flatMap((rawRow) => {
    const parsed = sectorRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      return [];
    }
    const sector = findSectorByValue(parsed.data.grand_secteur_d_activite);
    if (sector === undefined) {
      return [];
    }
    return [
      {
        sector,
        employees: parsed.data.e ?? 0,
        payroll: parsed.data.m ?? 0,
      },
    ];
  });
