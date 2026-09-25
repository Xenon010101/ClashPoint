import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubIssue } from "./client";

afterEach(() => vi.unstubAllEnvs());

const payload = {
  number: 42, title: "Auth Refactor", state: "open", html_url: "https://github.com/example/release/issues/42",
  updated_at: "2026-09-25T10:00:00Z", labels: [{ name: "release-blocker" }], assignees: [{ login: "diego" }],
};

describe("read-only GitHub client", () => {
  it("does not make a network request until explicitly enabled", async () => {
    const request = vi.fn();
    await expect(fetchGitHubIssue({ repository: "example/release", issueNumber: 42 }, request)).resolves.toEqual({
      state: "unavailable", message: "GitHub source is not configured.",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("uses conditional requests and normalises a successful issue payload", async () => {
    vi.stubEnv("GITHUB_ENABLED", "true");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200, headers: { etag: "W/\"42\"" } }));
    const result = await fetchGitHubIssue({ repository: "example/release", issueNumber: 42, previousEtag: "W/\"old\"" }, request);
    expect(result).toMatchObject({ state: "complete", issue: { number: 42, labels: ["release-blocker"], assignees: ["diego"], etag: "W/\"42\"" } });
    expect(request.mock.calls[0][1].headers["If-None-Match"]).toBe("W/\"old\"");
  });

  it("represents unchanged and provider failures explicitly", async () => {
    vi.stubEnv("GITHUB_ENABLED", "true");
    await expect(fetchGitHubIssue({ repository: "example/release", issueNumber: 42 }, vi.fn().mockResolvedValue(new Response(null, { status: 304 })))).resolves.toEqual({ state: "unchanged" });
    await expect(fetchGitHubIssue({ repository: "example/release", issueNumber: 42 }, vi.fn().mockRejectedValue(new Error("offline")))).resolves.toEqual({
      state: "unavailable", message: "GitHub source is currently unavailable.",
    });
  });
});
