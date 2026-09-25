import type { EventV2 } from "@/domain/events/schema";
import type { FactV2 } from "@/domain/facts/schema";
import type { CollisionRecord } from "@/lib/schemas";

export type RuleOutcome =
  | { state: "consistent" }
  | { state: "insufficient" }
  | { state: "conflict"; collisionType: CollisionRecord["collisionType"]; severity: CollisionRecord["severity"]; reasonCode: string; factIds: string[] };
export type VerificationRule = { name: string; evaluate(event: EventV2, facts: FactV2[]): RuleOutcome };
export const isConditional = (statement: string) => /\b(after|if|pending|once|when|targeting|maybe|might|could)\b/i.test(statement);
export const structured = (fact: FactV2) => (fact.value && typeof fact.value === "object" ? fact.value as Record<string, unknown> : {});
