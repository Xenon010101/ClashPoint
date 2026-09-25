import { describe, expect, it } from "vitest";
import { getAuthorizedFacts } from "@/lib/facts";
import { adaptLegacyFact } from "./adapter";

describe("legacy fact adapter", () => {
  it("maps source-backed dependency facts without changing their evidence or ACL", () => {
    const legacy = getAuthorizedFacts("demo_product", "default").find((fact) => fact.factType === "dependency")!;
    const fact = adaptLegacyFact(legacy, "demo");
    expect(fact).toMatchObject({ predicate: "depends_on", subjectRef: "feature:sso", objectRef: "issue:auth-refactor", statementVerbatim: legacy.statementVerbatim });
    expect(fact.authorization.allowedPrincipalIds).toEqual(["demo_product"]);
  });

  it("carries imported supersession forward without treating it as active", () => {
    const legacy = getAuthorizedFacts("demo_product", "approval").find((fact) => fact.factId === "F-LEGAL-1")!;
    const fact = adaptLegacyFact(legacy, "demo");
    expect(fact.supersession).toMatchObject({ state: "superseded", supersededBy: ["F-APPROVAL-2"] });
  });
});
