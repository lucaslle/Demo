import { describe, expect, it } from "vitest";
import {
  operatorsResponseSchema,
  parseOperatorRecords,
} from "./operator-record";

const PARIS = { lat: 48.8566, lng: 2.3522 };

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 142939,
  raisonSociale: "TRIBES & CO",
  denominationcourante: "TRIBES & CO (SAS)",
  telephoneNational: "0616294393",
  telephoneCommerciale: null,
  categories: [{ id: 1, nom: "Vente aux consommateurs" }],
  activites: [{ id: 2, nom: "Préparation" }],
  productions: [{ id: 815, code: "10.83.15", nom: "Infusions" }],
  siteWebs: [
    {
      url: "https://www.facebook.com/teatribesandco/",
      active: true,
      typeSiteWeb: { nom: "Facebook" },
    },
    {
      url: "https://teatribesandco.com",
      active: true,
      typeSiteWeb: { nom: "Site Officiel" },
    },
  ],
  adressesOperateurs: [
    {
      lieu: "ZA La Vénerie",
      codePostal: "37460",
      ville: "GENILLE",
      lat: 47.151429,
      long: 1.196859,
      active: true,
    },
    {
      lieu: "3 rue du Temple",
      codePostal: "75004",
      ville: "Paris",
      lat: 48.857553,
      long: 2.352517,
      active: true,
    },
  ],
  certificats: [
    {
      organisme: "Certipaq Bio",
      etatCertification: "ENGAGEE",
      url: "https://bio.certipaq.solutions/certificats/fiche/60833/",
    },
  ],
  venteAnnuaire: {
    venteParticuliers: true,
    venteProsGros: false,
    venteProsDetail: true,
  },
  ...overrides,
});

describe("operatorsResponseSchema", () => {
  it("convertit le total, fourni sous forme de chaîne", () => {
    const response = operatorsResponseSchema.parse({
      nbTotal: "21757",
      items: [],
    });

    expect(response.nbTotal).toBe(21757);
  });
});

describe("parseOperatorRecords", () => {
  it("garde l'adresse la plus proche du centre de la recherche", () => {
    const [operator] = parseOperatorRecords([buildRecord()], PARIS);

    expect(operator?.address).toBe("3 rue du Temple, 75004 Paris");
    expect(operator?.position).toEqual({ lat: 48.857553, lng: 2.352517 });
    expect(operator?.distanceKm).toBeLessThan(0.5);
  });

  it("extrait le site officiel, le téléphone, la certification et les ventes", () => {
    const [operator] = parseOperatorRecords([buildRecord()], PARIS);

    expect(operator).toMatchObject({
      id: "142939",
      name: "TRIBES & CO",
      website: "https://teatribesandco.com/",
      phone: "06 16 29 43 93",
      categories: ["Vente aux consommateurs"],
      activities: ["Préparation"],
      products: ["Infusions"],
      salesChannels: ["Particuliers", "Professionnels (détail)"],
      certification: {
        body: "Certipaq Bio",
        status: "ENGAGEE",
        url: "https://bio.certipaq.solutions/certificats/fiche/60833/",
      },
    });
  });

  it("ne garde ni la date de naissance ni l'identité du gérant", () => {
    const [operator] = parseOperatorRecords(
      [buildRecord({ gerant: "Jean Dupont", email: "contact@exemple.fr" })],
      PARIS,
    );

    expect(JSON.stringify(operator)).not.toContain("Dupont");
    expect(JSON.stringify(operator)).not.toContain("contact@exemple.fr");
  });

  it("écarte les opérateurs sans adresse géolocalisée active", () => {
    const records = [
      buildRecord({ id: 1, adressesOperateurs: [] }),
      buildRecord({
        id: 2,
        adressesOperateurs: [{ lat: null, long: null, active: true }],
      }),
      buildRecord({
        id: 3,
        adressesOperateurs: [
          { lieu: "Fermée", lat: 48.85, long: 2.35, active: false },
        ],
      }),
    ];

    expect(parseOperatorRecords(records, PARIS)).toEqual([]);
  });

  it("ignore un opérateur de forme inattendue sans perdre les autres", () => {
    const operators = parseOperatorRecords(
      [{ id: "pas un nombre" }, buildRecord({ id: 7 }), null],
      PARIS,
    );

    expect(operators.map(({ id }) => id)).toEqual(["7"]);
  });

  it("classe les opérateurs du plus proche au plus éloigné", () => {
    const far = buildRecord({
      id: 10,
      adressesOperateurs: [{ lat: 45.764, long: 4.8357, active: true }],
    });
    const near = buildRecord({ id: 11 });

    const operators = parseOperatorRecords([far, near], PARIS);

    expect(operators.map(({ id }) => id)).toEqual(["11", "10"]);
  });

  it("refuse un lien de site non http(s)", () => {
    const [operator] = parseOperatorRecords(
      [
        buildRecord({
          siteWebs: [
            {
              url: "javascript:alert(1)",
              active: true,
              typeSiteWeb: { nom: "Site Officiel" },
            },
          ],
        }),
      ],
      PARIS,
    );

    expect(operator?.website).toBeNull();
  });
});
