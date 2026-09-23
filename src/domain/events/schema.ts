import { z } from "zod";
import { ConversationEventSchema } from "@/lib/schemas";

export const EntityRefSchema = z.object({
  entityId: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
});

export const EventV2Schema = ConversationEventSchema.extend({
  schemaVersion: z.literal(2),
  workspaceId: z.string().min(1),
  entityRefs: z.array(EntityRefSchema),
  extraction: z.object({
    method: z.enum(["deterministic", "gemini"]),
    model: z.string().nullable(),
    promptVersion: z.string().nullable(),
    abstained: z.boolean(),
    abstainReason: z.string().nullable(),
  }),
});

export type EventV2 = z.infer<typeof EventV2Schema>;
