import { fetchJson } from "@/shared/api/http-client";
import {
  DEPARTMENT_SELECT,
  parseDepartmentRecords,
  type DepartmentPrices,
} from "../schemas/department-prices";
import { recordsResponseSchema } from "@/shared/api/records-response";
import { FUEL_PRICES_RECORDS_URL } from "./endpoints";

// La France compte moins de 110 départements : une seule page suffit.
const MAX_DEPARTMENT_GROUPS = 110;

type FetchDepartmentPricesParams = {
  signal?: AbortSignal;
};

export const fetchDepartmentPrices = async ({
  signal,
}: FetchDepartmentPricesParams = {}): Promise<DepartmentPrices> => {
  const params = new URLSearchParams({
    select: DEPARTMENT_SELECT,
    group_by: "code_departement",
    limit: String(MAX_DEPARTMENT_GROUPS),
  });

  const response = await fetchJson(
    `${FUEL_PRICES_RECORDS_URL}?${params.toString()}`,
    recordsResponseSchema,
    { signal },
  );

  return parseDepartmentRecords(response.results);
};
