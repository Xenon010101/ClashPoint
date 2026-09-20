import { getAuthorizedFacts } from "./facts";
import { resolveWithGemini } from "./gemini";
import type {
  AnalyzeTurnRequest,
  AnalyzeTurnResponse,
  CollisionRecord,
  ConversationEvent,
  Fact,
  ResolutionCard,
  TranscriptTurn,
} from "./schemas";

const YES = /^(yes|yeah|yep|agreed|correct|sure|do it)[.!]?$/i;
const NO = /^(no|nope|not yet|don't|do not|cancel it)[.!]?$/i;
const DAY = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week)[.!]?$/i;

function eventBase(turn: TranscriptTurn): ConversationEvent {
  return {
    eventId: `evt_${turn.turnId}`,
    meetingId: turn.meetingId,
    eventType: "none",
    certainty: "idea",
    canonicalStatement: "",
    actorId: turn.speakerId,
    entities: [],
    deadline: null,
    assignee: null,
    priority: null,
    polarity: "neutral",
    sourceTurnIds: [turn.turnId],
    contextResolved: false,
  };
}

function lastOperationalContext(recentTurns: TranscriptTurn[]) {
  // A new topic consumes the pending dialogue; never search past it for an old question.
  const last = recentTurns.at(-1);
  return last && /blocker|promise|commit|ship|launch|own|assign|p0|approved|legal|auth refactor|custom export|deadline/i.test(last.textRaw)
    ? last : undefined;
}

export function resolveEvent(recentTurns: TranscriptTurn[], turn: TranscriptTurn): ConversationEvent {
  const event = eventBase(turn);
  const text = turn.textRaw.trim();
  const lower = text.toLowerCase();
  const previous = recentTurns.at(-1);
  const context = lastOperationalContext(recentTurns);
  const contextText = context?.textRaw.toLowerCase() ?? "";

  // Negation and unresolved references must not be promoted into commitments.
  const negative = /\b(do not|don't|don’t|will not|won't|won’t|cannot|can't|can’t|should not|shouldn't|shouldn’t)\b/i;
  if (negative.test(text) && /promise|commit|ship|launch|assign|give|build|own/i.test(text)) {
    return { ...event, eventType: "reversal", certainty: "reversed", canonicalStatement: text, polarity: "negative" };
  }
  if (YES.test(text) && negative.test(contextText)) return event;

  if (YES.test(text) && context) {
    event.certainty = "approved";
    event.polarity = "positive";
    event.contextResolved = true;
    event.sourceTurnIds = [context.turnId, turn.turnId];
    if (/acme/.test(contextText) && /blocker/.test(contextText) && /(clear|resolved|closed)/.test(contextText)) {
      event.eventType = "status_change";
      event.canonicalStatement = "All Acme blockers are confirmed cleared.";
      event.entities = [{ type: "customer", value: "Acme" }];
      return event;
    }
    if (/promise|commit/.test(contextText) && /feature x/.test(contextText)) {
      event.eventType = "commitment";
      event.canonicalStatement = `Approved: ${context.textRaw}`;
      event.entities = [
        { type: "feature", value: "Feature X" },
        { type: "customer", value: "Acme" },
      ];
      event.deadline = /friday/.test(contextText) ? "Friday" : null;
      return event;
    }
    if (/auth refactor/.test(contextText) && /(valya|diego)/.test(contextText)) {
      const assignee = /valya/.test(contextText) ? "Valya" : "Diego";
      event.eventType = "status_change";
      event.canonicalStatement = `${assignee} is confirmed as the owner of Auth Refactor.`;
      event.entities = [{ type: "issue", value: "Auth Refactor" }];
      event.assignee = assignee;
      return event;
    }
  }

  if (NO.test(text) && context) {
    if (/legal|dpa|approved/.test(contextText) && /not yet/i.test(text)) {
      return {
        ...event,
        eventType: "status_change",
        certainty: "approved",
        canonicalStatement: "Legal approval for the DPA remains pending.",
        entities: [{ type: "approval", value: "DPA" }],
        polarity: "negative",
        sourceTurnIds: [context.turnId, turn.turnId],
        contextResolved: true,
      };
    }
    return {
      ...event,
      eventType: "reversal",
      certainty: "reversed",
      canonicalStatement: `The pending proposal was rejected: ${context.textRaw}`,
      polarity: "negative",
      sourceTurnIds: [context.turnId, turn.turnId],
      contextResolved: true,
    };
  }

  if (DAY.test(text) && previous && /when|what day/i.test(previous.textRaw) && /commit|launch|ship|deadline/i.test(previous.textRaw)) {
    return {
      ...event,
      eventType: "deadline",
      certainty: "approved",
      canonicalStatement: `The launch deadline is ${text.replace(/[.!]$/, "")}.`,
      deadline: text.replace(/[.!]$/, ""),
      polarity: "positive",
      sourceTurnIds: [previous.turnId, turn.turnId],
      contextResolved: true,
    };
  }

  if (/^(valya|diego)[.!]?$/i.test(text) && context && /who.*own|assign.*p0|owner/i.test(contextText) && /\bp0\b/.test(contextText)) {
    const assignee = /^valya/i.test(text) ? "Valya" : "Diego";
    return {
      ...event,
      eventType: "assignment",
      certainty: "approved",
      canonicalStatement: `${assignee} is assigned to the new P0 work.`,
      entities: [{ type: "person", value: assignee }],
      assignee,
      priority: "P0",
      polarity: "positive",
      sourceTurnIds: [context.turnId, turn.turnId],
      contextResolved: true,
    };
  }

  if (/scratch that|cancel the|not anymore/.test(lower)) {
    return {
      ...event,
      eventType: "reversal",
      certainty: "reversed",
      canonicalStatement: "The recent commitment is cancelled.",
      polarity: "negative",
      contextResolved: Boolean(context),
      sourceTurnIds: context ? [context.turnId, turn.turnId] : [turn.turnId],
    };
  }

  const conditional = /\b(after|if|pending|once|when)\b/.test(lower);
  const tentative = /\b(maybe|might|could|should we|targeting|pending|provided|unless)\b/.test(lower) || (conditional && !/even if/.test(lower)) || text.endsWith("?");

  if (/feature x/.test(lower) && /useful someday|maybe useful|explore someday/.test(lower)) {
    return {
      ...event,
      eventType: "decision",
      certainty: "idea",
      canonicalStatement: "Feature X may be useful in the future.",
      entities: [{ type: "feature", value: "Feature X" }],
      polarity: "neutral",
    };
  }


  if (/project secret/.test(lower) && /(promise|commit|ship|launch)/.test(lower)) {
    return {
      ...event,
      eventType: "commitment",
      certainty: tentative ? "tentative" : "committed",
      canonicalStatement: "Project Secret is committed for Friday.",
      entities: [{ type: "project", value: "Project Secret" }],
      deadline: /friday/.test(lower) ? "Friday" : null,
      polarity: "positive",
    };
  }

  if (/custom export/.test(lower) && /acme/.test(lower)) {
    const reconsidering = tentative || /reconsider|review|whether|should we/.test(lower);
    return {
      ...event,
      eventType: "decision",
      certainty: reconsidering ? "proposal" : "committed",
      canonicalStatement: reconsidering
        ? "The team proposes reconsidering a custom export for Acme."
        : "The team commits to building a custom export for Acme.",
      entities: [
        { type: "customer", value: "Acme" },
        { type: "feature", value: "Custom export" },
      ],
      polarity: "positive",
    };
  }

  if (/auth refactor/.test(lower) && /\bp0\b/.test(lower) && /diego/.test(lower) && /move|make|keep/.test(lower)) {
    return {
      ...event,
      eventType: "priority_change",
      certainty: "committed",
      canonicalStatement: "Auth Refactor is moved to P0 and remains assigned to Diego.",
      entities: [{ type: "issue", value: "Auth Refactor" }],
      assignee: "Diego",
      priority: "P0",
      polarity: "positive",
    };
  }

  if (/give it to her|assign it to her/.test(lower)) {
    const referenceTurns = recentTurns.slice(-2);
    const subject = referenceTurns[0]?.textRaw ?? "";
    const owner = referenceTurns.at(-1)?.textRaw ?? "";
    // Resolve only the tightly scoped, unambiguous subject/owner pair.
    const clearOwner = /^(valya) (has|is|would|should)\b/i.test(owner) && !/\b(and|or|maya|diego)\b/i.test(owner);
    if (/feature x/i.test(subject) && /\bp0\b/i.test(subject) && clearOwner) {
      return {
        ...event,
        eventType: "assignment",
        certainty: tentative ? "proposal" : "approved",
        canonicalStatement: "The new Feature X P0 is assigned to Valya.",
        entities: [
          { type: "feature", value: "Feature X" },
          { type: "person", value: "Valya" },
        ],
        assignee: "Valya",
        priority: "P0",
        polarity: "positive",
        sourceTurnIds: [...recentTurns.slice(-2).map((item) => item.turnId), turn.turnId],
        contextResolved: true,
      };
    }
    return event;
  }

  const isFeaturePromise = /feature x/.test(lower) && /(promise|commit|ship|launch|deliver|targeting)/.test(lower);
  if (isFeaturePromise) {
    return {
      ...event,
      eventType: "commitment",
      certainty: tentative ? "tentative" : "committed",
      canonicalStatement: tentative ? `Tentative: ${text}` : text,
      entities: [
        { type: "feature", value: "Feature X" },
        { type: "customer", value: "Acme" },
      ],
      deadline: /friday/.test(lower) ? "Friday" : null,
      polarity: "positive",
    };
  }

  if (/\bp0\b/.test(lower) && /valya/.test(lower) && /(give|assign|owner|take)/.test(lower)) {
    return {
      ...event,
      eventType: "assignment",
      certainty: tentative ? "proposal" : "committed",
      canonicalStatement: tentative
        ? "Valya is proposed to take the new P0 after capacity becomes available."
        : "The new work is P0 and assigned to Valya.",
      entities: [{ type: "person", value: "Valya" }],
      assignee: "Valya",
      priority: "P0",
      polarity: "positive",
    };
  }

  if (/sso/.test(lower) && /(ship|launch)/.test(lower)) {
    return {
      ...event,
      eventType: "deadline",
      certainty: tentative ? "tentative" : "committed",
      canonicalStatement: /(?:after|once|when).*auth refactor.*(?:complete|closes|closed|done)/i.test(text)
        ? "SSO will ship after Auth Refactor is complete."
        : text,
      entities: [{ type: "feature", value: "SSO" }],
      deadline: /friday/.test(lower) ? "Friday" : null,
      polarity: "positive",
    };
  }

  if (/valya/.test(lower) && /auth refactor/.test(lower) && /(own|on|assigned)/.test(lower)) {
    return {
      ...event,
      eventType: "status_change",
      certainty: "approved",
      canonicalStatement: "Valya owns Auth Refactor.",
      entities: [{ type: "issue", value: "Auth Refactor" }],
      assignee: "Valya",
      polarity: "positive",
    };
  }

  if (tentative && /friday|next week|deadline|done by/.test(lower)) {
    return {
      ...event,
      eventType: "deadline",
      certainty: "tentative",
      canonicalStatement: "The work might be complete by Friday.",
      deadline: /friday/.test(lower) ? "Friday" : null,
      polarity: "neutral",
    };
  }

  return event;
}

export function decideGate(event: ConversationEvent) {
  if (event.eventType === "none") return { lane: "ignore" as const, reasons: ["event_type=none"] };
  if (event.certainty === "idea") return { lane: "ignore" as const, reasons: ["certainty=idea"] };
  if (event.certainty === "proposal" || event.certainty === "tentative") {
    return { lane: "quiet_check" as const, reasons: [`certainty=${event.certainty}`] };
  }
  return {
    lane: "immediate_check" as const,
    reasons: [`event_type=${event.eventType}`, `certainty=${event.certainty}`],
  };
}

function eventTerms(event: ConversationEvent) {
  return `${event.canonicalStatement} ${event.entities.map((entity) => entity.value).join(" ")}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

export function retrieveFacts(event: ConversationEvent, facts: Fact[]) {
  const terms = eventTerms(event);
  return facts
    .filter((fact) => fact.status === "active")
    .map((fact) => {
      const haystack = `${fact.statementVerbatim} ${fact.entityKeys.join(" ")}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { fact, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ fact }) => fact);
}

export function detectCollision(
  event: ConversationEvent,
  facts: Fact[],
  lane: "ignore" | "quiet_check" | "immediate_check",
): CollisionRecord | null {
  if (lane === "ignore" || event.polarity === "negative" || event.eventType === "reversal") return null;
  const canonical = event.canonicalStatement.toLowerCase();
  const active = (id: string) => facts.find((fact) => fact.factId === id && fact.status === "active");
  let collision: Omit<CollisionRecord, "collisionId" | "meetingId" | "eventId" | "status"> | null = null;

  if (event.eventType === "status_change" && /blockers?.*cleared/.test(canonical) && active("F-DEP-1")) {
    collision = {
      collisionType: "status_mismatch",
      severity: "side_panel",
      factIds: ["F-DEP-1"],
      reasonCode: "asserted_status_not_supported",
    };
  } else if (
    event.eventType === "commitment" &&
    /feature x/.test(canonical) &&
    !/pending|tentative/.test(canonical) &&
    active("F-LEGAL-1")
  ) {
    collision = {
      collisionType: "legal_or_policy",
      severity: "interrupt",
      factIds: ["F-LEGAL-1"],
      reasonCode: "conditional_requirement_unmet",
    };
  } else if (
    event.assignee?.toLowerCase() === "valya" &&
    event.priority?.toLowerCase() === "p0" &&
    lane === "immediate_check" &&
    active("F-CAP-1")
  ) {
    collision = {
      collisionType: "capacity_conflict",
      severity: "interrupt",
      factIds: ["F-CAP-1"],
      reasonCode: "capacity_limit_reached",
    };
  } else if (
    event.eventType === "deadline" &&
    /sso/.test(canonical) &&
    !/after auth refactor is complete/.test(canonical) &&
    active("F-DEP-1")
  ) {
    collision = {
      collisionType: "dependency_blocker",
      severity: event.certainty === "tentative" ? "side_panel" : "interrupt",
      factIds: ["F-DEP-1"],
      reasonCode: "active_blocker",
    };
  } else if (event.assignee?.toLowerCase() === "valya" && /auth refactor/.test(canonical) && active("F-OWNER-1")) {
    collision = {
      collisionType: "ownership_conflict",
      severity: "side_panel",
      factIds: ["F-OWNER-1"],
      reasonCode: "known_owner_mismatch",
    };
  } else if (event.eventType === "decision" && /custom export.*acme/.test(canonical) && active("F-DEC-1")) {
    collision = {
      collisionType: "previous_decision",
      severity: lane === "quiet_check" ? "side_panel" : "interrupt",
      factIds: ["F-DEC-1"],
      reasonCode: "contradicts_recorded_decision",
    };
  }

  return collision
    ? {
        ...collision,
        collisionId: `col_${event.eventId}`,
        meetingId: event.meetingId,
        eventId: event.eventId,
        status: "active",
      }
    : null;
}

const cardCopy = {
  status_mismatch: {
    title: "Status mismatch",
    why: "The meeting confirms that blockers are cleared while a connected release blocker is still open.",
    safer: "One blocker is still open; let’s verify GH-42 before we confirm the status.",
  },
  legal_or_policy: {
    title: "Commitment conflict",
    why: "The proposed customer commitment is being made before a recorded prerequisite is complete.",
    safer: "We’re targeting Friday, pending final Legal approval.",
  },
  capacity_conflict: {
    title: "Capacity conflict",
    why: "This assignment would exceed the explicit active-P0 limit recorded for the proposed owner.",
    safer: "Make this P0 after one of Valya’s current P0 items closes, or choose another owner.",
  },
  dependency_blocker: {
    title: "Dependency conflict",
    why: "The proposed deadline precedes completion of an active dependency.",
    safer: "Target Friday only if Auth Refactor closes first; otherwise revise the date.",
  },
  ownership_conflict: {
    title: "Ownership mismatch",
    why: "The asserted owner differs from the current assignee in the connected source.",
    safer: "Confirm the ownership change in GitHub before treating it as current.",
  },
  previous_decision: {
    title: "Decision conflict",
    why: "The proposed work contradicts an active decision recorded for the same customer and feature.",
    safer: "Use the standard export workflow, or explicitly reopen and replace the recorded decision.",
  },
} as const;

export function verifyAndBuildCard(
  collision: CollisionRecord | null,
  facts: Fact[],
  eventQuote: string,
): ResolutionCard | null {
  if (!collision) return null;
  const evidenceFacts = collision.factIds
    .map((id) => facts.find((fact) => fact.factId === id))
    .filter((fact): fact is Fact => Boolean(fact && fact.status === "active"));
  if (evidenceFacts.length !== collision.factIds.length) return null;
  const copy = cardCopy[collision.collisionType];
  return {
    cardId: `card_${collision.collisionId}`,
    collisionId: collision.collisionId,
    severity: collision.severity,
    title: copy.title,
    eventQuote,
    evidence: evidenceFacts.map((fact) => ({
      factId: fact.factId,
      sourceSystem: fact.sourceSystem,
      sourceObjectId: fact.sourceObjectId,
      source: fact.sourceTitle,
      sourceDate: fact.effectiveAt.slice(0, 10),
      sourceUrl: fact.sourceUrl,
      sourceRevision: fact.sourceRevision,
      quote: fact.statementVerbatim,
      status: fact.status,
      observedAt: fact.observedAt,
    })),
    freshness: "No superseding record was found in connected demo sources.",
    whyItMatters: copy.why,
    saferWording: copy.safer,
  };
}

export async function analyzeTurn(input: AnalyzeTurnRequest): Promise<AnalyzeTurnResponse> {
  const totalStart = performance.now();
  const resolverStart = performance.now();
  let event = resolveEvent(input.recentTurns, input.currentTurn);
  const raw = input.currentTurn.textRaw.trim();
  const unresolvedReference = YES.test(raw) || NO.test(raw) || DAY.test(raw) || /give it to her|assign it to her/i.test(raw);
  const gemini = unresolvedReference
    ? { event: null, state: "skipped" as const }
    : await resolveWithGemini(event, input.recentTurns, input.currentTurn);
  if (gemini.event) event = gemini.event;
  const resolverMs = performance.now() - resolverStart;

  const gate = decideGate(event);
  const retrievalStart = performance.now();
  const authorizedFacts = getAuthorizedFacts(input.principalId, input.factsVariant);
  const candidates = gate.lane === "ignore" ? [] : retrieveFacts(event, authorizedFacts);
  const retrievalMs = performance.now() - retrievalStart;

  const collisionStart = performance.now();
  const collision = detectCollision(event, candidates, gate.lane);
  const collisionMs = performance.now() - collisionStart;

  const verificationStart = performance.now();
  const card = verifyAndBuildCard(collision, authorizedFacts, input.currentTurn.textRaw);
  const verificationMs = performance.now() - verificationStart;

  return {
    event,
    gate,
    collision: card ? collision : null,
    card,
    checks: { deterministic: "complete", semantic: gemini.state },
    timingsMs: {
      resolver: Math.round(resolverMs),
      retrieval: Math.round(retrievalMs),
      collision: Math.round(collisionMs),
      verification: Math.round(verificationMs),
      total: Math.round(performance.now() - totalStart),
    },
  };
}
