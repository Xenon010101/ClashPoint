import { describe, expect, it } from "vitest";
import type { SourceAdapter } from "./types";

const adapter: SourceAdapter = {
  sourceSystem: "test-source",
  async health() {
    return { state: "ready", checkedAt: "2026-09-24T00:00:00.000Z", message: null };
  },
  async refresh() {
    return { state: "unavailable", message: "Source request timed out." };
  },
};

describe("SourceAdapter contract", () => {
  it("makes source availability explicit without leaking a provider implementation", async () => {
    expect(await adapter.health()).toMatchObject({ state: "ready", message: null });
    await expect(adapter.refresh({ externalId: "42" })).resolves.toEqual({
      state: "unavailable", message: "Source request timed out.",
    });
  });
});
