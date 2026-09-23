import { z } from "zod";
import { SupersessionSchema } from "@/domain/common/supersession";

export const FactV2Schema = z.object({
  schemaVersion: z.literal(2),
  factId: z.string().min(1),
  workspaceId: z.string().min(1),
  factType: z.string().min(1),
  subjectRef: z.string().min(1),
  predicate: z.string().min(1),
  objectRef: z.string().nullable(),
  value: z.unknown().nullable(),
  statementVerbatim: z.string().min(1),
  status: z.enum(["active", "resolved", "superseded", "expired", "unknown"]),
  sourceObjectId: z.string().min(1),
  sourceRevision: z.string().min(1),
  effectiveAt: z.string().datetime(),
  observedAt: z.string().datetime(),
  authorization: z.object({ allowedPrincipalIds: z.array(z.string().min(1)).min(1) }),
  supersession: SupersessionSchema,
});

export type FactV2 = z.infer<typeof FactV2Schema>;
