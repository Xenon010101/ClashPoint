import { NextResponse } from "next/server";
import { GitHubSourceAdapter } from "@/sources/github/adapter";
import { getGitHubSourceConfig } from "@/sources/github/config";

export async function GET(request: Request, context: { params: Promise<{ issueNumber: string }> }) {
  const { issueNumber } = await context.params;
  if (!/^\d+$/.test(issueNumber) || Number(issueNumber) < 1) {
    return NextResponse.json({ state: "unavailable", message: "GitHub issue identifier is invalid." }, { status: 400 });
  }
  const config = getGitHubSourceConfig();
  if (config.state === "unavailable") return NextResponse.json(config, { status: 503 });
  const previousEtag = request.headers.get("if-none-match");
  const result = await new GitHubSourceAdapter(config.options).refresh({ externalId: issueNumber, previousEtag });
  const status = result.state === "complete" || result.state === "unchanged" ? 200 : 503;
  return NextResponse.json(result, { status });
}
