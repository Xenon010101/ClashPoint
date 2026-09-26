import { describe, expect, it } from "vitest";
import { adaptConversationEvent } from "@/domain/events/adapter";
import { adaptLegacyFact } from "@/domain/facts/adapter";
import { resolveEvent } from "@/lib/analyze";
import { getAuthorizedFacts } from "@/lib/facts";
import type { TranscriptTurn } from "@/lib/schemas";
import { retrieveCandidates } from "./candidate-retriever";

const turn: TranscriptTurn = { turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw: "SSO ships Friday.", isFinal: true, startedAt: "2026-09-26T00:00:00.000Z", endedAt: "2026-09-26T00:00:01.000Z" };
describe("candidate retrieval", () => {
  it("returns only active authorised-input candidates with reasons", () => {
    const event = adaptConversationEvent(resolveEvent([], turn), "demo");
    const facts = getAuthorizedFacts("demo_product", "default").map((fact) => adaptLegacyFact(fact, "demo"));
    const candidates = retrieveCandidates(event, facts);
    expect(candidates[0]).toMatchObject({ fact: { factId: "F-DEP-1" }, reasons: expect.any(Array) });
  });

  it("does not retrieve a fact superseded by an approval", () => {
    const event = adaptConversationEvent(resolveEvent([], { ...turn, textRaw: "Feature X ships Friday." }), "demo");
    const facts = getAuthorizedFacts("demo_product", "approval").map((fact) => adaptLegacyFact(fact, "demo"));
    expect(retrieveCandidates(event, facts).map((candidate) => candidate.fact.factId)).not.toContain("F-LEGAL-1");
  });
});
