import {
  Briefcase,
  BarChart3,
  Building2,
  Car,
  Dumbbell,
  Fuel,
  Gauge,
  House,
  Landmark,
  Leaf,
  MapPinned,
  PlugZap,
  Scale,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRE DES MODULES
//
// Pour ajouter un lien vers une nouvelle API :
//   1. ajoutez une entrée dans MODULES (avec `href: null` tant que la page
//      n'existe pas : le module apparaît alors « Bientôt ») ;
//   2. si besoin, ajoutez une catégorie dans CATEGORIES.
// Le menu du site et l'accueil se mettent à jour tout seuls.
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleCategoryId =
  "mobility" | "business" | "property" | "territory";

export type ModuleCategory = {
  id: ModuleCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type AppModule = {
  id: string;
  title: string;
  description: string;
  // Chemin de la page (avec barre oblique finale), ou null si elle n'existe pas encore.
  href: string | null;
  icon: LucideIcon;
  categoryId: ModuleCategoryId;
  // Jeu de données ou API qui alimente le module.
  source: string;
  requiresApiKey: boolean;
  // Mots supplémentaires pour la recherche sur l'accueil.
  keywords: readonly string[];
};

export const CATEGORIES: readonly ModuleCategory[] = [
  {
    id: "mobility",
    title: "Mobilité et énergie",
    description: "Carburants, recharge électrique et coût des trajets.",
    icon: Car,
  },
  {
    id: "business",
    title: "Entreprises et emploi",
    description: "Entreprises, commerces bio, effectifs et salaires.",
    icon: Briefcase,
  },
  {
    id: "property",
    title: "Immobilier et énergie",
    description:
      "Ventes de logements, diagnostics énergétiques et électricité.",
    icon: Landmark,
  },
  {
    id: "territory",
    title: "Territoire et cadre de vie",
    description: "Équipements, risques et services autour de vous.",
    icon: MapPinned,
  },
];

export const MODULES: readonly AppModule[] = [
  {
    id: "carburants",
    title: "Carburants",
    description:
      "Trouvez la station la moins chère autour de vous et comparez les prix de la zone.",
    href: "/carburants/",
    icon: Fuel,
    categoryId: "mobility",
    source: "Prix des carburants (data.economie.gouv.fr)",
    requiresApiKey: false,
    keywords: ["essence", "gazole", "diesel", "station", "prix", "e10"],
  },
  {
    id: "recharge",
    title: "Recharge électrique",
    description:
      "Plus de 160 000 points de charge : puissance, prises, tarif affiché et itinéraire jusqu'à la borne.",
    href: "/recharge/",
    icon: Zap,
    categoryId: "mobility",
    source: "Bornes de recharge IRVE (ODRE)",
    requiresApiKey: false,
    keywords: ["irve", "borne", "voiture électrique", "ev", "kwh"],
  },
  {
    id: "comparateur",
    title: "Comparateur",
    description:
      "Carburant ou électrique ? Ce que coûte un trajet, aux prix réels du jour et à vos hypothèses.",
    href: "/comparateur/",
    icon: Scale,
    categoryId: "mobility",
    source: "Carburants et bornes IRVE",
    requiresApiKey: false,
    keywords: ["coût", "économie", "trajet", "électrique", "thermique"],
  },
  {
    id: "entreprises",
    title: "Recherche d'entreprises",
    description:
      "Infos légales, dirigeants, effectifs et établissements d'une entreprise française.",
    href: "/entreprises/",
    icon: Building2,
    categoryId: "business",
    source: "API Recherche d'entreprises (DINUM)",
    requiresApiKey: false,
    keywords: ["siren", "siret", "société", "dirigeant", "établissement"],
  },
  {
    id: "bio",
    title: "Producteurs et commerces bio",
    description:
      "Les producteurs, transformateurs et magasins bio certifiés les plus proches de vous.",
    href: "/bio/",
    icon: Leaf,
    categoryId: "business",
    source: "API Professionnels bio (Agence Bio)",
    requiresApiKey: false,
    keywords: ["agriculture", "magasin", "ferme", "certifié", "ab"],
  },
  {
    id: "emploi",
    title: "Emploi et salaires",
    description:
      "Effectifs salariés et masse salariale par secteur et par département, sur 25 ans.",
    href: "/emploi/",
    icon: BarChart3,
    categoryId: "business",
    source: "Données ouvertes Urssaf",
    requiresApiKey: false,
    keywords: [
      "urssaf",
      "salariés",
      "masse salariale",
      "secteur",
      "département",
    ],
  },
  {
    id: "immobilier",
    title: "Ventes immobilières",
    description:
      "Les ventes de logements autour d'une adresse : prix, surface, prix au mètre carré et localisation.",
    href: "/immobilier/",
    icon: House,
    categoryId: "property",
    source: "API Données foncières DVF (Cerema)",
    requiresApiKey: false,
    keywords: [
      "dvf",
      "foncier",
      "prix",
      "m2",
      "appartement",
      "maison",
      "vente",
    ],
  },
  {
    id: "dpe",
    title: "Diagnostics énergétiques",
    description:
      "Étiquettes énergie et climat des logements et des bâtiments tertiaires d'une commune.",
    href: "/dpe/",
    icon: Gauge,
    categoryId: "property",
    source: "API DPE logements et DPE tertiaire (ADEME)",
    requiresApiKey: false,
    keywords: [
      "dpe",
      "ademe",
      "passoire thermique",
      "ges",
      "étiquette",
      "logement",
    ],
  },
  {
    id: "electricite",
    title: "Consommation électrique",
    description:
      "La consommation d'électricité d'une commune et de ses quartiers, par secteur et par année.",
    href: "/electricite/",
    icon: PlugZap,
    categoryId: "property",
    source: "Données ouvertes Enedis",
    requiresApiKey: false,
    keywords: ["enedis", "électricité", "mwh", "iris", "quartier", "commune"],
  },
  {
    id: "sport",
    title: "Équipements sportifs",
    description:
      "City-stades, gymnases, terrains : 334 000 équipements recensés par le ministère des Sports.",
    href: null,
    icon: Dumbbell,
    categoryId: "territory",
    source: "Recensement des équipements sportifs (Data ES)",
    requiresApiKey: false,
    keywords: ["gymnase", "terrain", "city-stade", "sport"],
  },
  {
    id: "risques",
    title: "Risques",
    description:
      "Inondation, sols pollués, sites industriels : les risques connus près d'une adresse.",
    href: null,
    icon: ShieldAlert,
    categoryId: "territory",
    source: "Géorisques",
    requiresApiKey: false,
    keywords: ["inondation", "pollution", "icpe", "sismique"],
  },
];

export const isAvailable = (appModule: AppModule): boolean =>
  appModule.href !== null;

export const getModulesByCategory = (
  modules: readonly AppModule[] = MODULES,
): { category: ModuleCategory; modules: AppModule[] }[] =>
  CATEGORIES.map((category) => ({
    category,
    modules: modules.filter(({ categoryId }) => categoryId === category.id),
  })).filter(({ modules: categoryModules }) => categoryModules.length > 0);

// Module correspondant à la page courante (le chemin peut porter le préfixe du
// dépôt GitHub Pages, que le routeur retire déjà).
export const findModuleByPathname = (
  pathname: string,
  modules: readonly AppModule[] = MODULES,
): AppModule | undefined =>
  modules.find(
    ({ href }) =>
      href !== null && (pathname === href || pathname.startsWith(href)),
  );

const normalize = (text: string): string =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Recherche insensible à la casse et aux accents, sur le titre, la description,
// la source et les mots-clés.
export const searchModules = (
  query: string,
  modules: readonly AppModule[] = MODULES,
): AppModule[] => {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return [...modules];
  }

  return modules.filter((appModule) => {
    const haystack = normalize(
      [
        appModule.title,
        appModule.description,
        appModule.source,
        ...appModule.keywords,
      ].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
};
