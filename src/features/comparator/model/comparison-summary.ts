import { formatEuros } from "@/shared/lib/format";
import type { Scenario } from "./cost";

// Phrase de synthèse en langage courant, adaptée aux trois cas possibles :
// l'électrique est toujours moins cher, jamais, ou selon la façon de recharger.
export const describeComparison = (
  scenarios: readonly Scenario[],
  annualKm: number,
): string => {
  const electric = scenarios.filter(({ id }) => id !== "fuel");
  const cheaper = electric.filter(
    ({ annualSavingsVsFuel }) => annualSavingsVsFuel > 0,
  );
  const kilometers = new Intl.NumberFormat("fr-FR").format(annualKm);

  if (cheaper.length === 0) {
    return "Avec ces hypothèses, le carburant reste moins cher que toutes les façons de recharger.";
  }

  const bySavingsDescending = [...cheaper].sort(
    (first, second) => second.annualSavingsVsFuel - first.annualSavingsVsFuel,
  );
  const best = bySavingsDescending[0];
  const smallest = bySavingsDescending[bySavingsDescending.length - 1];
  if (best === undefined || smallest === undefined) {
    return "";
  }

  if (cheaper.length === electric.length) {
    return `Sur ${kilometers} km par an, rouler à l'électrique coûte de ${formatEuros(smallest.annualSavingsVsFuel)} (${smallest.label.toLowerCase()}) à ${formatEuros(best.annualSavingsVsFuel)} (${best.label.toLowerCase()}) de moins que le carburant.`;
  }

  const worse = electric
    .filter(({ annualSavingsVsFuel }) => annualSavingsVsFuel <= 0)
    .sort(
      (first, second) => first.annualSavingsVsFuel - second.annualSavingsVsFuel,
    )[0];

  return `${best.label} fait économiser ${formatEuros(best.annualSavingsVsFuel)} par an, mais ${worse?.label.toLowerCase() ?? "une autre formule"} coûte ${formatEuros(Math.abs(worse?.annualSavingsVsFuel ?? 0))} de plus que le carburant.`;
};
