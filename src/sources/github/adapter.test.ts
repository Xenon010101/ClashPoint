import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubSourceAdapter } from "./adapter";

afterEach(() => vi.unstubAllEnvs());

const payload = {
  number: 42, title: "Auth Refactor", state: "open", html_url: "https://github.com/example/release/issues/42",
  updated_at: "2026-09-25T10:00:00.000Z", labels: [{ name: "release-blocker" }], assignees: [{ login: "diego" }],
};

function adapter(fetchImpl = vi.fn()) {
  return new GitHubSourceAdapter({
    repository: "example/release", workspaceId: "demo", allowedPrincipalIds: ["demo_product"], fetchImpl,
    now: () => "2026-09-25T10:01:00.000Z",
  });
}

describe("GitHubSourceAdapter", () => {
  it("reports disabled configuration without attempting a source call", async () => {
    const request = vi.fn();
    const source = adapter(request);
    await expect(source.health()).resolves.toMatchObject({ state: "unavailable" });
    await expect(source.refresh({ externalId: "42" })).resolves.toMatchObject({ state: "unavailable" });
    expect(request).not.toHaveBeenCalled();
  });

  it("normalises configured issue refreshes with authorised provenance", async () => {
    vi.stubEnv("GITHUB_ENABLED", "true");
    const source = adapter(vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200, headers: { etag: "W/\"42\"" } })));
    await expect(source.health()).resolves.toEqual({ state: "ready", checkedAt: "2026-09-25T10:01:00.000Z", message: null });
    const result = await source.refresh({ externalId: "42" });
    expect(result).toMatchObject({ state: "complete", unchanged: false, sourceObject: { externalId: "42", etag: "W/\"42\"" } });
    if (result.state === "complete") expect(result.facts.every((fact) => fact.authorization.allowedPrincipalIds[0] === "demo_product")).toBe(true);
  });

  it("keeps unchanged responses distinct from unavailable source failures", async () => {
    vi.stubEnv("GITHUB_ENABLED", "true");
    await expect(adapter(vi.fn().mockResolvedValue(new Response(null, { status: 304 }))).refresh({ externalId: "42", previousEtag: "W/\"42\"" })).resolves.toEqual({ state: "unchanged" });
  });
});
