import { describe, expect, it } from "vitest";
import { getAuthorizedFacts } from "@/lib/facts";
import { findDependents } from "./impact";
import { projectFacts } from "./project";

describe("Graphify impact paths", () => {
  it("finds the feature affected by a dependency change with supporting evidence", () => {
    const graph = projectFacts(getAuthorizedFacts("demo_product", "default"));
    expect(findDependents(graph, "issue:auth-refactor")).toContainEqual(expect.objectContaining({ nodeIds: ["issue:auth-refactor", "feature:sso"], factIds: ["F-DEP-1"] }));
  });
});
