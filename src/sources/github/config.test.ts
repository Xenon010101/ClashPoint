import { describe, expect, it } from "vitest";
import { getGitHubSourceConfig } from "./config";

describe("GitHub source configuration", () => {
  it("is disabled unless explicitly enabled", () => {
    expect(getGitHubSourceConfig({ GITHUB_ENABLED: "false" })).toEqual({ state: "unavailable", message: "GitHub source is not configured." });
  });

  it("accepts only a valid configured repository and retains the demo ACL", () => {
    expect(getGitHubSourceConfig({ GITHUB_ENABLED: "true", GITHUB_REPOSITORY: "example/release" })).toEqual({
      state: "configured", options: { repository: "example/release", workspaceId: "demo", allowedPrincipalIds: ["demo_product"] },
    });
  });
});
