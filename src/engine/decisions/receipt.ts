import { DecisionReceiptSchema, type Decision, type DecisionReceipt } from "@/domain/decisions/schema";
import type { FactV2 } from "@/domain/facts/schema";

export type ReceiptBuildInput = {
  decision: Decision;
  principalId: string;
  createdAt: string;
  createdFromEventId: string;
  outcome: DecisionReceipt["verification"]["outcome"];
  verifierVersion: string;
  collisionIds: string[];
  graphPathIds: string[];
  facts: FactV2[];
};

export type ReceiptBuildResult =
  | { state: "complete"; receipt: DecisionReceipt }
  | { state: "rejected"; message: string };

/**
 * Builds an immutable-by-convention evidence snapshot. It never reuses fact
 * objects, accepts no unknown IDs, and refuses evidence unavailable to the caller.
 */
export function buildDecisionReceipt(input: ReceiptBuildInput): ReceiptBuildResult {
  if (!input.decision.sourceEventIds.includes(input.createdFromEventId)) {
    return { state: "rejected", message: "The receipt event does not belong to this decision." };
  }
  const byId = new Map(input.facts.map((fact) => [fact.factId, fact]));
  const evidence = input.decision.evidenceFactIds.map((factId) => byId.get(factId));
  if (evidence.some((fact) => !fact)) return { state: "rejected", message: "A checked evidence fact is unavailable." };
  const checkedFacts = evidence as FactV2[];
  if (checkedFacts.some((fact) => fact.status !== "active")) {
    return { state: "rejected", message: "Inactive evidence cannot support a new receipt." };
  }
  if (checkedFacts.some((fact) => !fact.authorization.allowedPrincipalIds.includes(input.principalId))) {
    return { state: "rejected", message: "A checked evidence fact is not authorised for this principal." };
  }

  const parsed = DecisionReceiptSchema.safeParse({
      schemaVersion: 2,
      receiptId: `receipt:${input.decision.decisionId}:${input.createdAt}`,
      workspaceId: input.decision.workspaceId,
      decisionId: input.decision.decisionId,
      createdAt: input.createdAt,
      createdFromEventId: input.createdFromEventId,
      acceptedWording: input.decision.statement,
      verification: {
        outcome: input.outcome,
        verifierVersion: input.verifierVersion,
        checkedFactIds: [...input.decision.evidenceFactIds],
        collisionIds: [...input.collisionIds],
        graphPathIds: [...input.graphPathIds],
      },
      evidenceSnapshot: checkedFacts.map((fact) => ({
        factId: fact.factId,
        sourceObjectId: fact.sourceObjectId,
        sourceRevision: fact.sourceRevision,
        status: fact.status,
      })),
  });
  return parsed.success
    ? { state: "complete", receipt: parsed.data }
    : { state: "rejected", message: "The receipt did not satisfy the canonical contract." };
}
