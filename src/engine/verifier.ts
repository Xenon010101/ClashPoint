import type { EventV2 } from "@/domain/events/schema";
import type { FactV2 } from "@/domain/facts/schema";
import type { VerificationRule, RuleOutcome } from "./rules/types";

export function verifyEvent(event: EventV2, facts: FactV2[], rules: VerificationRule[]): RuleOutcome {
  for (const rule of rules) {
    const result = rule.evaluate(event, facts);
    if (result.state === "conflict") return result;
  }
  return facts.length === 0 ? { state: "insufficient" } : { state: "consistent" };
}
