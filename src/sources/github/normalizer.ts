import type { FactV2 } from "@/domain/facts/schema";
import type { SourceObject } from "@/domain/sources/schema";

export type GitHubIssueInput = {
  repository: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  updatedAt: string;
  etag: string | null;
  labels: string[];
  assignees: string[];
};

export type GitHubNormaliseOptions = {
  workspaceId: string;
  allowedPrincipalIds: string[];
  observedAt: string;
};

const sourceObjectId = (issue: GitHubIssueInput) => `source:github:${issue.repository}:issue:${issue.number}`;
const issueRef = (issue: GitHubIssueInput) => `issue:github:${issue.repository}:${issue.number}`;
const revision = (issue: GitHubIssueInput) => `github:${issue.repository}:${issue.number}@${issue.updatedAt}`;

function activeSupersession(effectiveFrom: string) {
  return { state: "active" as const, supersedes: [], supersededBy: [], effectiveFrom, effectiveTo: null, reason: null, recordedAt: null };
}

function factBase(issue: GitHubIssueInput, options: GitHubNormaliseOptions) {
  return {
    schemaVersion: 2 as const,
    workspaceId: options.workspaceId,
    subjectRef: issueRef(issue),
    statementVerbatim: `GitHub issue #${issue.number} “${issue.title}” is ${issue.state}.`,
    status: "active" as const,
    sourceObjectId: sourceObjectId(issue),
    sourceRevision: revision(issue),
    effectiveAt: issue.updatedAt,
    observedAt: options.observedAt,
    authorization: { allowedPrincipalIds: options.allowedPrincipalIds },
    supersession: activeSupersession(issue.updatedAt),
  };
}

/**
 * Converts a read-only GitHub issue payload into source-owned atomic facts.
 * It deliberately does not infer dependencies or conflicts from free text.
 */
export function normalizeGitHubIssue(issue: GitHubIssueInput, options: GitHubNormaliseOptions): { sourceObject: SourceObject; facts: FactV2[] } {
  const sourceObject: SourceObject = {
    schemaVersion: 2,
    sourceObjectId: sourceObjectId(issue),
    workspaceId: options.workspaceId,
    sourceSystem: "github",
    externalType: "issue",
    externalId: String(issue.number),
    title: issue.title,
    sourceUrl: issue.htmlUrl,
    revision: revision(issue),
    etag: issue.etag,
    observedAt: options.observedAt,
    contentHash: null,
    attributes: { state: issue.state, labels: [...issue.labels].sort(), assignees: [...issue.assignees].sort() },
  };
  const base = factBase(issue, options);
  const facts: FactV2[] = [
    { ...base, factId: `${revision(issue)}:state`, factType: "issue_state", predicate: "has_state", objectRef: `state:${issue.state}`, value: issue.state },
    ...[...new Set(issue.labels)].sort().map((label) => ({
      ...base, factId: `${revision(issue)}:label:${label}`, factType: "issue_label", predicate: "has_label", objectRef: `label:${label}`, value: label,
    })),
    ...[...new Set(issue.assignees)].sort().map((assignee) => ({
      ...base, factId: `${revision(issue)}:assignee:${assignee}`, factType: "issue_assignment", predicate: "assigned_to", objectRef: `person:${assignee}`, value: assignee,
    })),
  ];
  return { sourceObject, facts };
}
