import { adaptConversationEvent } from "@/domain/events/adapter";
import type { ConversationEvent, TranscriptTurn } from "@/lib/schemas";
import type { EventExtractor, ExtractionInput, ExtractionResult } from "./types";

export type LegacyResolver = (recentTurns: TranscriptTurn[], currentTurn: TranscriptTurn) => ConversationEvent;

/** Wraps the proven resolver so callers depend on the new extraction contract. */
export function createDeterministicEventExtractor(resolve: LegacyResolver): EventExtractor {
  return {
    async extract(input: ExtractionInput): Promise<ExtractionResult> {
      const event = adaptConversationEvent(resolve(input.recentTurns.slice(-8), input.currentTurn), input.workspaceId);
      return event.extraction.abstained
        ? { state: "abstained", event, reason: event.extraction.abstainReason ?? "No operational event." }
        : { state: "complete", event };
    },
  };
}
