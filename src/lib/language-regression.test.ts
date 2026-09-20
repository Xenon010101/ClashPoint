import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeTurn } from "./analyze";
import type { TranscriptTurn } from "./schemas";

const turn = (textRaw: string, index: number): TranscriptTurn => ({
  turnId: String(index), meetingId: "language", speakerId: "maya", speakerLabel: "Maya",
  textRaw, isFinal: true, startedAt: "2026-09-20T09:00:00.000Z", endedAt: "2026-09-20T09:00:01.000Z",
});

async function check(current: string, recent: string[] = []) {
  return analyzeTurn({
    meetingId: "language", principalId: "demo_product", factsVariant: "default",
    recentTurns: recent.map(turn), currentTurn: turn(current, recent.length),
  });
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("additional language regressions (separate from the frozen demo score)", () => {
  it.each([
    ["Yeah.", ["Should we promise Feature X Friday?", "Did you watch the match?"]],
    ["Yeah.", ["Are all Acme blockers cleared?", "No.", "Yeah."]],
    ["Friday.", ["When did you watch the match?"]],
    ["Yeah.", ["Should we promise Feature Y tomorrow?"]],
    ["Let's give it to her.", ["Feature X is the new P0.", "Valya or Maya could take it."]],
    ["Let's give it to her.", ["Feature X is the new P0.", "Valya has context.", "Did you watch the match?"]],
    ["Let's give it to her.", ["Feature X is new work.", "Valya has context."]],
    ["Yeah.", ["We should not promise Feature X Friday."]],
  ] as [string, string[]][])("leaves ambiguous reference unresolved: %s / %j", async (current, recent) => {
    const result = await check(current, recent);
    expect(result.event.eventType).toBe("none");
    expect(result.card).toBeNull();
  });

  it.each([
    "We won't promise Feature X on Friday.",
    "Do not assign the P0 to Valya.",
    "We should not build a custom export for Acme.",
    "We will ship Feature X once Legal approves.",
    "Assign the new P0 to Valya after her existing item closes.",
    "Could we build a custom export for Acme?",
    "SSO ships if QA passes.",
  ])("does not interrupt negation or uncertainty: %s", async (current) => {
    const result = await check(current);
    expect(result.collision?.severity).not.toBe("interrupt");
  });

  it.each([
    ["We commit to delivering Feature X to Acme.", "legal_or_policy"],
    ["Assign Valya the additional P0 item.", "capacity_conflict"],
    ["SSO will launch next week.", "dependency_blocker"],
  ])("detects an explicit paraphrased decision: %s", async (current, type) => {
    expect((await check(current)).collision?.collisionType).toBe(type);
  });

  it("does not invent a Friday deadline", async () => {
    const result = await check("We commit to delivering Feature X to Acme.");
    expect(result.event.deadline).toBeNull();
    expect(result.event.canonicalStatement).not.toContain("Friday");
  });

  it("does not let Gemini override deliberately unresolved short replies", async () => {
    vi.stubEnv("GEMINI_ENABLED", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await check("Yeah.", ["Should we promise Feature X?", "Did you watch the match?"])).card).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
