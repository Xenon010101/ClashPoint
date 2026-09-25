// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

afterEach(() => { delete process.env.GITHUB_ENABLED; delete process.env.GITHUB_REPOSITORY; });

describe("GET /api/sources/github/health", () => {
  it("is explicitly unavailable when the optional source is disabled", async () => {
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ state: "unavailable", message: "GitHub source is not configured." });
  });
});
