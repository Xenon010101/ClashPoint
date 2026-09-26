import type { EventV2 } from "@/domain/events/schema";
import type { FactV2 } from "@/domain/facts/schema";
import { selectCurrentFacts } from "@/domain/common/current-state";
import type { VerificationRule, RuleOutcome } from "./rules/types";

export function verifyEvent(event: EventV2, facts: FactV2[], rules: VerificationRule[]): RuleOutcome {
  const currentFacts = selectCurrentFacts(facts);
  for (const rule of rules) {
    const result = rule.evaluate(event, currentFacts);
    if (result.state === "conflict") return result;
  }
  return currentFacts.length === 0 ? { state: "insufficient" } : { state: "consistent" };
}
