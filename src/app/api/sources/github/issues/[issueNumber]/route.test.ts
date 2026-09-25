// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

afterEach(() => { delete process.env.GITHUB_ENABLED; delete process.env.GITHUB_REPOSITORY; });
const context = (issueNumber: string) => ({ params: Promise.resolve({ issueNumber }) });

describe("GET /api/sources/github/issues/[issueNumber]", () => {
  it("rejects an invalid issue identifier before source access", async () => {
    const response = await GET(new Request("http://localhost/api/sources/github/issues/invalid"), context("invalid"));
    expect(response.status).toBe(400);
  });

  it("returns an honest unavailable state while the optional source is disabled", async () => {
    const response = await GET(new Request("http://localhost/api/sources/github/issues/42"), context("42"));
    expect(response.status).toBe(503);
    expect((await response.json()).state).toBe("unavailable");
  });
});
