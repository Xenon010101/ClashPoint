// @vitest-environment node

import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/evaluation", () => {
  it("returns measured results for all frozen cases", async () => {
    const response = await GET();
    const report = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(report.fixtureVersion).toBe("hackathon-27-v1");
    expect(report.metrics).toMatchObject({
      cases: 27,
      passed: 27,
      groundedEvidencePercent: 100,
      falseInterruptions: 0,
    });
    expect(report.results).toHaveLength(27);
  });
});
