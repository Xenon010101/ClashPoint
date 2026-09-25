import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptLegacyFact } from "@/domain/facts/adapter";
import { buildDecisionReceipt } from "@/engine/decisions/receipt";
import { getAuthorizedFacts } from "@/lib/facts";

const ReceiptRequestSchema = z.object({
  meetingId: z.string().min(1),
  principalId: z.literal("demo_product"),
  eventId: z.string().min(1),
  acceptedWording: z.string().min(1).max(1_000),
  factIds: z.array(z.string().min(1)).min(1).max(3),
  collisionId: z.string().min(1),
  graphPathIds: z.array(z.string()),
});

/** Creates a verified, non-persistent demo receipt from server-owned fixture facts. */
export async function POST(request: Request) {
  const parsed = ReceiptRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid receipt request" }, { status: 400 });
  const input = parsed.data;
  const facts = getAuthorizedFacts(input.principalId, "default").filter((fact) => input.factIds.includes(fact.factId));
  if (facts.length !== input.factIds.length) return NextResponse.json({ error: "Requested evidence is unavailable" }, { status: 400 });
  const now = new Date().toISOString();
  const result = buildDecisionReceipt({
    decision: {
      schemaVersion: 2,
      decisionId: `decision:${input.meetingId}:${input.eventId}`,
      workspaceId: "demo",
      statement: input.acceptedWording,
      status: "active",
      sourceEventIds: [input.eventId],
      evidenceFactIds: input.factIds,
      madeAt: now,
      supersession: { state: "active", supersedes: [], supersededBy: [], effectiveFrom: now, effectiveTo: null, reason: null, recordedAt: null },
    },
    principalId: input.principalId,
    createdAt: now,
    createdFromEventId: input.eventId,
    outcome: "conditional",
    verifierVersion: "rules-v2",
    collisionIds: [input.collisionId],
    graphPathIds: input.graphPathIds,
    facts: facts.map((fact) => adaptLegacyFact(fact, "demo")),
  });
  return result.state === "complete"
    ? NextResponse.json(result.receipt, { status: 201 })
    : NextResponse.json({ error: result.message }, { status: 400 });
}
