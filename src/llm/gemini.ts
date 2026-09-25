import { adaptConversationEvent } from "@/domain/events/adapter";
import type { EventExtractor, ExtractionInput, ExtractionResult } from "@/engine/extraction/types";
import type { LegacyResolver } from "@/engine/extraction/deterministic";
import { resolveWithGemini, type GeminiSemanticResolver } from "@/lib/gemini";

/** Gemini is an optional interpretation adapter. It has no fact or warning authority. */
export function createGeminiEventExtractor(
  resolveDeterministic: LegacyResolver,
  semanticResolver: GeminiSemanticResolver = resolveWithGemini,
): EventExtractor {
  return {
    async extract(input: ExtractionInput): Promise<ExtractionResult> {
      const base = resolveDeterministic(input.recentTurns.slice(-8), input.currentTurn);
      const semantic = await semanticResolver(base, input.recentTurns.slice(-8), input.currentTurn);
      if (semantic.state === "unavailable") return { state: "unavailable", reason: "Semantic interpretation is unavailable." };
      const event = adaptConversationEvent(semantic.event ?? base, input.workspaceId, semantic.event ? "gemini" : "deterministic");
      return event.extraction.abstained
        ? { state: "abstained", event, reason: event.extraction.abstainReason ?? "No operational event." }
        : { state: "complete", event };
    },
  };
}
