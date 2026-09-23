import { describe, expect, it } from "vitest";
import { getAuthorizedFacts } from "@/lib/facts";
import { projectFacts } from "./project";
import { findEvidencePath } from "./query";

describe("Graphify projection", () => {
  it("is deterministic and idempotent for authorised active facts", () => {
    const facts = getAuthorizedFacts("demo_product", "default");
    expect(projectFacts(facts)).toEqual(projectFacts([...facts, ...facts]));
  });

  it("finds a bounded evidence path to the release blocker", () => {
    const graph = projectFacts(getAuthorizedFacts("demo_product", "default"));
    const path = findEvidencePath(graph, ["feature:sso"], ["F-DEP-1"]);
    expect(path?.factIds).toContain("F-DEP-1");
    expect(path?.nodeIds.at(-1)).toBe("fact:F-DEP-1");
  });

  it("does not project restricted facts", () => {
    const graph = projectFacts(getAuthorizedFacts("demo_product", "restricted"));
    expect(graph.nodes.some((node) => node.id.includes("PRIVATE"))).toBe(false);
  });
});
