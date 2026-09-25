import type { EventV2 } from "@/domain/events/schema";
import type { FactV2 } from "@/domain/facts/schema";

export type CandidateFact = { fact: FactV2; score: number; reasons: string[] };
const terms = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);

/** Accepts facts that were already authorised upstream; it never accepts a principal ID. */
export function retrieveCandidates(event: EventV2, facts: FactV2[], limit = 8): CandidateFact[] {
  const needles = new Set([...terms(event.canonicalStatement), ...event.entityRefs.flatMap((item) => terms(item.label))]);
  return facts
    .filter((fact) => fact.status === "active")
    .map((fact) => {
      const haystack = `${fact.subjectRef} ${fact.objectRef ?? ""} ${fact.statementVerbatim}`.toLowerCase();
      const reasons = [...needles].filter((term) => haystack.includes(term));
      return { fact, score: reasons.length, reasons };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.fact.factId.localeCompare(b.fact.factId))
    .slice(0, limit);
}
