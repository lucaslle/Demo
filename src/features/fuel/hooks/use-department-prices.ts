import { useQuery } from "@tanstack/react-query";
import { fetchDepartmentPrices } from "../api/fetch-department-prices";

export const departmentPriceKeys = {
  all: ["department-prices"] as const,
};

export const useDepartmentPrices = () =>
  useQuery({
    queryKey: departmentPriceKeys.all,
    queryFn: ({ signal }) => fetchDepartmentPrices({ signal }),
  });
