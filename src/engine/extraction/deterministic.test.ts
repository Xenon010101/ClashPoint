import { describe, expect, it } from "vitest";
import { resolveEvent } from "@/lib/analyze";
import type { TranscriptTurn } from "@/lib/schemas";
import { createDeterministicEventExtractor } from "./deterministic";

const turn = (textRaw: string): TranscriptTurn => ({ turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw, isFinal: true, startedAt: "2026-09-26T00:00:00.000Z", endedAt: "2026-09-26T00:00:01.000Z" });

describe("DeterministicEventExtractor", () => {
  it("uses bounded context and abstains for non-operational conversation", async () => {
    const extractor = createDeterministicEventExtractor(resolveEvent);
    await expect(extractor.extract({ workspaceId: "demo", recentTurns: [turn("Did you watch the match?")], currentTurn: turn("Yeah.") })).resolves.toMatchObject({ state: "abstained" });
  });
});
