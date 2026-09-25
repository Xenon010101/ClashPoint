import { NextResponse } from "next/server";
import { GitHubSourceAdapter } from "@/sources/github/adapter";
import { getGitHubSourceConfig } from "@/sources/github/config";

export async function GET() {
  const config = getGitHubSourceConfig();
  if (config.state === "unavailable") return NextResponse.json(config, { status: 503 });
  const health = await new GitHubSourceAdapter(config.options).health();
  return NextResponse.json(health, { status: health.state === "ready" ? 200 : 503 });
}
