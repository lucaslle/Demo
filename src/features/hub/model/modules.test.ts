import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  findModuleByPathname,
  getModulesByCategory,
  isAvailable,
  MODULES,
  searchModules,
} from "./modules";

describe("registre des modules", () => {
  it("donne un identifiant unique à chaque module", () => {
    const ids = MODULES.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rattache chaque module à une catégorie existante", () => {
    const categoryIds = CATEGORIES.map(({ id }) => id);

    for (const { categoryId } of MODULES) {
      expect(categoryIds).toContain(categoryId);
    }
  });

  it("n'utilise que des chemins uniques, avec barres obliques de part et d'autre", () => {
    const hrefs = MODULES.flatMap(({ href }) => (href === null ? [] : [href]));

    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/[a-z-]+\/$/);
    }
  });

  it("propose les trois API d'entreprises et d'emploi sans clé", () => {
    for (const id of ["entreprises", "bio", "emploi"]) {
      const appModule = MODULES.find((candidate) => candidate.id === id);

      expect(appModule).toBeDefined();
      expect(appModule && isAvailable(appModule)).toBe(true);
      expect(appModule?.requiresApiKey).toBe(false);
      expect(appModule?.categoryId).toBe("business");
    }
  });
});

describe("getModulesByCategory", () => {
  it("regroupe les modules par catégorie, dans l'ordre des catégories", () => {
    const groups = getModulesByCategory();

    expect(groups.map(({ category }) => category.id)).toEqual([
      "mobility",
      "business",
      "territory",
    ]);
    expect(groups.flatMap(({ modules }) => modules)).toHaveLength(
      MODULES.length,
    );
  });

  it("n'affiche pas les catégories vides", () => {
    const onlyMobility = MODULES.filter(
      ({ categoryId }) => categoryId === "mobility",
    );

    expect(getModulesByCategory(onlyMobility)).toHaveLength(1);
  });
});

describe("findModuleByPathname", () => {
  it("retrouve le module de la page courante", () => {
    expect(findModuleByPathname("/recharge/")?.id).toBe("recharge");
    expect(findModuleByPathname("/entreprises/")?.id).toBe("entreprises");
  });

  it("renvoie undefined pour l'accueil ou une page inconnue", () => {
    expect(findModuleByPathname("/")).toBeUndefined();
    expect(findModuleByPathname("/inconnu/")).toBeUndefined();
  });
});

describe("searchModules", () => {
  it("renvoie tous les modules pour une recherche vide", () => {
    expect(searchModules("  ")).toHaveLength(MODULES.length);
  });

  it("cherche dans le titre, les mots-clés et la source", () => {
    expect(searchModules("siren").map(({ id }) => id)).toEqual(["entreprises"]);
    expect(searchModules("agence bio").map(({ id }) => id)).toEqual(["bio"]);
    expect(searchModules("urssaf").map(({ id }) => id)).toEqual(["emploi"]);
  });

  it("ignore la casse et les accents", () => {
    expect(searchModules("ELECTRIQUE").map(({ id }) => id)).toContain(
      "recharge",
    );
    expect(searchModules("equipements").map(({ id }) => id)).toContain("sport");
  });

  it("exige tous les mots de la recherche", () => {
    expect(searchModules("bio urssaf")).toEqual([]);
  });
});
