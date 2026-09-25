import { describe, expect, it } from "vitest";
import { normalizeGitHubIssue } from "./normalizer";

const issue = {
  repository: "example/release", number: 42, title: "Auth Refactor", state: "open" as const,
  htmlUrl: "https://github.com/example/release/issues/42", updatedAt: "2026-09-25T10:00:00.000Z",
  etag: "W/\"revision-42\"", labels: ["release-blocker", "release-blocker"], assignees: ["diego"],
};
const options = { workspaceId: "demo", allowedPrincipalIds: ["demo_product"], observedAt: "2026-09-25T10:01:00.000Z" };

describe("GitHub issue normaliser", () => {
  it("preserves stable source provenance and turns state, labels, and assignees into atomic facts", () => {
    const result = normalizeGitHubIssue(issue, options);
    expect(result.sourceObject).toMatchObject({ sourceSystem: "github", externalType: "issue", externalId: "42", etag: "W/\"revision-42\"" });
    expect(result.facts.map((fact) => fact.predicate)).toEqual(["has_state", "has_label", "assigned_to"]);
    expect(result.facts.every((fact) => fact.authorization.allowedPrincipalIds.includes("demo_product"))).toBe(true);
    expect(result.facts[0].statementVerbatim).toBe("GitHub issue #42 “Auth Refactor” is open.");
  });

  it("does not manufacture a dependency from a title or label", () => {
    const { facts } = normalizeGitHubIssue(issue, options);
    expect(facts.some((fact) => fact.predicate === "depends_on")).toBe(false);
  });
});
