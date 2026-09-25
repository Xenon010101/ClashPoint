import { EventV2Schema, type EventV2 } from "./schema";
import type { ConversationEvent } from "@/lib/schemas";

const entityId = (type: string, label: string) => `${type}:${label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/** Additive adapter: preserves the legacy event while introducing stable-shaped refs. */
export function adaptConversationEvent(event: ConversationEvent, workspaceId: string, method: "deterministic" | "gemini" = "deterministic"): EventV2 {
  const abstained = event.eventType === "none";
  return EventV2Schema.parse({
    ...event,
    schemaVersion: 2,
    workspaceId,
    entityRefs: event.entities.map((entity) => ({ entityId: entityId(entity.type, entity.value), type: entity.type, label: entity.value })),
    extraction: {
      method,
      model: method === "gemini" ? "configured-gemini" : null,
      promptVersion: method === "gemini" ? "event-extraction.v1" : null,
      abstained,
      abstainReason: abstained ? "No operational event could be resolved from bounded context." : null,
    },
  });
}
