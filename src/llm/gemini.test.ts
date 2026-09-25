import { describe, expect, it } from "vitest";
import { resolveEvent } from "@/lib/analyze";
import type { TranscriptTurn } from "@/lib/schemas";
import { createGeminiEventExtractor } from "./gemini";

const turn: TranscriptTurn = { turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw: "unusual wording", isFinal: true, startedAt: "2026-09-26T00:00:00.000Z", endedAt: "2026-09-26T00:00:01.000Z" };
describe("Gemini EventExtractor adapter", () => {
  it("keeps provider failure distinct from a no-event result", async () => {
    const extractor = createGeminiEventExtractor(resolveEvent, async () => ({ event: null, state: "unavailable" }));
    await expect(extractor.extract({ workspaceId: "demo", recentTurns: [], currentTurn: turn })).resolves.toEqual({ state: "unavailable", reason: "Semantic interpretation is unavailable." });
  });

  it("does not let a semantic result author evidence", async () => {
    const extractor = createGeminiEventExtractor(resolveEvent, async (base) => ({ event: { ...base, eventType: "commitment", canonicalStatement: "Target a launch", entities: [] }, state: "complete" }));
    const result = await extractor.extract({ workspaceId: "demo", recentTurns: [], currentTurn: turn });
    expect(result).toMatchObject({ state: "complete", event: { extraction: { method: "gemini" } } });
    expect(JSON.stringify(result)).not.toContain("factId");
  });
});
