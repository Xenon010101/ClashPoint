import type { Fact } from "./schemas";

const baseFacts: Fact[] = [
  {
    factId: "F-DEP-1",
    sourceSystem: "github",
    sourceObjectId: "GH-42",
    sourceTitle: "Auth Refactor",
    sourceUrl: "/demo-sources/github/GH-42",
    sourceRevision: "gh-42@2026-09-18T14:20:00Z",
    factType: "dependency",
    entityKeys: ["project:acme", "feature:sso", "issue:auth-refactor", "topic:blockers"],
    statementVerbatim: "SSO release is blocked by Auth Refactor. GH-42 remains open.",
    structured: { dependent: "SSO", dependency: "Auth Refactor", issueState: "open" },
    status: "active",
    effectiveAt: "2026-09-15T09:00:00.000Z",
    observedAt: "2026-09-19T08:30:00.000Z",
    supersedes: [],
    supersededBy: [],
    allowedPrincipalIds: ["demo_product"],
  },
  {
    factId: "F-LEGAL-1",
    sourceSystem: "notion",
    sourceObjectId: "LEGAL-REVIEW-12",
    sourceTitle: "Legal Review · Feature X",
    sourceUrl: "/demo-sources/notion/LEGAL-REVIEW-12",
    sourceRevision: "notion-legal@2026-09-15T16:44:00Z",
    factType: "approval_blocker",
    entityKeys: ["feature:feature-x", "customer:acme", "topic:dpa"],
    statementVerbatim: "Do not proceed with Feature X until the DPA update is approved.",
    structured: { subject: "Feature X", condition: "DPA update approved", effect: "blocked" },
    status: "active",
    effectiveAt: "2026-09-15T00:00:00.000Z",
    observedAt: "2026-09-19T08:30:00.000Z",
    supersedes: [],
    supersededBy: [],
    allowedPrincipalIds: ["demo_product"],
  },
  {
    factId: "F-CAP-1",
    sourceSystem: "policy",
    sourceObjectId: "CAPACITY-P0",
    sourceTitle: "Delivery Capacity Policy",
    sourceUrl: "/demo-sources/policy/CAPACITY-P0",
    sourceRevision: "capacity-policy@v3",
    factType: "capacity",
    entityKeys: ["person:valya", "priority:p0"],
    statementVerbatim: "Valya owns 3 active P0 items. The configured limit is 3.",
    structured: { assignee: "Valya", activeP0Count: 3, p0Limit: 3 },
    status: "active",
    effectiveAt: "2026-09-17T00:00:00.000Z",
    observedAt: "2026-09-19T08:30:00.000Z",
    supersedes: [],
    supersededBy: [],
    allowedPrincipalIds: ["demo_product"],
  },
  {
    factId: "F-OWNER-1",
    sourceSystem: "github",
    sourceObjectId: "GH-42-OWNER",
    sourceTitle: "Auth Refactor ownership",
    sourceUrl: "/demo-sources/github/GH-42",
    sourceRevision: "gh-42-owner@2026-09-18T14:20:00Z",
    factType: "ownership",
    entityKeys: ["person:diego", "issue:auth-refactor"],
    statementVerbatim: "Diego is the current assignee for Auth Refactor.",
    structured: { assignee: "Diego", issue: "Auth Refactor" },
    status: "active",
    effectiveAt: "2026-09-18T14:20:00.000Z",
    observedAt: "2026-09-19T08:30:00.000Z",
    supersedes: [],
    supersededBy: [],
    allowedPrincipalIds: ["demo_product"],
  },
];

const approvalFact: Fact = {
  factId: "F-APPROVAL-2",
  sourceSystem: "notion",
  sourceObjectId: "DPA-APPROVAL-18",
  sourceTitle: "DPA Approval",
  sourceUrl: "/demo-sources/notion/DPA-APPROVAL-18",
  sourceRevision: "notion-approval@2026-09-18T17:10:00Z",
  factType: "approval",
  entityKeys: ["feature:feature-x", "customer:acme", "topic:dpa"],
  statementVerbatim: "The DPA update for Feature X is approved for the Acme launch.",
  structured: { subject: "Feature X", approval: "granted" },
  status: "active",
  effectiveAt: "2026-09-18T17:10:00.000Z",
  observedAt: "2026-09-19T08:30:00.000Z",
  supersedes: ["F-LEGAL-1"],
  supersededBy: [],
  allowedPrincipalIds: ["demo_product"],
};

const restrictedFact: Fact = {
  factId: "F-PRIVATE-1",
  sourceSystem: "notion",
  sourceObjectId: "PROJECT-SECRET",
  sourceTitle: "Restricted Legal Note",
  sourceUrl: "/demo-sources/notion/PROJECT-SECRET",
  sourceRevision: "private@1",
  factType: "approval_blocker",
  entityKeys: ["project:secret"],
  statementVerbatim: "Project Secret has a restricted legal hold.",
  structured: { project: "Secret", effect: "blocked" },
  status: "active",
  effectiveAt: "2026-09-18T00:00:00.000Z",
  observedAt: "2026-09-19T08:30:00.000Z",
  supersedes: [],
  supersededBy: [],
  allowedPrincipalIds: ["legal_admin"],
};

export function getFacts(variant: "default" | "approval" | "restricted" = "default"): Fact[] {
  const facts = baseFacts.map((fact) => ({ ...fact, supersededBy: [...fact.supersededBy] }));
  if (variant === "approval") {
    const blocker = facts.find((fact) => fact.factId === "F-LEGAL-1");
    if (blocker) {
      blocker.status = "superseded";
      blocker.supersededBy = [approvalFact.factId];
    }
    facts.push(approvalFact);
  }
  if (variant === "restricted") facts.push(restrictedFact);
  return facts;
}

export function getAuthorizedFacts(principalId: string, variant: "default" | "approval" | "restricted") {
  return getFacts(variant).filter((fact) => fact.allowedPrincipalIds.includes(principalId));
}

export function getPublicDemoFact(sourceObjectId: string) {
  return [...baseFacts, approvalFact].find(
    (fact) => fact.sourceObjectId === sourceObjectId && fact.allowedPrincipalIds.includes("demo_product"),
  );
}
