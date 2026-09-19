// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const baseTurn = {
  turnId: "t1",
  meetingId: "m1",
  speakerId: "maya",
  speakerLabel: "Maya",
  textRaw: "Let’s promise Feature X to Acme by Friday.",
  isFinal: true,
  startedAt: "2026-09-19T09:00:00.000Z",
  endedAt: "2026-09-19T09:00:01.000Z",
};

function request(overrides: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/analyze-turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meetingId: "m1",
      principalId: "demo_product",
      recentTurns: [],
      currentTurn: baseTurn,
      factsVariant: "default",
      ...overrides,
    }),
  });
}

afterEach(() => {
  delete process.env.GEMINI_ENABLED;
  delete process.env.GEMINI_AUTH_KEY;
  delete process.env.GEMINI_MODEL;
});

describe("POST /api/analyze-turn", () => {
  it("returns a verified golden-path card", async () => {
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.card.evidence[0].factId).toBe("F-LEGAL-1");
  });

  it("rejects invalid requests", async () => {
    const response = await POST(request({ principalId: "unknown" }));
    expect(response.status).toBe(400);
  });

  it("suppresses superseded evidence and restricted fact existence", async () => {
    const approvalResponse = await POST(request({ factsVariant: "approval" }));
    expect((await approvalResponse.json()).card).toBeNull();

    const restrictedResponse = await POST(
      request({
        factsVariant: "restricted",
        currentTurn: { ...baseTurn, textRaw: "Let’s ship Project Secret Friday." },
      }),
    );
    expect(JSON.stringify(await restrictedResponse.json())).not.toContain("F-PRIVATE-1");
  });

  it("reports semantic checks unavailable when enabled without credentials", async () => {
    process.env.GEMINI_ENABLED = "true";
    const response = await POST(
      request({ currentTurn: { ...baseTurn, textRaw: "We should lock in the unusual launch arrangement." } }),
    );
    expect((await response.json()).checks.semantic).toBe("unavailable");
  });
});
