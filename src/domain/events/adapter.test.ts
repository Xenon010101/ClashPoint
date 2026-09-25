import { describe, expect, it } from "vitest";
import { resolveEvent } from "@/lib/analyze";
import type { TranscriptTurn } from "@/lib/schemas";
import { adaptConversationEvent } from "./adapter";

const turn: TranscriptTurn = { turnId: "t1", meetingId: "meeting", speakerId: "maya", speakerLabel: "Maya", textRaw: "SSO ships Friday.", isFinal: true, startedAt: "2026-09-26T10:00:00.000Z", endedAt: "2026-09-26T10:00:01.000Z" };

describe("legacy event adapter", () => {
  it("preserves the source event while adding typed entity and extraction metadata", () => {
    const legacy = resolveEvent([], turn);
    const event = adaptConversationEvent(legacy, "demo");
    expect(event.canonicalStatement).toBe(legacy.canonicalStatement);
    expect(event.entityRefs).toEqual([{ entityId: "feature:sso", type: "feature", label: "SSO" }]);
    expect(event.extraction).toMatchObject({ method: "deterministic", abstained: false });
  });
});
