import { describe, expect, it } from "vitest";
import { AnalyzeTurnRequestSchema, ConversationEventSchema } from "./schemas";

describe("schemas", () => {
  it("rejects unknown event enum values", () => {
    const result = ConversationEventSchema.safeParse({
      eventId: "e1",
      meetingId: "m1",
      eventType: "vibe_check",
      certainty: "approved",
      canonicalStatement: "",
      actorId: null,
      entities: [],
      deadline: null,
      assignee: null,
      priority: null,
      polarity: "neutral",
      sourceTurnIds: [],
      contextResolved: false,
    });
    expect(result.success).toBe(false);
  });

  it("enforces the eight-turn context bound", () => {
    const repeated = Array.from({ length: 9 }, (_, index) => ({
      turnId: `t${index}`,
      meetingId: "m1",
      speakerId: "maya",
      speakerLabel: "Maya",
      textRaw: "A final turn",
      isFinal: true,
      startedAt: "2026-09-19T09:00:00.000Z",
      endedAt: "2026-09-19T09:00:01.000Z",
    }));
    expect(
      AnalyzeTurnRequestSchema.safeParse({
        meetingId: "m1",
        principalId: "demo_product",
        recentTurns: repeated,
        currentTurn: repeated[0],
        factsVariant: "default",
      }).success,
    ).toBe(false);
  });
});
