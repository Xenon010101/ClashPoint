import { describe, expect, it } from "vitest";
import { getAuthorizedFacts } from "@/lib/facts";
import { projectFacts } from "./project";
import { findEvidencePath } from "./query";
import type { Graph } from "./model";

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

  it("terminates safely when a malformed projection contains a cycle", () => {
    const graph: Graph = {
      nodes: [
        { id: "feature:a", type: "entity", label: "A" },
        { id: "feature:b", type: "entity", label: "B" },
      ],
      edges: [
        { id: "a-b", type: "DEPENDS_ON", from: "feature:a", to: "feature:b", authority: "evidence", supportFactIds: ["F-A"], status: "active" },
        { id: "b-a", type: "DEPENDS_ON", from: "feature:b", to: "feature:a", authority: "evidence", supportFactIds: ["F-B"], status: "active" },
      ],
    };
    expect(findEvidencePath(graph, ["feature:a"], ["F-MISSING"], 3)).toBeNull();
  });
});
