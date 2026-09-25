import { describe, expect, it } from "vitest";
import { adaptConversationEvent } from "@/domain/events/adapter";
import { adaptLegacyFact } from "@/domain/facts/adapter";
import { resolveEvent } from "@/lib/analyze";
import { getAuthorizedFacts } from "@/lib/facts";
import type { TranscriptTurn } from "@/lib/schemas";
import { approvalRule, capacityRule, dependencyRule, ownershipRule, previousDecisionRule, statusRule } from "./rules/generic";
import { verifyEvent } from "./verifier";

const turn = (textRaw: string): TranscriptTurn => ({ turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw, isFinal: true, startedAt: "2026-09-26T00:00:00.000Z", endedAt: "2026-09-26T00:00:01.000Z" });
const rules = [statusRule, approvalRule, capacityRule, dependencyRule, ownershipRule, previousDecisionRule];
describe("generic verifier", () => {
  it("returns only existing Fact IDs for a generic approval conflict", () => {
    const event = adaptConversationEvent(resolveEvent([], turn("Let's promise Feature X to Acme by Friday.")), "demo");
    const facts = getAuthorizedFacts("demo_product", "default").map((fact) => adaptLegacyFact(fact, "demo"));
    expect(verifyEvent(event, facts, rules)).toMatchObject({ state: "conflict", collisionType: "legal_or_policy", factIds: ["F-LEGAL-1"] });
  });
});
