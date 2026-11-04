import { DEPARTMENT_NAMES } from "@/features/fuel/data/departments";

export const FRANCE_CODE = "FR";

export type Territory = {
  code: string;
  name: string;
};

// Les contours de la carte ne couvrent que la métropole : les quatre
// départements d'outre-mer présents dans les données Urssaf sont ajoutés ici.
const OVERSEAS_DEPARTMENTS: readonly Territory[] = [
  { code: "971", name: "Guadeloupe" },
  { code: "972", name: "Martinique" },
  { code: "973", name: "Guyane" },
  { code: "974", name: "La Réunion" },
];

export const TERRITORIES: readonly Territory[] = [
  { code: FRANCE_CODE, name: "France entière" },
  ...[...DEPARTMENT_NAMES.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((first, second) => first.code.localeCompare(second.code)),
  ...OVERSEAS_DEPARTMENTS,
];

export const findTerritory = (code: string | null): Territory | undefined =>
  TERRITORIES.find((territory) => territory.code === code);

export const DEFAULT_TERRITORY: Territory = {
  code: FRANCE_CODE,
  name: "France entière",
};

export const formatTerritoryLabel = ({ code, name }: Territory): string =>
  code === FRANCE_CODE ? name : `${name} (${code})`;
