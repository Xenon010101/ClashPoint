import type { SourceAdapter, SourceHealth, SourceRefreshResult } from "@/sources/types";
import { fetchGitHubIssue } from "./client";
import { normalizeGitHubIssue } from "./normalizer";

type FetchLike = typeof fetch;

export type GitHubSourceAdapterOptions = {
  repository: string;
  workspaceId: string;
  allowedPrincipalIds: string[];
  fetchImpl?: FetchLike;
  now?: () => string;
};

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export class GitHubSourceAdapter implements SourceAdapter {
  readonly sourceSystem = "github";
  private readonly fetchImpl: FetchLike;
  private readonly now: () => string;

  constructor(private readonly options: GitHubSourceAdapterOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async health(): Promise<SourceHealth> {
    if (process.env.GITHUB_ENABLED !== "true") {
      return { state: "unavailable", checkedAt: this.now(), message: "GitHub source is not configured." };
    }
    if (!repositoryPattern.test(this.options.repository) || this.options.allowedPrincipalIds.length === 0) {
      return { state: "unavailable", checkedAt: this.now(), message: "GitHub source configuration is invalid." };
    }
    return { state: "ready", checkedAt: this.now(), message: null };
  }

  async refresh(input: { externalId: string; previousEtag?: string | null }): Promise<SourceRefreshResult> {
    const issueNumber = Number(input.externalId);
    if (!Number.isInteger(issueNumber) || issueNumber < 1) {
      return { state: "unavailable", message: "GitHub issue identifier is invalid." };
    }
    const result = await fetchGitHubIssue(
      { repository: this.options.repository, issueNumber, previousEtag: input.previousEtag },
      this.fetchImpl,
    );
    if (result.state === "unavailable") return result;
    if (result.state === "unchanged") return result;
    const normalized = normalizeGitHubIssue(result.issue, {
      workspaceId: this.options.workspaceId,
      allowedPrincipalIds: this.options.allowedPrincipalIds,
      observedAt: this.now(),
    });
    return { state: "complete", ...normalized, unchanged: false };
  }
}
