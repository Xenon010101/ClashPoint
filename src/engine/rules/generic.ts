import type { VerificationRule } from "./types";
import { isConditional, structured } from "./types";

const active = (facts: Parameters<VerificationRule["evaluate"]>[1], predicate: string) => facts.filter((fact) => fact.status === "active" && fact.predicate === predicate);
const entityMentioned = (event: Parameters<VerificationRule["evaluate"]>[0], ref: string) => event.entityRefs.some((entity) => entity.entityId === ref || event.canonicalStatement.toLowerCase().includes(entity.label.toLowerCase()));

export const statusRule: VerificationRule = { name: "status", evaluate(event, facts) {
  if (event.eventType !== "status_change" || !/blockers?.*(cleared|closed|resolved)/i.test(event.canonicalStatement)) return { state: "consistent" };
  const fact = active(facts, "depends_on").find((item) => structured(item).issueState === "open");
  return fact ? { state: "conflict", collisionType: "status_mismatch", severity: "side_panel", reasonCode: "asserted_status_not_supported", factIds: [fact.factId] } : { state: "insufficient" };
} };

export const approvalRule: VerificationRule = { name: "approval", evaluate(event, facts) {
  if (event.eventType !== "commitment" || isConditional(event.canonicalStatement)) return { state: "consistent" };
  const fact = active(facts, "requires_approval").find((item) => entityMentioned(event, item.subjectRef));
  return fact ? { state: "conflict", collisionType: "legal_or_policy", severity: "interrupt", reasonCode: "conditional_requirement_unmet", factIds: [fact.factId] } : { state: "insufficient" };
} };

export const dependencyRule: VerificationRule = { name: "dependency", evaluate(event, facts) {
  if (event.eventType !== "deadline" || isConditional(event.canonicalStatement)) return { state: "consistent" };
  const fact = active(facts, "depends_on").find((item) => entityMentioned(event, item.subjectRef));
  return fact ? { state: "conflict", collisionType: "dependency_blocker", severity: event.certainty === "tentative" ? "side_panel" : "interrupt", reasonCode: "active_blocker", factIds: [fact.factId] } : { state: "insufficient" };
} };

export const capacityRule: VerificationRule = { name: "capacity", evaluate(event, facts) {
  if (event.eventType !== "assignment" || !event.assignee || event.priority?.toLowerCase() !== "p0") return { state: "consistent" };
  const fact = active(facts, "has_capacity_limit").find((item) => item.subjectRef.toLowerCase() === `person:${event.assignee!.toLowerCase()}` && Number(structured(item).activeP0Count) >= Number(structured(item).p0Limit));
  return fact ? { state: "conflict", collisionType: "capacity_conflict", severity: "interrupt", reasonCode: "capacity_limit_reached", factIds: [fact.factId] } : { state: "insufficient" };
} };

export const ownershipRule: VerificationRule = { name: "ownership", evaluate(event, facts) {
  if (!event.assignee) return { state: "consistent" };
  const fact = active(facts, "owned_by").find((item) => entityMentioned(event, item.subjectRef) && item.objectRef?.toLowerCase() !== `person:${event.assignee!.toLowerCase()}`);
  return fact ? { state: "conflict", collisionType: "ownership_conflict", severity: "side_panel", reasonCode: "known_owner_mismatch", factIds: [fact.factId] } : { state: "insufficient" };
} };

export const previousDecisionRule: VerificationRule = { name: "previous-decision", evaluate(event, facts) {
  if (event.eventType !== "decision") return { state: "consistent" };
  const fact = active(facts, "previously_decided").find((item) => entityMentioned(event, item.subjectRef) && (!item.objectRef || entityMentioned(event, item.objectRef)));
  return fact ? { state: "conflict", collisionType: "previous_decision", severity: isConditional(event.canonicalStatement) ? "side_panel" : "interrupt", reasonCode: "contradicts_recorded_decision", factIds: [fact.factId] } : { state: "insufficient" };
} };
