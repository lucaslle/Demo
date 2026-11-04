import { z } from "zod";
import rawDepartments from "./departments.json";

// Contours générés par scripts/build-departments.mjs, validés au chargement.
const departmentShapeSchema = z.object({
  code: z.string(),
  name: z.string(),
  center: z.tuple([z.number(), z.number()]),
  path: z.string(),
});

const franceMapSchema = z.object({
  viewBox: z.object({ width: z.number(), height: z.number() }),
  departments: z.array(departmentShapeSchema),
});

export type DepartmentShape = z.infer<typeof departmentShapeSchema>;

export const FRANCE_MAP = franceMapSchema.parse(rawDepartments);

export const DEPARTMENT_NAMES: ReadonlyMap<string, string> = new Map(
  FRANCE_MAP.departments.map(({ code, name }) => [code, name]),
);
