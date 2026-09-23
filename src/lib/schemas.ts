import { z } from "zod";

export const EventTypeSchema = z.enum([
  "commitment",
  "assignment",
  "deadline",
  "priority_change",
  "approval",
  "status_change",
  "dependency_claim",
  "decision",
  "reversal",
  "none",
]);

export const CertaintySchema = z.enum([
  "idea",
  "proposal",
  "tentative",
  "approved",
  "committed",
  "reversed",
]);

export const TranscriptTurnSchema = z.object({
  turnId: z.string().min(1),
  meetingId: z.string().min(1),
  speakerId: z.string().min(1),
  speakerLabel: z.string().min(1),
  textRaw: z.string().trim().min(1).max(1_000),
  isFinal: z.literal(true),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

export const ConversationEventSchema = z.object({
  eventId: z.string(),
  meetingId: z.string(),
  eventType: EventTypeSchema,
  certainty: CertaintySchema,
  canonicalStatement: z.string(),
  actorId: z.string().nullable(),
  entities: z.array(z.object({ type: z.string(), value: z.string() })),
  deadline: z.string().nullable(),
  assignee: z.string().nullable(),
  priority: z.string().nullable(),
  polarity: z.enum(["positive", "negative", "neutral"]),
  sourceTurnIds: z.array(z.string()),
  contextResolved: z.boolean(),
});

export const FactSchema = z.object({
  factId: z.string(),
  sourceSystem: z.enum(["github", "notion", "policy"]),
  sourceObjectId: z.string(),
  sourceTitle: z.string(),
  sourceUrl: z.string(),
  sourceRevision: z.string(),
  factType: z.enum([
    "dependency",
    "approval_blocker",
    "capacity",
    "ownership",
    "approval",
    "previous_decision",
  ]),
  entityKeys: z.array(z.string()),
  statementVerbatim: z.string(),
  structured: z.record(z.string(), z.unknown()),
  status: z.enum(["active", "resolved", "superseded", "expired", "unknown"]),
  effectiveAt: z.string().datetime(),
  observedAt: z.string().datetime(),
  supersedes: z.array(z.string()),
  supersededBy: z.array(z.string()),
  allowedPrincipalIds: z.array(z.string()),
});

export const CollisionRecordSchema = z.object({
  collisionId: z.string(),
  meetingId: z.string(),
  eventId: z.string(),
  collisionType: z.enum([
    "legal_or_policy",
    "dependency_blocker",
    "capacity_conflict",
    "status_mismatch",
    "ownership_conflict",
    "previous_decision",
  ]),
  severity: z.enum(["interrupt", "side_panel", "log"]),
  factIds: z.array(z.string()).min(1).max(3),
  reasonCode: z.string(),
  status: z.literal("active"),
});

export const ResolutionCardSchema = z.object({
  cardId: z.string(),
  collisionId: z.string(),
  severity: z.enum(["interrupt", "side_panel", "log"]),
  title: z.string(),
  eventQuote: z.string(),
  evidence: z.array(
    z.object({
      factId: z.string(),
      sourceSystem: z.string(),
      sourceObjectId: z.string(),
      source: z.string(),
      sourceDate: z.string(),
      sourceUrl: z.string(),
      sourceRevision: z.string(),
      quote: z.string(),
      status: z.string(),
      observedAt: z.string(),
    }),
  ),
  freshness: z.string(),
  whyItMatters: z.string(),
  saferWording: z.string().nullable(),
  evidencePath: z.array(z.object({ relation: z.string(), label: z.string() })).default([]),
});

export const AnalyzeTurnRequestSchema = z.object({
  meetingId: z.string().min(1),
  principalId: z.literal("demo_product"),
  recentTurns: z.array(TranscriptTurnSchema).max(8),
  currentTurn: TranscriptTurnSchema,
  factsVariant: z.enum(["default", "approval", "restricted"]).default("default"),
});

export const AnalyzeTurnResponseSchema = z.object({
  event: ConversationEventSchema,
  gate: z.object({
    lane: z.enum(["ignore", "quiet_check", "immediate_check"]),
    reasons: z.array(z.string()),
  }),
  collision: CollisionRecordSchema.nullable(),
  card: ResolutionCardSchema.nullable(),
  checks: z.object({
    deterministic: z.literal("complete"),
    semantic: z.enum(["complete", "skipped", "unavailable"]),
  }),
  timingsMs: z.object({
    resolver: z.number(),
    retrieval: z.number(),
    collision: z.number(),
    verification: z.number(),
    total: z.number(),
  }),
});

export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>;
export type ConversationEvent = z.infer<typeof ConversationEventSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type CollisionRecord = z.infer<typeof CollisionRecordSchema>;
export type ResolutionCard = z.infer<typeof ResolutionCardSchema>;
export type AnalyzeTurnRequest = z.infer<typeof AnalyzeTurnRequestSchema>;
export type AnalyzeTurnResponse = z.infer<typeof AnalyzeTurnResponseSchema>;
