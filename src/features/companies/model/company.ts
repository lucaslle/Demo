import type { LatLng } from "@/features/route/model/route";

export type Director = {
  name: string;
  role: string | null;
  isLegalEntity: boolean;
};

export type CompanyFinances = {
  year: number;
  revenue: number | null;
  netIncome: number | null;
};

export type Company = {
  siren: string;
  name: string;
  legalFormCode: string | null;
  activityCode: string | null;
  employeeBracketCode: string | null;
  createdAt: string | null;
  isActive: boolean;
  establishmentCount: number;
  openEstablishmentCount: number;
  category: string | null;
  headquarters: {
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    position: LatLng | null;
  } | null;
  directors: Director[];
  finances: CompanyFinances | null;
};

// Tranches d'effectif salarié de l'Insee.
const EMPLOYEE_BRACKETS: Record<string, string> = {
  "00": "0 salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export const describeEmployeeBracket = (code: string | null): string =>
  code === null
    ? "Effectif non renseigné"
    : (EMPLOYEE_BRACKETS[code] ?? "Effectif non renseigné");

// Les formes juridiques les plus courantes ; les autres gardent leur code.
const LEGAL_FORMS: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5498": "EURL",
  "5499": "SARL",
  "5599": "SA à conseil d'administration",
  "5699": "SA à directoire",
  "5710": "SAS",
  "5720": "SASU",
  "6540": "SCI",
  "9220": "Association déclarée",
};

export const describeLegalForm = (code: string | null): string | null =>
  code === null ? null : (LEGAL_FORMS[code] ?? `Forme juridique ${code}`);

const COMPANY_CATEGORIES: Record<string, string> = {
  PME: "Petite ou moyenne entreprise",
  ETI: "Entreprise de taille intermédiaire",
  GE: "Grande entreprise",
};

export const describeCompanyCategory = (
  category: string | null,
): string | null =>
  category === null ? null : (COMPANY_CATEGORIES[category] ?? category);

const SIREN_PATTERN = /^\d{9}$/;

export const isSiren = (value: string): boolean => SIREN_PATTERN.test(value);

// « 403052111 » → « 403 052 111 »
export const formatSiren = (siren: string): string =>
  isSiren(siren)
    ? `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6)}`
    : siren;

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const titleCase = (text: string): string =>
  text
    .split(/([\s'-]+)/)
    .map((part) => (/^[\s'-]+$/.test(part) ? part : capitalize(part)))
    .join("");

// Le nom d'un dirigeant arrive en majuscules, parfois avec un doublon entre
// parenthèses (« HOLDER (HOLDER) ») : on le nettoie pour l'affichage.
export const formatPersonName = (
  firstNames: string | null | undefined,
  lastName: string | null | undefined,
): string => {
  const cleanedLastName = (lastName ?? "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim();
  const firstName = (firstNames ?? "").split(",")[0]?.trim() ?? "";
  return titleCase([firstName, cleanedLastName].filter(Boolean).join(" "));
};

export const COMPANY_PAGE_SIZE = 10;
export const MIN_QUERY_LENGTH = 3;

export const buildOpenStreetMapUrl = (position: LatLng): string =>
  `https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=17/${position.lat}/${position.lng}`;

// Fiche officielle de l'entreprise, sur l'Annuaire des entreprises de l'État.
export const buildOfficialCompanyUrl = (siren: string): string | null =>
  isSiren(siren)
    ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}`
    : null;
