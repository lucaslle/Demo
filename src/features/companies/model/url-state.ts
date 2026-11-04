import type { SearchParamsReader } from "@/features/map/model/map-view-url";
import { isSiren, MIN_QUERY_LENGTH } from "./company";

export type CompanyUrlState = {
  query: string;
  onlyActive: boolean;
  page: number;
  siren: string | null;
};

const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 400;

const readPage = (rawPage: string | null): number => {
  const page = Number(rawPage);
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
};

export const parseCompanyUrlState = (
  params: SearchParamsReader,
): CompanyUrlState => {
  const rawSiren = params.get("siren");

  return {
    query: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    // Par défaut on ne montre que les entreprises en activité.
    onlyActive: params.get("actives") !== "0",
    page: readPage(params.get("page")),
    siren: rawSiren !== null && isSiren(rawSiren) ? rawSiren : null,
  };
};

export const buildCompanySearch = ({
  query,
  onlyActive,
  page,
  siren,
}: CompanyUrlState): string => {
  const params = new URLSearchParams();
  if (query.trim().length >= MIN_QUERY_LENGTH) {
    params.set("q", query.trim());
  }
  if (!onlyActive) {
    params.set("actives", "0");
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  if (siren !== null) {
    params.set("siren", siren);
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
};
