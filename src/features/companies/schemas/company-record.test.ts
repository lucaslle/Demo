import { describe, expect, it } from "vitest";
import { parseCompanyRecords } from "./company-record";

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  siren: "403052111",
  nom_complet: "BOULANGERIES PAUL",
  nom_raison_sociale: "BOULANGERIES PAUL",
  nature_juridique: "5710",
  activite_principale: "10.71A",
  tranche_effectif_salarie: "41",
  date_creation: "1995-12-07",
  etat_administratif: "A",
  nombre_etablissements: 315,
  nombre_etablissements_ouverts: 124,
  categorie_entreprise: "ETI",
  siege: {
    siret: "40305211102616",
    adresse: "344 AVENUE DE LA MARNE 59700 MARCQ-EN-BARŒUL",
    code_postal: "59700",
    libelle_commune: "MARCQ-EN-BARŒUL",
    latitude: "50.678029398",
    longitude: "3.1169136021",
  },
  dirigeants: [
    {
      nom: "HOLDER (HOLDER)",
      prenoms: "FRANCIS",
      qualite: "Président de SAS",
      type_dirigeant: "personne physique",
      date_de_naissance: "1940-07",
    },
    {
      denomination: "HOLDING EXEMPLE",
      qualite: "Commissaire aux comptes",
      type_dirigeant: "personne morale",
    },
  ],
  finances: {
    "2023": { ca: 70000000, resultat_net: 100 },
    "2024": { ca: 73611839, resultat_net: -2197350 },
  },
  ...overrides,
});

describe("parseCompanyRecords", () => {
  it("transforme un résultat en entreprise lisible", () => {
    const [company] = parseCompanyRecords([buildRecord()]);

    expect(company).toMatchObject({
      siren: "403052111",
      name: "BOULANGERIES PAUL",
      legalFormCode: "5710",
      activityCode: "10.71A",
      isActive: true,
      establishmentCount: 315,
      openEstablishmentCount: 124,
      category: "ETI",
    });
    expect(company?.headquarters?.position).toEqual({
      lat: 50.678029398,
      lng: 3.1169136021,
    });
  });

  it("retient les dirigeants par leur nom et leur fonction, sans date de naissance", () => {
    const [company] = parseCompanyRecords([buildRecord()]);

    expect(company?.directors).toEqual([
      {
        name: "Francis Holder",
        role: "Président de SAS",
        isLegalEntity: false,
      },
      {
        name: "HOLDING EXEMPLE",
        role: "Commissaire aux comptes",
        isLegalEntity: true,
      },
    ]);
    expect(JSON.stringify(company)).not.toContain("1940");
  });

  it("garde les comptes de la dernière année publiée", () => {
    const [company] = parseCompanyRecords([buildRecord()]);

    expect(company?.finances).toEqual({
      year: 2024,
      revenue: 73611839,
      netIncome: -2197350,
    });
  });

  it("gère une entreprise cessée, sans siège ni comptes", () => {
    const [company] = parseCompanyRecords([
      buildRecord({
        etat_administratif: "C",
        siege: null,
        finances: null,
        dirigeants: null,
        nom_complet: null,
      }),
    ]);

    expect(company).toMatchObject({
      isActive: false,
      headquarters: null,
      finances: null,
      directors: [],
      name: "BOULANGERIES PAUL",
    });
  });

  it("ignore des coordonnées illisibles", () => {
    const [company] = parseCompanyRecords([
      buildRecord({
        siege: { siret: "1", latitude: "n/a", longitude: "3.1" },
      }),
    ]);

    expect(company?.headquarters?.position).toBeNull();
  });

  it("écarte les résultats invalides sans bloquer les autres", () => {
    const companies = parseCompanyRecords([
      buildRecord({ siren: "111111111" }),
      { nom_complet: "sans siren" },
      buildRecord({ siren: "222222222", nombre_etablissements: "beaucoup" }),
    ]);

    expect(companies.map(({ siren }) => siren)).toEqual(["111111111"]);
  });
});
