import { describe, expect, it } from "vitest";
import { buildDepartmentHref } from "./department-link";

describe("buildDepartmentHref", () => {
  it("ouvre la carte centrée sur le département avec le carburant choisi", () => {
    expect(buildDepartmentHref([45.1, 2.7], "gazole")).toBe(
      "/carburants/?lat=45.10000&lng=2.70000&z=10&carburant=gazole",
    );
  });
});
