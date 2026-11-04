import { describe, expect, it } from "vitest";
import { parseQuarterRows, parseSectorRows } from "./employment-rows";

const quarterRow = (overrides: Record<string, unknown> = {}) => ({
  dernier_jour_du_trimestre: "2026-06-30T00:00:00+00:00",
  annee: "2026-01-01T00:00:00+00:00",
  trimestre: 2,
  effectifs: 1631106,
  masse: 21907246320,
  ...overrides,
});

describe("parseQuarterRows", () => {
  it("transforme une ligne en point de série avec son étiquette", () => {
    expect(parseQuarterRows([quarterRow()])).toEqual([
      {
        date: "2026-06-30",
        year: 2026,
        quarter: 2,
        label: "T2 2026",
        employees: 1631106,
        payroll: 21907246320,
      },
    ]);
  });

  it("trie la série du plus ancien au plus récent", () => {
    const points = parseQuarterRows([
      quarterRow({
        dernier_jour_du_trimestre: "2026-06-30T00:00:00+00:00",
      }),
      quarterRow({
        dernier_jour_du_trimestre: "2025-09-30T00:00:00+00:00",
        annee: "2025-01-01T00:00:00+00:00",
        trimestre: 3,
      }),
    ]);

    expect(points.map(({ label }) => label)).toEqual(["T3 2025", "T2 2026"]);
  });

  it("conserve les valeurs manquantes et écarte les lignes invalides", () => {
    const points = parseQuarterRows([
      quarterRow({ effectifs: null }),
      { n: "importe quoi" },
      quarterRow({ trimestre: "deux" }),
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]?.employees).toBeNull();
  });
});

describe("parseSectorRows", () => {
  it("associe chaque ligne à son secteur connu", () => {
    const shares = parseSectorRows([
      { grand_secteur_d_activite: "GS3 Commerce", e: 185967, m: 2051823785 },
    ]);

    expect(shares).toEqual([
      {
        sector: expect.objectContaining({ key: "gs3", label: "Commerce" }),
        employees: 185967,
        payroll: 2051823785,
      },
    ]);
  });

  it("ignore un secteur inconnu comme « nca » ou une ligne invalide", () => {
    expect(
      parseSectorRows([
        { grand_secteur_d_activite: "nca _non classé ailleurs_", e: 1, m: 1 },
        { grand_secteur_d_activite: 12 },
      ]),
    ).toEqual([]);
  });

  it("remplace une valeur absente par zéro", () => {
    const [share] = parseSectorRows([
      { grand_secteur_d_activite: "GS1 Industrie", e: null, m: null },
    ]);

    expect(share).toMatchObject({ employees: 0, payroll: 0 });
  });
});
