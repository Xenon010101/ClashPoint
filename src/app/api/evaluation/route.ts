import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/evaluation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await runEvaluation();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Evaluation unavailable", detail: "The local fixture run could not complete." },
      { status: 500 },
    );
  }
}
