import { z } from "zod";

export const SourceObjectSchema = z.object({
  schemaVersion: z.literal(2),
  sourceObjectId: z.string().min(1),
  workspaceId: z.string().min(1),
  sourceSystem: z.string().min(1),
  externalType: z.string().min(1),
  externalId: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string().min(1),
  revision: z.string().min(1),
  etag: z.string().nullable(),
  observedAt: z.string().datetime(),
  contentHash: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()),
});

export type SourceObject = z.infer<typeof SourceObjectSchema>;
