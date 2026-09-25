import { describe, expect, it } from "vitest";
import { adaptLegacyFact } from "@/domain/facts/adapter";
import { getAuthorizedFacts } from "@/lib/facts";
import { projectFactsV2 } from "./project-v2";

describe("v2 Graphify projection", () => {
  it("projects a generic dependency edge supported by the original Fact ID", () => {
    const legacy = getAuthorizedFacts("demo_product", "default").find((fact) => fact.factType === "dependency")!;
    const graph = projectFactsV2([adaptLegacyFact(legacy, "demo")]);
    expect(graph.edges).toContainEqual(expect.objectContaining({ type: "DEPENDS_ON", from: "feature:sso", to: "issue:auth-refactor", supportFactIds: ["F-DEP-1"] }));
  });
});
