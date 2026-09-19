import { analyzeTurn } from "./analyze";
import type { AnalyzeTurnRequest, TranscriptTurn } from "./schemas";

type ExpectedOutcome = {
  eventType: string;
  collisionType: string | null;
  severity: "interrupt" | "side_panel" | null;
  factIds: string[];
};

export type EvaluationCase = {
  id: string;
  name: string;
  recent: string[];
  current: string;
  factsVariant?: AnalyzeTurnRequest["factsVariant"];
  expected: ExpectedOutcome;
};

const outcome = (
  eventType: string,
  collisionType: string | null = null,
  severity: ExpectedOutcome["severity"] = null,
  factIds: string[] = [],
): ExpectedOutcome => ({ eventType, collisionType, severity, factIds });

export const EVALUATION_CASES: EvaluationCase[] = [
  { id: "E01", name: "Future idea stays quiet", recent: [], current: "Maybe Feature X would be useful someday.", expected: outcome("decision") },
  { id: "E02", name: "Direct promise meets legal hold", recent: [], current: "Let's promise Feature X to Acme by Friday.", expected: outcome("commitment", "legal_or_policy", "interrupt", ["F-LEGAL-1"]) },
  { id: "E03", name: "Short approval resolves promise", recent: ["Should we promise Feature X to Acme by Friday?"], current: "Yeah.", expected: outcome("commitment", "legal_or_policy", "interrupt", ["F-LEGAL-1"]) },
  { id: "E04", name: "Short rejection cancels promise", recent: ["Should we promise Feature X to Acme by Friday?"], current: "No.", expected: outcome("reversal") },
  { id: "E05", name: "Cleared blocker claim is checked", recent: ["Are all the Acme engineering blockers cleared?"], current: "Yeah.", expected: outcome("status_change", "status_mismatch", "side_panel", ["F-DEP-1"]) },
  { id: "E06", name: "Social short reply is ignored", recent: ["Did you watch the match?"], current: "Yeah.", expected: outcome("none") },
  { id: "E07", name: "P0 assignment exceeds capacity", recent: [], current: "Make the new work P0 and assign it to Valya.", expected: outcome("assignment", "capacity_conflict", "interrupt", ["F-CAP-1"]) },
  { id: "E08", name: "Conditional assignment stays quiet", recent: [], current: "Could Valya take this after one current P0 closes?", expected: outcome("assignment") },
  { id: "E09", name: "Priority change preserves owner", recent: [], current: "Move Auth Refactor to P0 and keep Diego as owner.", expected: outcome("priority_change") },
  { id: "E10", name: "SSO deadline meets dependency", recent: [], current: "SSO ships Friday.", expected: outcome("deadline", "dependency_blocker", "interrupt", ["F-DEP-1"]) },
  { id: "E11", name: "Dependency-aware deadline is safe", recent: [], current: "SSO ships after Auth Refactor is complete.", expected: outcome("deadline") },
  { id: "E12", name: "Committed export contradicts decision", recent: [], current: "Let's build a custom export for Acme.", expected: outcome("decision", "previous_decision", "interrupt", ["F-DEC-1"]) },
  { id: "E13", name: "Reconsideration remains advisory", recent: [], current: "Reconsider whether a custom export for Acme makes sense.", expected: outcome("decision", "previous_decision", "side_panel", ["F-DEC-1"]) },
  { id: "E14", name: "Pending approval is not a promise", recent: ["Has Legal approved the DPA?"], current: "Not yet.", expected: outcome("status_change") },
  { id: "E15", name: "Conditional launch avoids interruption", recent: [], current: "We're targeting Feature X for Acme Friday, pending Legal approval.", expected: outcome("commitment") },
  { id: "E16", name: "Explicit promise overrides caveat", recent: [], current: "Promise Acme Feature X Friday even if Legal hasn't cleared it.", expected: outcome("commitment", "legal_or_policy", "interrupt", ["F-LEGAL-1"]) },
  { id: "E17", name: "Launch cancellation is a reversal", recent: ["Feature X will launch Friday."], current: "Cancel the Friday launch.", expected: outcome("reversal") },
  { id: "E18", name: "Bare weekday resolves deadline", recent: ["When are we committing the launch?"], current: "Friday.", expected: outcome("deadline") },
  { id: "E19", name: "Named owner resolves P0 question", recent: ["Who should own the new P0?"], current: "Valya.", expected: outcome("assignment", "capacity_conflict", "interrupt", ["F-CAP-1"]) },
  { id: "E20", name: "Do it resolves customer promise", recent: ["Should we promise Feature X to Acme by Friday?"], current: "Do it.", expected: outcome("commitment", "legal_or_policy", "interrupt", ["F-LEGAL-1"]) },
  { id: "E21", name: "Immediate correction wins", recent: ["Let's promise Feature X to Acme Friday."], current: "Actually, scratch that.", expected: outcome("reversal") },
  { id: "E22", name: "Tentative date stays quiet", recent: [], current: "It might be done by Friday.", expected: outcome("deadline") },
  { id: "E23", name: "Superseding approval removes alert", recent: [], current: "Let's ship Feature X to Acme Friday.", factsVariant: "approval", expected: outcome("commitment") },
  { id: "E24", name: "Restricted fact remains invisible", recent: [], current: "Let's ship Project Secret Friday.", factsVariant: "restricted", expected: outcome("commitment") },
  { id: "E25", name: "Pronoun resolves recent P0 owner", recent: ["Feature X is the new P0.", "Valya has the closest context."], current: "Let's give it to her.", expected: outcome("assignment", "capacity_conflict", "interrupt", ["F-CAP-1"]) },
  { id: "E26", name: "Current owner confirmation agrees", recent: ["Is Diego still on Auth Refactor?"], current: "Yeah.", expected: outcome("status_change") },
  { id: "E27", name: "Wrong owner confirmation is flagged", recent: ["Is Valya still on Auth Refactor?"], current: "Yeah.", expected: outcome("status_change", "ownership_conflict", "side_panel", ["F-OWNER-1"]) },
];

function makeTurn(caseId: string, index: number, textRaw: string): TranscriptTurn {
  const startedAt = new Date(Date.UTC(2026, 8, 19, 8, 30, index)).toISOString();
  return {
    turnId: `${caseId.toLowerCase()}_${index}`,
    meetingId: `eval_${caseId.toLowerCase()}`,
    speakerId: index % 2 === 0 ? "maya" : "diego",
    speakerLabel: index % 2 === 0 ? "Maya" : "Diego",
    textRaw,
    isFinal: true,
    startedAt,
    endedAt: startedAt,
  };
}

export async function runEvaluation() {
  const results = await Promise.all(
    EVALUATION_CASES.map(async (testCase) => {
      const recentTurns = testCase.recent.map((text, index) => makeTurn(testCase.id, index, text));
      const currentTurn = makeTurn(testCase.id, recentTurns.length, testCase.current);
      const response = await analyzeTurn({
        meetingId: currentTurn.meetingId,
        principalId: "demo_product",
        recentTurns,
        currentTurn,
        factsVariant: testCase.factsVariant ?? "default",
      });
      const actualFactIds = response.card?.evidence.map((item) => item.factId) ?? [];
      const eventMatches = response.event.eventType === testCase.expected.eventType;
      const collisionMatches =
        (response.collision?.collisionType ?? null) === testCase.expected.collisionType &&
        (response.collision?.severity ?? null) === testCase.expected.severity;
      const evidenceMatches =
        actualFactIds.length === testCase.expected.factIds.length &&
        testCase.expected.factIds.every((factId) => actualFactIds.includes(factId));
      return {
        id: testCase.id,
        name: testCase.name,
        passed: eventMatches && collisionMatches && evidenceMatches,
        expected: testCase.expected,
        actual: {
          eventType: response.event.eventType,
          collisionType: response.collision?.collisionType ?? null,
          severity: response.collision?.severity ?? null,
          factIds: actualFactIds,
        },
        checks: { eventMatches, collisionMatches, evidenceMatches },
        latencyMs: response.timingsMs.total,
      };
    }),
  );

  const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const collisions = results.filter((result) => result.expected.collisionType !== null);
  const grounded = collisions.filter((result) => result.checks.evidenceMatches);
  const falseInterruptions = results.filter(
    (result) => result.actual.severity === "interrupt" && result.expected.severity !== "interrupt",
  ).length;
  const percent = (count: number) => Math.round((count / results.length) * 1000) / 10;

  return {
    generatedAt: new Date().toISOString(),
    fixtureVersion: "hackathon-27-v1",
    metrics: {
      cases: results.length,
      passed: results.filter((result) => result.passed).length,
      eventAccuracyPercent: percent(results.filter((result) => result.checks.eventMatches).length),
      collisionAccuracyPercent: percent(results.filter((result) => result.checks.collisionMatches).length),
      groundedEvidencePercent: collisions.length ? Math.round((grounded.length / collisions.length) * 1000) / 10 : 100,
      falseInterruptions,
      medianLatencyMs: latencies[Math.floor(latencies.length / 2)] ?? 0,
    },
    results,
  };
}
