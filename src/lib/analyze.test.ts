import { describe, expect, it } from "vitest";
import {
  analyzeTurn,
  decideGate,
  detectCollision,
  resolveEvent,
  retrieveFacts,
  verifyAndBuildCard,
} from "./analyze";
import { getAuthorizedFacts } from "./facts";
import type { ConversationEvent, Fact, TranscriptTurn } from "./schemas";

function turn(index: number, textRaw: string, speakerLabel = "Maya"): TranscriptTurn {
  return {
    turnId: `t${index}`,
    meetingId: "mtg_test",
    speakerId: speakerLabel.toLowerCase(),
    speakerLabel,
    textRaw,
    isFinal: true,
    startedAt: `2026-09-19T09:00:0${index}.000Z`,
    endedAt: `2026-09-19T09:00:0${index}.500Z`,
  };
}

describe("conversation event resolution", () => {
  it("resolves an operational short reply from context", () => {
    const event = resolveEvent([turn(1, "Are all the Acme blockers cleared?")], turn(2, "Yeah.", "Diego"));
    expect(event.eventType).toBe("status_change");
    expect(event.contextResolved).toBe(true);
    expect(event.sourceTurnIds).toEqual(["t1", "t2"]);
  });

  it("does not promote a non-operational short reply", () => {
    const event = resolveEvent([turn(1, "Did you watch the match?")], turn(2, "Yeah.", "Diego"));
    expect(event.eventType).toBe("none");
    expect(decideGate(event).lane).toBe("ignore");
  });

  it("keeps conditional commitments below interrupt certainty", () => {
    const event = resolveEvent([], turn(1, "We’re targeting Feature X for Acme Friday, pending Legal approval."));
    expect(event.certainty).toBe("tentative");
    expect(decideGate(event).lane).toBe("quiet_check");
  });
});

describe("evidence and collisions", () => {
  it("grounds the legal card in the exact fact-store quote", async () => {
    const result = await analyzeTurn({
      meetingId: "mtg_test",
      principalId: "demo_product",
      recentTurns: [],
      currentTurn: turn(1, "Let’s promise Feature X to Acme by Friday."),
      factsVariant: "default",
    });
    expect(result.collision?.collisionType).toBe("legal_or_policy");
    expect(result.card?.evidence[0].factId).toBe("F-LEGAL-1");
    expect(result.card?.evidence[0].quote).toBe(
      "Do not proceed with Feature X until the DPA update is approved.",
    );
  });

  it("suppresses a superseded blocker", async () => {
    const result = await analyzeTurn({
      meetingId: "mtg_test",
      principalId: "demo_product",
      recentTurns: [],
      currentTurn: turn(1, "Let’s promise Feature X to Acme by Friday."),
      factsVariant: "approval",
    });
    expect(result.card).toBeNull();
  });

  it("does not authorize the restricted fixture", () => {
    const facts = getAuthorizedFacts("demo_product", "restricted");
    expect(facts.some((fact) => fact.factId === "F-PRIVATE-1")).toBe(false);
  });

  it("produces the deterministic capacity conflict", async () => {
    const result = await analyzeTurn({
      meetingId: "mtg_test",
      principalId: "demo_product",
      recentTurns: [],
      currentTurn: turn(1, "Make the new work P0 and give it to Valya."),
      factsVariant: "default",
    });
    expect(result.collision?.collisionType).toBe("capacity_conflict");
    expect(result.card?.evidence[0].factId).toBe("F-CAP-1");
  });

  it("applies the approval rule to a differently named fixture without a demo fact ID", () => {
    const event: ConversationEvent = {
      eventId: "evt_contoso", meetingId: "mtg_test", eventType: "commitment", certainty: "committed",
      canonicalStatement: "Promise Inventory Sync to Contoso by Friday.", actorId: "maya",
      entities: [{ type: "feature", value: "Inventory Sync" }, { type: "customer", value: "Contoso" }],
      deadline: "Friday", assignee: null, priority: null, polarity: "positive", sourceTurnIds: ["t1"], contextResolved: true,
    };
    const fact: Fact = {
      ...getAuthorizedFacts("demo_product", "default").find((item) => item.factType === "approval_blocker")!,
      factId: "fact:contoso:approval", entityKeys: ["feature:inventory-sync", "customer:contoso"],
    };
    expect(detectCollision(event, [fact], "immediate_check")?.factIds).toEqual(["fact:contoso:approval"]);
  });

  it("returns an evidence path made only from stored facts", async () => {
    const result = await analyzeTurn({
      meetingId: "mtg_test", principalId: "demo_product", recentTurns: [],
      currentTurn: turn(1, "SSO ships this Friday."), factsVariant: "default",
    });
    expect(result.card?.evidencePath.map((step) => step.label)).toContain("sso");
    expect(result.card?.evidencePath.map((step) => step.label)).toContain("SSO release is blocked by Auth Refactor. GH-42 remains open.");
  });

  it("rejects unknown fact IDs during verification", () => {
    const event = resolveEvent([], turn(1, "SSO ships this Friday."));
    const facts = retrieveFacts(event, getAuthorizedFacts("demo_product", "default"));
    const collision = detectCollision(event, facts, "immediate_check");
    expect(collision).not.toBeNull();
    expect(
      verifyAndBuildCard({ ...collision!, factIds: ["F-NOT-REAL"] }, facts, "SSO ships this Friday."),
    ).toBeNull();
  });
});
