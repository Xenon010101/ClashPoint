import type { GitHubSourceAdapterOptions } from "./adapter";

export type GitHubSourceConfigResult =
  | { state: "configured"; options: Omit<GitHubSourceAdapterOptions, "fetchImpl" | "now"> }
  | { state: "unavailable"; message: string };

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** Reads server environment only; no credentials or provider objects leave this module. */
type GitHubEnvironment = { GITHUB_ENABLED?: string; GITHUB_REPOSITORY?: string };

export function getGitHubSourceConfig(env: GitHubEnvironment = process.env as GitHubEnvironment): GitHubSourceConfigResult {
  if (env.GITHUB_ENABLED !== "true") return { state: "unavailable", message: "GitHub source is not configured." };
  const repository = env.GITHUB_REPOSITORY;
  if (!repository || !repositoryPattern.test(repository)) return { state: "unavailable", message: "GitHub source configuration is invalid." };
  return { state: "configured", options: { repository, workspaceId: "demo", allowedPrincipalIds: ["demo_product"] } };
}
