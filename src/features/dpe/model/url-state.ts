import type { SearchParamsReader } from "@/features/map/model/map-view-url";
import { isCommuneCode } from "@/features/places/model/place";
import { isKind, isParc, type Kind, type Parc } from "./dpe";

export type DpeUrlState = {
  communeCode: string | null;
  parc: Parc;
  kind: Kind;
};

export const parseDpeUrlState = (params: SearchParamsReader): DpeUrlState => {
  const rawCommune = params.get("commune");
  const rawParc = params.get("parc");
  const rawKind = params.get("etiquette");

  return {
    communeCode: isCommuneCode(rawCommune) ? rawCommune : null,
    parc: isParc(rawParc) ? rawParc : "logements",
    kind: isKind(rawKind) ? rawKind : "dpe",
  };
};

// Seul ce qui s'écarte des valeurs par défaut est écrit dans l'URL.
export const buildDpeSearch = ({
  communeCode,
  parc,
  kind,
}: DpeUrlState): string => {
  const params = new URLSearchParams();
  if (communeCode !== null) {
    params.set("commune", communeCode);
  }
  if (parc !== "logements") {
    params.set("parc", parc);
  }
  if (kind !== "dpe") {
    params.set("etiquette", kind);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
};
