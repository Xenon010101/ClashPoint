import type { GitHubIssueInput } from "./normalizer";

export type GitHubFetchResult =
  | { state: "complete"; issue: GitHubIssueInput; etag: string | null }
  | { state: "unchanged" }
  | { state: "unavailable"; message: string };

type FetchLike = typeof fetch;

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function unavailable(message: string): GitHubFetchResult {
  return { state: "unavailable", message };
}

function asIssue(payload: unknown, repository: string): GitHubIssueInput | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (
    typeof data.number !== "number" || typeof data.title !== "string" ||
    (data.state !== "open" && data.state !== "closed") || typeof data.html_url !== "string" ||
    typeof data.updated_at !== "string" || !Array.isArray(data.labels) || !Array.isArray(data.assignees)
  ) return null;
  const labels = data.labels.flatMap((label) => label && typeof label === "object" && typeof (label as { name?: unknown }).name === "string" ? [(label as { name: string }).name] : []);
  const assignees = data.assignees.flatMap((assignee) => assignee && typeof assignee === "object" && typeof (assignee as { login?: unknown }).login === "string" ? [(assignee as { login: string }).login] : []);
  return {
    repository, number: data.number, title: data.title, state: data.state, htmlUrl: data.html_url,
    updatedAt: data.updated_at, etag: null, labels, assignees,
  };
}

/** Server-only, read-only GitHub REST client. It is disabled unless explicitly configured. */
export async function fetchGitHubIssue(
  input: { repository: string; issueNumber: number; previousEtag?: string | null },
  fetchImpl: FetchLike = fetch,
): Promise<GitHubFetchResult> {
  if (process.env.GITHUB_ENABLED !== "true") return unavailable("GitHub source is not configured.");
  if (!repositoryPattern.test(input.repository) || !Number.isInteger(input.issueNumber) || input.issueNumber < 1) {
    return unavailable("GitHub source configuration is invalid.");
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (input.previousEtag) headers["If-None-Match"] = input.previousEtag;

  try {
    const response = await fetchImpl(
      `https://api.github.com/repos/${encodeURIComponent(input.repository.split("/")[0])}/${encodeURIComponent(input.repository.split("/")[1])}/issues/${input.issueNumber}`,
      { headers, signal: AbortSignal.timeout(3_000) },
    );
    if (response.status === 304) return { state: "unchanged" };
    if (!response.ok) return unavailable("GitHub source is currently unavailable.");
    const issue = asIssue(await response.json(), input.repository);
    if (!issue) return unavailable("GitHub returned an invalid issue response.");
    return { state: "complete", issue: { ...issue, etag: response.headers.get("etag") }, etag: response.headers.get("etag") };
  } catch {
    return unavailable("GitHub source is currently unavailable.");
  }
}
