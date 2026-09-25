import type { FactV2 } from "@/domain/facts/schema";
import type { SourceObject } from "@/domain/sources/schema";

export type SourceHealth = {
  state: "ready" | "unavailable";
  checkedAt: string;
  message: string | null;
};

export type SourceRefreshResult =
  | { state: "complete"; sourceObject: SourceObject; facts: FactV2[]; unchanged: boolean }
  | { state: "unchanged" }
  | { state: "unavailable"; message: string };

/**
 * Read-only boundary for external systems. Adapters normalise data, but neither
 * decide conflicts nor expose credentials to the engine or browser.
 */
export interface SourceAdapter {
  readonly sourceSystem: string;
  health(): Promise<SourceHealth>;
  refresh(input: { externalId: string; previousEtag?: string | null }): Promise<SourceRefreshResult>;
}
