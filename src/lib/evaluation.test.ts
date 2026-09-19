import { describe, expect, it } from "vitest";
import { EVALUATION_CASES, runEvaluation } from "./evaluation";

describe("frozen hackathon evaluation", () => {
  it("contains the 27 decision-consistency cases", () => {
    expect(EVALUATION_CASES).toHaveLength(27);
    expect(new Set(EVALUATION_CASES.map((testCase) => testCase.id)).size).toBe(27);
  });

  it("passes the frozen set without ungrounded cards or false interruptions", async () => {
    const report = await runEvaluation();
    const failures = report.results.filter((result) => !result.passed);

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(report.metrics.groundedEvidencePercent).toBe(100);
    expect(report.metrics.falseInterruptions).toBe(0);
  });
});
