import { describe, expect, it } from "vitest";
import { adaptLegacyFact } from "@/domain/facts/adapter";
import { getAuthorizedFacts } from "@/lib/facts";
import { selectCurrentFacts } from "./current-state";

describe("current fact selection", () => {
  it("excludes superseded evidence while retaining the successor", () => {
    const facts = getAuthorizedFacts("demo_product", "approval").map((fact) => adaptLegacyFact(fact, "demo"));
    const current = selectCurrentFacts(facts).map((fact) => fact.factId);
    expect(current).not.toContain("F-LEGAL-1");
    expect(current).toContain("F-APPROVAL-2");
  });
});
