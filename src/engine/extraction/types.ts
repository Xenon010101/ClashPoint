import type { EventV2 } from "@/domain/events/schema";
import type { TranscriptTurn } from "@/lib/schemas";

export type ExtractionInput = { workspaceId: string; recentTurns: TranscriptTurn[]; currentTurn: TranscriptTurn };
export type ExtractionResult =
  | { state: "complete"; event: EventV2 }
  | { state: "abstained"; event: EventV2; reason: string }
  | { state: "unavailable"; reason: string };

/** Provider-neutral conversation interpretation boundary. It has no fact access. */
export interface EventExtractor { extract(input: ExtractionInput): Promise<ExtractionResult>; }
