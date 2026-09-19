import { ConversationEventSchema, type ConversationEvent, type TranscriptTurn } from "./schemas";

type GeminiResult = { event: ConversationEvent | null; state: "complete" | "skipped" | "unavailable" };

export async function resolveWithGemini(
  baseEvent: ConversationEvent,
  recentTurns: TranscriptTurn[],
  currentTurn: TranscriptTurn,
): Promise<GeminiResult> {
  if (baseEvent.eventType !== "none" || process.env.GEMINI_ENABLED !== "true") {
    return { event: null, state: "skipped" };
  }

  const key = process.env.GEMINI_AUTH_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) return { event: null, state: "unavailable" };

  const prompt = `You are ClashPoint's event resolver. Resolve only the operational meaning of CURRENT_TURN using RECENT_TURNS. Do not check facts or generate warnings. Return JSON matching the supplied schema. Do not upgrade uncertainty.\nRECENT_TURNS:\n${JSON.stringify(recentTurns.slice(-8))}\nCURRENT_TURN:\n${JSON.stringify(currentTurn)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
        signal: AbortSignal.timeout(3_000),
      },
    );
    if (!response.ok) return { event: null, state: "unavailable" };
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") return { event: null, state: "unavailable" };
    const candidate = ConversationEventSchema.safeParse({
      ...JSON.parse(text),
      eventId: baseEvent.eventId,
      meetingId: baseEvent.meetingId,
      sourceTurnIds: Array.from(
        new Set([...(JSON.parse(text).sourceTurnIds ?? []), currentTurn.turnId]),
      ),
    });
    return candidate.success
      ? { event: candidate.data, state: "complete" }
      : { event: null, state: "unavailable" };
  } catch {
    return { event: null, state: "unavailable" };
  }
}
