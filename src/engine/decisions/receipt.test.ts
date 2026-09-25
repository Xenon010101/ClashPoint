import { describe, expect, it } from "vitest";
import type { Decision } from "@/domain/decisions/schema";
import type { FactV2 } from "@/domain/facts/schema";
import { buildDecisionReceipt } from "./receipt";

const decision: Decision = {
  schemaVersion: 2, decisionId: "decision:release:1", workspaceId: "demo", statement: "Ship SSO after Auth Refactor closes.",
  status: "active", sourceEventIds: ["evt_1"], evidenceFactIds: ["fact:gh:42"], madeAt: "2026-09-25T10:00:00.000Z",
  supersession: { state: "active", supersedes: [], supersededBy: [], effectiveFrom: "2026-09-25T10:00:00.000Z", effectiveTo: null, reason: null, recordedAt: null },
};
const fact: FactV2 = {
  schemaVersion: 2, factId: "fact:gh:42", workspaceId: "demo", factType: "issue_state", subjectRef: "issue:github:42",
  predicate: "has_state", objectRef: "state:open", value: "open", statementVerbatim: "GitHub issue #42 is open.", status: "active",
  sourceObjectId: "source:github:42", sourceRevision: "gh-42@1", effectiveAt: "2026-09-25T09:00:00.000Z", observedAt: "2026-09-25T09:01:00.000Z",
  authorization: { allowedPrincipalIds: ["demo_product"] },
  supersession: { state: "active", supersedes: [], supersededBy: [], effectiveFrom: "2026-09-25T09:00:00.000Z", effectiveTo: null, reason: null, recordedAt: null },
};

describe("Decision Receipt builder", () => {
  it("creates a revisioned evidence snapshot from authorised active facts", () => {
    const result = buildDecisionReceipt({
      decision, principalId: "demo_product", createdAt: "2026-09-25T10:02:00.000Z", createdFromEventId: "evt_1",
      outcome: "conditional", verifierVersion: "rules-v2", collisionIds: [], graphPathIds: ["path:sso-gh42"], facts: [fact],
    });
    expect(result).toMatchObject({ state: "complete", receipt: { verification: { checkedFactIds: ["fact:gh:42"] }, evidenceSnapshot: [{ sourceRevision: "gh-42@1" }] } });
  });

  it("rejects unknown, inactive, and unauthorised evidence", () => {
    const input = { decision, principalId: "demo_product", createdAt: "2026-09-25T10:02:00.000Z", createdFromEventId: "evt_1", outcome: "conditional" as const, verifierVersion: "rules-v2", collisionIds: [], graphPathIds: [] };
    expect(buildDecisionReceipt({ ...input, facts: [] }).state).toBe("rejected");
    expect(buildDecisionReceipt({ ...input, facts: [{ ...fact, status: "superseded" }] }).state).toBe("rejected");
    expect(buildDecisionReceipt({ ...input, facts: [{ ...fact, authorization: { allowedPrincipalIds: ["legal"] } }] }).state).toBe("rejected");
  });
});
