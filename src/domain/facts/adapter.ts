import { FactV2Schema, type FactV2 } from "./schema";
import type { Fact } from "@/lib/schemas";

const firstWithPrefix = (keys: string[], prefix: string) => keys.find((key) => key.startsWith(prefix)) ?? null;
const firstKey = (fact: Fact) => fact.entityKeys[0] ?? `source:${fact.sourceSystem}:${fact.sourceObjectId}`;

function relationFor(fact: Fact): { subjectRef: string; predicate: string; objectRef: string | null } {
  switch (fact.factType) {
    case "dependency": return { subjectRef: firstWithPrefix(fact.entityKeys, "feature:") ?? firstKey(fact), predicate: "depends_on", objectRef: firstWithPrefix(fact.entityKeys, "issue:") };
    case "approval_blocker": return { subjectRef: firstWithPrefix(fact.entityKeys, "feature:") ?? firstKey(fact), predicate: "requires_approval", objectRef: firstWithPrefix(fact.entityKeys, "topic:") };
    case "capacity": return { subjectRef: firstWithPrefix(fact.entityKeys, "person:") ?? firstKey(fact), predicate: "has_capacity_limit", objectRef: firstWithPrefix(fact.entityKeys, "priority:") };
    case "ownership": return { subjectRef: firstWithPrefix(fact.entityKeys, "issue:") ?? firstKey(fact), predicate: "owned_by", objectRef: firstWithPrefix(fact.entityKeys, "person:") };
    case "approval": return { subjectRef: firstWithPrefix(fact.entityKeys, "feature:") ?? firstKey(fact), predicate: "approval_granted", objectRef: firstWithPrefix(fact.entityKeys, "topic:") };
    case "previous_decision": return { subjectRef: firstWithPrefix(fact.entityKeys, "customer:") ?? firstKey(fact), predicate: "previously_decided", objectRef: firstWithPrefix(fact.entityKeys, "feature:") };
  }
}

/** Additive adapter from trusted legacy fixtures; it preserves source wording and ACLs exactly. */
export function adaptLegacyFact(fact: Fact, workspaceId: string): FactV2 {
  const relation = relationFor(fact);
  const superseded = fact.status === "superseded";
  return FactV2Schema.parse({
    schemaVersion: 2,
    factId: fact.factId,
    workspaceId,
    factType: fact.factType,
    ...relation,
    value: fact.structured,
    statementVerbatim: fact.statementVerbatim,
    status: fact.status,
    sourceObjectId: fact.sourceObjectId,
    sourceRevision: fact.sourceRevision,
    effectiveAt: fact.effectiveAt,
    observedAt: fact.observedAt,
    authorization: { allowedPrincipalIds: [...fact.allowedPrincipalIds] },
    supersession: {
      state: superseded ? "superseded" : "active",
      supersedes: [...fact.supersedes],
      supersededBy: [...fact.supersededBy],
      effectiveFrom: fact.effectiveAt,
      effectiveTo: superseded ? fact.observedAt : null,
      reason: superseded ? "Imported legacy supersession" : null,
      recordedAt: superseded ? fact.observedAt : null,
    },
  });
}
