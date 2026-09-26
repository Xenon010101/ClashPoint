import type { FactV2 } from "@/domain/facts/schema";

/** Selects only facts safe for present-tense verification; history remains available for receipts. */
export function selectCurrentFacts(facts: FactV2[]): FactV2[] {
  const supersededIds = new Set(facts.flatMap((fact) => fact.supersession.supersedes));
  return facts.filter((fact) =>
    fact.status === "active" &&
    fact.supersession.state === "active" &&
    !supersededIds.has(fact.factId),
  );
}
