import { describe, expect, it } from "vitest";
import {
  buildOfficialCompanyUrl,
  buildOpenStreetMapUrl,
  describeCompanyCategory,
  describeEmployeeBracket,
  describeLegalForm,
  formatPersonName,
  formatSiren,
  isSiren,
} from "./company";

describe("describeEmployeeBracket", () => {
  it("traduit les codes de tranche d'effectif de l'Insee", () => {
    expect(describeEmployeeBracket("11")).toBe("10 à 19 salariés");
    expect(describeEmployeeBracket("53")).toBe("10 000 salariés et plus");
  });

  it("signale un effectif absent ou un code inconnu", () => {
    expect(describeEmployeeBracket(null)).toBe("Effectif non renseigné");
    expect(describeEmployeeBracket("NN")).toBe("Effectif non renseigné");
  });
});

describe("describeLegalForm et describeCompanyCategory", () => {
  it("nomme les formes juridiques courantes et garde le code des autres", () => {
    expect(describeLegalForm("5710")).toBe("SAS");
    expect(describeLegalForm("5308")).toBe("Forme juridique 5308");
    expect(describeLegalForm(null)).toBeNull();
  });

  it("développe la catégorie d'entreprise", () => {
    expect(describeCompanyCategory("ETI")).toBe(
      "Entreprise de taille intermédiaire",
    );
    expect(describeCompanyCategory(null)).toBeNull();
  });
});

describe("SIREN", () => {
  it("reconnaît un numéro à neuf chiffres", () => {
    expect(isSiren("403052111")).toBe(true);
    expect(isSiren("40305211")).toBe(false);
    expect(isSiren("40305211a")).toBe(false);
  });

  it("regroupe les chiffres par trois", () => {
    expect(formatSiren("403052111")).toBe("403 052 111");
    expect(formatSiren("abc")).toBe("abc");
  });

  it("ne construit le lien officiel que pour un SIREN valide", () => {
    expect(buildOfficialCompanyUrl("403052111")).toBe(
      "https://annuaire-entreprises.data.gouv.fr/entreprise/403052111",
    );
    expect(buildOfficialCompanyUrl("../../x")).toBeNull();
  });
});

describe("formatPersonName", () => {
  it("met le prénom et le nom en casse usuelle", () => {
    expect(formatPersonName("FRANCIS", "HOLDER")).toBe("Francis Holder");
  });

  it("retire le doublon entre parenthèses et garde le premier prénom", () => {
    expect(formatPersonName("MAXIME, PAUL", "HOLDER (HOLDER)")).toBe(
      "Maxime Holder",
    );
  });

  it("gère les noms composés et les valeurs absentes", () => {
    expect(formatPersonName("JEAN-PIERRE", "DE LA FONTAINE")).toBe(
      "Jean-Pierre De La Fontaine",
    );
    expect(formatPersonName(null, null)).toBe("");
  });
});

describe("liens externes", () => {
  it("construit un lien OpenStreetMap vers la position", () => {
    expect(buildOpenStreetMapUrl({ lat: 48.85, lng: 2.35 })).toBe(
      "https://www.openstreetmap.org/?mlat=48.85&mlon=2.35#map=17/48.85/2.35",
    );
  });
});
