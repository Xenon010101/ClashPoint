"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  GitBranch,
  ListChecks,
  Mic,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalyzeTurnResponse,
  ConversationEvent,
  ResolutionCard,
  TranscriptTurn,
} from "@/lib/schemas";
import { EvidenceDrawer } from "./decisions/EvidenceDrawer";
import { JudgeGuide } from "./decisions/JudgeGuide";
import { ResolutionCardView } from "./decisions/ResolutionCardView";
import { ControlRail } from "./meeting/ControlRail";

type InputMode = "script" | "manual" | "microphone";
type MeetingStatus = "consent" | "active" | "paused" | "stopped" | "degraded";
type MicrophoneState = "idle" | "ready" | "listening" | "unsupported" | "denied" | "error";
type Speaker = { id: "spk_maya" | "spk_diego"; label: "Maya" | "Diego" };
type EvaluationReport = {
  generatedAt: string;
  fixtureVersion: string;
  metrics: {
    cases: number;
    passed: number;
    eventAccuracyPercent: number;
    collisionAccuracyPercent: number;
    groundedEvidencePercent: number;
    falseInterruptions: number;
    medianLatencyMs: number;
  };
  results: Array<{ id: string; name: string; passed: boolean }>;
};
type LiveSourceState = "idle" | "checking" | "ready" | "unavailable";

const speakers: Speaker[] = [
  { id: "spk_maya", label: "Maya" },
  { id: "spk_diego", label: "Diego" },
];

const script: Array<{ speaker: Speaker; text: string }> = [
  { speaker: speakers[0], text: "Are all the Acme blockers cleared?" },
  { speaker: speakers[1], text: "Yeah." },
  { speaker: speakers[0], text: "Okay. Let’s promise Feature X to Acme by Friday." },
  { speaker: speakers[0], text: "Fine. Make the new work P0 and give it to Valya." },
];

function makeTurn(index: number, speaker: Speaker, text: string): TranscriptTurn {
  const now = new Date();
  return {
    turnId: `turn_${String(index).padStart(3, "0")}`,
    meetingId: "mtg_acme_review",
    speakerId: speaker.id,
    speakerLabel: speaker.label,
    textRaw: text,
    isFinal: true,
    startedAt: new Date(now.getTime() - 1_200).toISOString(),
    endedAt: now.toISOString(),
  };
}

function elapsed(startedAt: number | null, now: number) {
  if (!startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(value),
  );
}

export function ClashPointApp() {
  const [status, setStatus] = useState<MeetingStatus>("consent");
  const statusRef = useRef<MeetingStatus>("consent");
  const sessionVersion = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const scriptCursor = useRef(0);
  const [scriptPosition, setScriptPosition] = useState(0);
  const scriptRun = useRef(0);
  const [mode, setMode] = useState<InputMode>("script");
  const [speaker, setSpeaker] = useState<Speaker>(speakers[0]);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  const [cards, setCards] = useState<ResolutionCard[]>([]);
  const [currentEvent, setCurrentEvent] = useState<ConversationEvent | null>(null);
  const [selectedCard, setSelectedCard] = useState<ResolutionCard | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [judgeMode, setJudgeMode] = useState(true);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<"idle" | "resolve" | "retrieve" | "verify">("idle");
  const [semanticState, setSemanticState] = useState<"complete" | "skipped" | "unavailable">("skipped");
  const [lastTiming, setLastTiming] = useState<number | null>(null);
  const [runningScript, setRunningScript] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [liveSourceState, setLiveSourceState] = useState<LiveSourceState>("idle");
  const [liveSourceMessage, setLiveSourceMessage] = useState("Optional live GitHub source not checked.");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const evidenceTriggerRef = useRef<HTMLElement | null>(null);

  const transitionStatus = (next: MeetingStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const cancelCapture = () => {
    sessionVersion.current += 1;
    scriptRun.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
    setProcessing(false);
    setStage("idle");
    setRunningScript(false);
    setMicActive(false);
    setInterimTranscript("");
  };

  useEffect(() => () => {
    sessionVersion.current += 1;
    scriptRun.current += 1;
    requestRef.current?.abort();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedCard && !evaluationOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
        setEvaluationOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCard, evaluationOpen]);

  const openEvaluation = async (force = false) => {
    setEvaluationOpen(true);
    if ((!force && evaluationReport) || evaluationLoading) return;
    setEvaluationLoading(true);
    setEvaluationError(null);
    try {
      const response = await fetch("/api/evaluation", { cache: "no-store" });
      if (!response.ok) throw new Error("Evaluation request failed");
      setEvaluationReport((await response.json()) as EvaluationReport);
    } catch {
      setEvaluationError("The local fixture evaluation could not run. The live demo remains available.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  const checkLiveSource = async () => {
    if (liveSourceState === "checking") return;
    setLiveSourceState("checking");
    try {
      const response = await fetch("/api/sources/github/health", { cache: "no-store" });
      const result = (await response.json()) as { state?: "ready" | "unavailable"; message?: string | null };
      if (response.ok && result.state === "ready") {
        setLiveSourceState("ready");
        setLiveSourceMessage("Optional live GitHub source is ready. It is not used for this fixture demo.");
        return;
      }
      setLiveSourceState("unavailable");
      setLiveSourceMessage(result.message ?? "Optional live GitHub source is unavailable. Demo fixtures remain ready.");
    } catch {
      setLiveSourceState("unavailable");
      setLiveSourceMessage("Optional live GitHub source could not be checked. Demo fixtures remain ready.");
    }
  };

  const processTurn = useCallback(async (text: string, activeSpeaker: Speaker) => {
    const clean = text.trim();
    if (!clean || requestRef.current || !["active", "degraded"].includes(statusRef.current)) return false;
    const version = sessionVersion.current;
    const controller = new AbortController();
    requestRef.current = controller;
    const isCurrent = () => version === sessionVersion.current && !controller.signal.aborted;
    const current = makeTurn(turnsRef.current.length + 1, activeSpeaker, clean);
    const recent = turnsRef.current.slice(-8);
    turnsRef.current = [...turnsRef.current, current];
    setTurns(turnsRef.current);
    setProcessing(true);
    setStage("resolve");
    setNotice(null);
    setLiveSourceState("idle");
    setLiveSourceMessage("Optional live GitHub source not checked.");

    const stageTimer = window.setTimeout(() => { if (isCurrent()) setStage("retrieve"); }, 180);
    try {
      const response = await fetch("/api/analyze-turn", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: "mtg_acme_review",
          principalId: "demo_product",
          recentTurns: recent,
          currentTurn: current,
          factsVariant: "default",
        }),
      });
      if (!response.ok) throw new Error("Analysis request failed");
      const result = (await response.json()) as AnalyzeTurnResponse;
      if (!isCurrent()) return false;
      setStage("verify");
      setCurrentEvent(result.event);
      setSemanticState(result.checks.semantic);
      setLastTiming(result.timingsMs.total);
      if (result.card) {
        setCards((existing) => [result.card!, ...existing.filter((card) => card.cardId !== result.card!.cardId)]);
      }
      return true;
    } catch {
      if (!isCurrent()) return false;
      statusRef.current = "degraded";
      setStatus("degraded");
      setNotice("Analysis is temporarily unavailable. Script and transcript controls remain active.");
      return false;
    } finally {
      window.clearTimeout(stageTimer);
      if (isCurrent()) {
        requestRef.current = null;
        setProcessing(false);
        setStage("idle");
      }
    }
  }, []);

  const createReceipt = useCallback(async (card: ResolutionCard) => {
    const eventId = card.collisionId.replace(/^col_/, "");
    const response = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId: "mtg_acme_review",
        principalId: "demo_product",
        eventId,
        acceptedWording: card.saferWording ?? card.eventQuote,
        factIds: card.evidence.map((evidence) => evidence.factId),
        collisionId: card.collisionId,
        graphPathIds: card.evidencePath.map((step) => `${step.relation}:${step.label}`),
      }),
    });
    setNotice(response.ok ? "Decision receipt created from the verified evidence snapshot." : "Decision receipt could not be created from the current evidence.");
  }, []);

  const openEvidence = (card: ResolutionCard, trigger: HTMLButtonElement) => {
    evidenceTriggerRef.current = trigger;
    setSelectedCard(card);
  };

  const closeEvidence = () => {
    setSelectedCard(null);
    window.requestAnimationFrame(() => evidenceTriggerRef.current?.focus());
  };

  const startMeeting = () => {
    transitionStatus("active");
    setStartedAt(Date.now());
    setNotice(null);
  };

  const reset = () => {
    cancelCapture();
    scriptCursor.current = 0;
    setScriptPosition(0);
    turnsRef.current = [];
    setTurns([]);
    setCards([]);
    setCurrentEvent(null);
    setSelectedCard(null);
    setExpandedCardIds(new Set());
    setManualText("");
    setProcessing(false);
    setStage("idle");
    setLastTiming(null);
    setSemanticState("skipped");
    setEvaluationOpen(false);
    setRunningScript(false);
    setMicActive(false);
    setMicrophoneState("idle");
    setInterimTranscript("");
    setNotice(null);
    setStartedAt(null);
    transitionStatus("consent");
  };

  const runScript = async (oneBeat = false) => {
    if (runningScript || requestRef.current || !["active", "degraded"].includes(statusRef.current)) return;
    const run = ++scriptRun.current;
    setMode("script");
    setRunningScript(true);
    const end = oneBeat ? (scriptCursor.current < 2 ? 2 : scriptCursor.current + 1) : script.length;
    while (scriptCursor.current < Math.min(end, script.length) && run === scriptRun.current) {
      const line = script[scriptCursor.current];
      const completed = await processTurn(line.text, line.speaker);
      if (!completed || run !== scriptRun.current) break;
      scriptCursor.current += 1;
      setScriptPosition(scriptCursor.current);
      if (!oneBeat && scriptCursor.current < end) await new Promise((resolve) => window.setTimeout(resolve, 1_250));
    }
    if (run === scriptRun.current) setRunningScript(false);
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!manualText.trim() || processing || !["active", "degraded"].includes(statusRef.current)) return;
    const text = manualText;
    setManualText("");
    await processTurn(text, speaker);
  };

  const startMicrophone = () => {
    if (requestRef.current || !["active", "degraded"].includes(statusRef.current)) return;
    type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
    type RecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onstart: (() => void) | null;
      onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
      onerror: ((event: { error?: string }) => void) | null;
      onend: (() => void) | null;
    };
    const browser = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) {
      transitionStatus("degraded");
      setMicrophoneState("unsupported");
      setNotice("Microphone recognition is not supported here. Use Script or Manual mode.");
      return;
    }
    const recognition = new Recognition();
    const version = sessionVersion.current;
    const isCurrent = () => version === sessionVersion.current && recognitionRef.current === recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      if (!isCurrent()) return;
      setMicrophoneState("listening");
      setMicActive(true);
      setInterimTranscript("");
    };
    recognition.onresult = (event) => {
      if (!isCurrent()) return;
      let interim = "";
      const finalSegments: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        if (result.isFinal) finalSegments.push(result[0].transcript);
        else interim += result[0].transcript;
      }
      setInterimTranscript(interim.trim());
      const finalTranscript = finalSegments.join(" ").trim();
      if (finalTranscript) {
        setInterimTranscript("");
        void processTurn(finalTranscript, speaker);
      }
    };
    recognition.onerror = (event) => {
      if (!isCurrent()) return;
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      transitionStatus("degraded");
      setMicrophoneState(denied ? "denied" : "error");
      setNotice(
        denied
          ? "Microphone permission was denied. Enable it in Chrome or Edge, or use Script or Manual mode."
          : "Browser speech recognition is unavailable. Use Script or Manual mode.",
      );
      setMicActive(false);
      setInterimTranscript("");
    };
    recognition.onend = () => {
      if (!isCurrent()) return;
      setMicActive(false);
      setInterimTranscript("");
      setMicrophoneState((current) => current === "listening" ? "ready" : current);
    };
    recognitionRef.current = recognition;
    setMode("microphone");
    transitionStatus("active");
    setNotice(null);
    setMicrophoneState("ready");
    setMicActive(true);
    try {
      recognition.start();
    } catch {
      transitionStatus("degraded");
      setMicrophoneState("error");
      setMicActive(false);
      setNotice("Microphone could not start. Use Script or Manual mode, then retry when ready.");
    }
  };

  const changeMode = (nextMode: InputMode) => {
    cancelCapture();
    setMode(nextMode);
    if (nextMode !== "microphone" && status === "degraded") {
      transitionStatus("active");
      setNotice(null);
    }
  };

  const pauseMeeting = () => {
    cancelCapture();
    transitionStatus("paused");
  };

  const stopMeeting = () => {
    pauseMeeting();
    transitionStatus("stopped");
  };

  if (status === "consent") {
    return (
      <main className="consent-shell">
        <div className="consent-wordmark">
          <Image src="/clashpoint-mark.png" alt="" width={28} height={28} priority />
          <b>CLASHPOINT</b>
          <span>01</span>
        </div>
        <section className="consent-panel" aria-labelledby="consent-title">
          <div className="eyebrow">Decision integrity · live</div>
          <h1 id="consent-title">Acme release review</h1>
          <p className="consent-lede">
            ClashPoint will transcribe this meeting, detect operational decisions, and check them against
            the connected demo sources you are authorized to see.
          </p>
          <div className="source-list" aria-label="Connected demo sources">
            <div className="source-row">
              <GitBranch aria-hidden="true" />
              <div><strong>GitHub</strong><span>demo-org/product · Demo fixture</span></div>
              <span className="source-ready"><Check aria-hidden="true" /> Ready</span>
            </div>
            <div className="source-row">
              <FileText aria-hidden="true" />
              <div><strong>Notion</strong><span>Product Decisions · Demo fixture</span></div>
              <span className="source-ready"><Check aria-hidden="true" /> Ready</span>
            </div>
          </div>
          <fieldset className="mode-picker">
            <legend>Choose an input</legend>
            {(["script", "manual", "microphone"] as InputMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "mode-option selected" : "mode-option"}
                onClick={() => setMode(item)}
                aria-pressed={mode === item}
              >
                <span>{item === "script" ? "01" : item === "manual" ? "02" : "03"}</span>
                {item}
              </button>
            ))}
          </fieldset>
          <div className="consent-note"><ShieldCheck aria-hidden="true" /> No meeting history is persisted.</div>
          <button className="primary-action" onClick={startMeeting}>
            Start ClashPoint <ArrowRight aria-hidden="true" />
          </button>
        </section>
        <Image className="consent-index" src="/clashpoint-mark.png" alt="" width={260} height={260} aria-hidden="true" />
      </main>
    );
  }

  const liveLabel = status === "paused" ? "PAUSED" : status === "stopped" ? "STOPPED" : status === "degraded" ? "DEGRADED" : "LIVE";
  const inputDisabled = status === "paused" || status === "stopped";

  return (
    <main className="console-shell">
      <header className="status-header">
        <div className="brand-lockup">
          <span className="brand-mark"><Image src="/clashpoint-mark.png" alt="ClashPoint" width={24} height={24} priority /></span>
          <span>CLASHPOINT</span><i>/</i><strong>ACME RELEASE REVIEW</strong>
        </div>
        <div className="header-status">
          <span className="elapsed">{elapsed(startedAt, now)}</span>
          <span className={`live-state ${status}`}><i aria-hidden="true" />{liveLabel}</span>
          {judgeMode && <span className="judge-state"><ListChecks aria-hidden="true" />GUIDED DEMO</span>}
          <button className="evaluation-trigger" onClick={() => void openEvaluation()}><BarChart3 aria-hidden="true" />EVAL 27</button>
          <span className="source-count">DEMO SOURCES <strong>2/2</strong></span>
          <button
            className={`source-health ${liveSourceState}`}
            onClick={() => void checkLiveSource()}
            disabled={liveSourceState === "checking"}
            aria-label="Check optional live GitHub source"
            title={liveSourceMessage}
          >
            LIVE GITHUB · {liveSourceState === "checking" ? "CHECKING" : liveSourceState === "ready" ? "READY" : liveSourceState === "unavailable" ? "OFFLINE" : "CHECK"}
          </button>
        </div>
      </header>

      {(inputDisabled || notice) && <div className="degraded-banner" role="status"><AlertTriangle aria-hidden="true" />{inputDisabled ? `${liveLabel}: capture and analysis are suspended. Resume to continue.` : notice}</div>}

      <div className="console-body">
        <section className="transcript-panel" aria-labelledby="transcript-heading">
          <div className="section-heading">
            <div><span>01</span><h2 id="transcript-heading">Live transcript</h2></div>
            <small>{turns.length} FINAL TURNS</small>
          </div>
          <div className="transcript-ledger" aria-live="polite">
            {turns.length === 0 ? (
              <div className="empty-ledger"><span>Waiting for a final turn</span><div /></div>
            ) : (
              turns.map((turn, index) => (
                <article className="turn" key={turn.turnId}>
                  <div className="turn-index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="turn-content">
                    <div className="turn-meta"><strong>{turn.speakerLabel}</strong><time>{formatTime(turn.endedAt)}</time></div>
                    <p>{turn.textRaw}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="decision-panel" aria-labelledby="decision-heading">
          <div className="section-heading decision-heading">
            <div><span>02</span><h2 id="decision-heading">Decision integrity</h2></div>
            <small>AUTHORIZED SOURCES ONLY</small>
          </div>

          <div className="current-event">
            <div className="event-label">Current event</div>
            {processing ? (
              <div className="processing-copy">Resolving the operational meaning…</div>
            ) : currentEvent?.eventType && currentEvent.eventType !== "none" ? (
              <>
                <blockquote>“{currentEvent.canonicalStatement}”</blockquote>
                <div className="event-tags"><span>{currentEvent.eventType.replaceAll("_", " ")}</span><span>{currentEvent.certainty}</span></div>
              </>
            ) : (
              <div className="event-placeholder">Listening for an operational decision.</div>
            )}
          </div>

          <div className="cards-region" aria-live="polite">
            {judgeMode && <JudgeGuide cards={cards} running={runningScript} />}
            {cards.length === 0 && !processing ? (
              <div className="quiet-state">
                <div className="quiet-rule" />
                <p>No verified collision cards yet.</p>
                <span>ClashPoint only interrupts when connected evidence supports it.</span>
              </div>
            ) : (
              cards.map((card, index) => (
                <ResolutionCardView
                  card={card}
                  key={card.cardId}
                  compact={index > 0 && !expandedCardIds.has(card.cardId)}
                  onExpand={() => setExpandedCardIds((ids) => new Set(ids).add(card.cardId))}
                  onInspect={(trigger) => openEvidence(card, trigger)}
                  onRecord={() => void createReceipt(card)}
                  onDismiss={() => setCards((items) => items.filter((item) => item.cardId !== card.cardId))}
                />
              ))
            )}
          </div>

          <div className="pipeline" aria-label="Analysis pipeline status">
            <div className="pipeline-title">Pipeline activity</div>
            {(["resolve", "retrieve", "verify"] as const).map((item, index) => {
              const stageOrder = { idle: -1, resolve: 0, retrieve: 1, verify: 2 };
              const active = processing && stageOrder[stage] >= index;
              return <div key={item} className={active ? "pipeline-step active" : "pipeline-step"}><span>{String(index + 1).padStart(2, "0")}</span>{item}</div>;
            })}
            <div className="pipeline-semantic">SEMANTIC <strong>{semanticState}</strong></div>
          </div>
        </section>
      </div>

      {(mode === "manual" || mode === "microphone") && (
        <form className="composer" onSubmit={submitManual}>
          <div className="speaker-switch" aria-label="Current speaker">
            {speakers.map((item) => (
              <button type="button" key={item.id} onClick={() => setSpeaker(item)} className={speaker.id === item.id ? "active" : ""}>{item.label}</button>
            ))}
          </div>
          {mode === "manual" ? (
            <>
              <input disabled={inputDisabled} value={manualText} onChange={(event) => setManualText(event.target.value)} placeholder="Enter a final transcript turn…" aria-label="Transcript turn" />
              <button type="submit" disabled={inputDisabled || !manualText.trim() || processing}><Send aria-hidden="true" /> Submit turn</button>
            </>
          ) : (
            <div className="microphone-control">
              <button type="button" disabled={inputDisabled || processing} className={micActive ? "mic-button active" : "mic-button"} onClick={micActive ? () => recognitionRef.current?.stop() : startMicrophone}>
                <Mic aria-hidden="true" />{micActive ? "Listening — click to stop" : `Listen as ${speaker.label}`}
              </button>
              <div className="microphone-readout" aria-live="polite">
                <span className={`microphone-status ${microphoneState}`}><i aria-hidden="true" />{microphoneState === "idle" ? "Browser service" : microphoneState}</span>
                <p>{interimTranscript || "Chrome or Edge speech service · final turns use the same verified pipeline"}</p>
              </div>
            </div>
          )}
        </form>
      )}

      <ControlRail status={status} judgeMode={judgeMode} mode={mode} inputDisabled={inputDisabled} runningScript={runningScript} processing={processing} scriptPosition={scriptPosition} scriptLength={script.length} lastTiming={lastTiming} onResume={() => transitionStatus("active")} onPause={pauseMeeting} onStop={stopMeeting} onReset={reset} onJudgeMode={() => setJudgeMode((enabled) => !enabled)} onMode={changeMode} onNextBeat={() => void runScript(true)} onRunScript={() => void runScript()} />

      {selectedCard && <EvidenceDrawer card={selectedCard} onClose={closeEvidence} />}
      {evaluationOpen && (
        <EvaluationDrawer
          report={evaluationReport}
          loading={evaluationLoading}
          error={evaluationError}
          onRetry={() => void openEvaluation(true)}
          onClose={() => setEvaluationOpen(false)}
        />
      )}
    </main>
  );
}

function EvaluationDrawer({
  report,
  loading,
  error,
  onRetry,
  onClose,
}: {
  report: EvaluationReport | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const metricItems = report
    ? [
        ["Cases passed", `${report.metrics.passed}/${report.metrics.cases}`],
        ["Event accuracy", `${report.metrics.eventAccuracyPercent}%`],
        ["Collision accuracy", `${report.metrics.collisionAccuracyPercent}%`],
        ["Grounded evidence", `${report.metrics.groundedEvidencePercent}%`],
        ["False interrupts", String(report.metrics.falseInterruptions)],
        ["Median server time", `${report.metrics.medianLatencyMs} ms`],
      ]
    : [];

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="evaluation-drawer" role="dialog" aria-modal="true" aria-labelledby="evaluation-title">
        <header>
          <div><span>Measured locally</span><h2 id="evaluation-title">Frozen evaluation</h2></div>
          <button autoFocus onClick={onClose} aria-label="Close evaluation"><X aria-hidden="true" /></button>
        </header>
        <p className="evaluation-intro">A deterministic run of the 27 frozen conversation cases. These are measured results, not decorative dashboard values.</p>
        {loading && <div className="evaluation-loading">Running 27 cases…</div>}
        {error && <div className="evaluation-error"><AlertTriangle aria-hidden="true" /><span>{error}</span><button onClick={onRetry}>Retry</button></div>}
        {report && (
          <>
            <div className="evaluation-meta"><span>{report.fixtureVersion}</span><span>{new Date(report.generatedAt).toLocaleTimeString()}</span></div>
            <div className="evaluation-metrics">
              {metricItems.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className="evaluation-cases">
              <div className="evaluation-cases-head"><span>Case</span><span>Expected behavior</span><span>Result</span></div>
              {report.results.map((result) => (
                <div key={result.id} className="evaluation-case"><code>{result.id}</code><span>{result.name}</span><strong className={result.passed ? "passed" : "failed"}>{result.passed ? "PASS" : "FAIL"}</strong></div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

