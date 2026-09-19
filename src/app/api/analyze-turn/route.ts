import { NextResponse } from "next/server";
import { analyzeTurn } from "@/lib/analyze";
import { AnalyzeTurnRequestSchema, AnalyzeTurnResponseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const parsed = AnalyzeTurnRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid turn payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = AnalyzeTurnResponseSchema.parse(await analyzeTurn(parsed.data));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Analysis unavailable", detail: "Deterministic checks could not complete." },
      { status: 500 },
    );
  }
}
