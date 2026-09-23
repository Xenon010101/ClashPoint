import { z } from "zod";
import { SupersessionSchema } from "@/domain/common/supersession";

export const DecisionSchema = z.object({
  schemaVersion: z.literal(2),
  decisionId: z.string().min(1),
  workspaceId: z.string().min(1),
  statement: z.string().min(1),
  status: z.enum(["active", "superseded"]),
  sourceEventIds: z.array(z.string()).min(1),
  evidenceFactIds: z.array(z.string()),
  madeAt: z.string().datetime(),
  supersession: SupersessionSchema,
});

export const DecisionReceiptSchema = z.object({
  schemaVersion: z.literal(2),
  receiptId: z.string().min(1),
  workspaceId: z.string().min(1),
  decisionId: z.string().min(1),
  createdAt: z.string().datetime(),
  createdFromEventId: z.string().min(1),
  acceptedWording: z.string().min(1),
  verification: z.object({
    outcome: z.enum(["conflict", "consistent", "conditional", "insufficient", "unavailable"]),
    verifierVersion: z.string().min(1),
    checkedFactIds: z.array(z.string()),
    collisionIds: z.array(z.string()),
    graphPathIds: z.array(z.string()),
  }),
  evidenceSnapshot: z.array(z.object({
    factId: z.string(), sourceObjectId: z.string(), sourceRevision: z.string(), status: z.string(),
  })),
});

export type Decision = z.infer<typeof DecisionSchema>;
export type DecisionReceipt = z.infer<typeof DecisionReceiptSchema>;
