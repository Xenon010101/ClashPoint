"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  CircleStop,
  ExternalLink,
  FileText,
  GitBranch,
  ListChecks,
  Mic,
  Pause,
  Play,
  RotateCcw,
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

type InputMode = "script" | "manual" | "microphone";
type MeetingStatus = "consent" | "active" | "paused" | "stopped" | "degraded";
type Speaker = { id: "spk_maya" | "spk_diego"; label: "Maya" | "Diego" };

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
  const [mode, setMode] = useState<InputMode>("script");
  const [speaker, setSpeaker] = useState<Speaker>(speakers[0]);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  const [cards, setCards] = useState<ResolutionCard[]>([]);
  const [currentEvent, setCurrentEvent] = useState<ConversationEvent | null>(null);
  const [selectedCard, setSelectedCard] = useState<ResolutionCard | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [judgeMode, setJudgeMode] = useState(true);
  const [manualText, setManualText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<"idle" | "resolve" | "retrieve" | "verify">("idle");
  const [semanticState, setSemanticState] = useState<"complete" | "skipped" | "unavailable">("skipped");
  const [lastTiming, setLastTiming] = useState<number | null>(null);
  const [runningScript, setRunningScript] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const scriptAbort = useRef(false);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedCard) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCard]);

  const processTurn = useCallback(async (text: string, activeSpeaker: Speaker) => {
    const clean = text.trim();
    if (!clean) return;
    const current = makeTurn(turnsRef.current.length + 1, activeSpeaker, clean);
    const recent = turnsRef.current.slice(-8);
    turnsRef.current = [...turnsRef.current, current];
    setTurns(turnsRef.current);
    setProcessing(true);
    setStage("resolve");
    setNotice(null);

    const stageTimer = window.setTimeout(() => setStage("retrieve"), 180);
    try {
      const response = await fetch("/api/analyze-turn", {
        method: "POST",
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
      setStage("verify");
      const result = (await response.json()) as AnalyzeTurnResponse;
      setCurrentEvent(result.event);
      setSemanticState(result.checks.semantic);
      setLastTiming(result.timingsMs.total);
      if (result.card) {
        setCards((existing) => [result.card!, ...existing.filter((card) => card.cardId !== result.card!.cardId)]);
      }
    } catch {
      setStatus("degraded");
      setNotice("Analysis is temporarily unavailable. Script and transcript controls remain active.");
    } finally {
      window.clearTimeout(stageTimer);
      setProcessing(false);
      setStage("idle");
    }
  }, []);

  const startMeeting = () => {
    setStatus("active");
    setStartedAt(Date.now());
    setNotice(null);
  };

  const reset = () => {
    scriptAbort.current = true;
    recognitionRef.current?.stop();
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
    setRunningScript(false);
    setMicActive(false);
    setNotice(null);
    setStartedAt(null);
    setStatus("consent");
  };

  const runScript = async () => {
    if (runningScript || processing) return;
    scriptAbort.current = false;
    setMode("script");
    setStatus("active");
    setRunningScript(true);
    for (const line of script) {
      if (scriptAbort.current) break;
      await processTurn(line.text, line.speaker);
      await new Promise((resolve) => window.setTimeout(resolve, 1_250));
    }
    setRunningScript(false);
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!manualText.trim() || processing) return;
    const text = manualText;
    setManualText("");
    await processTurn(text, speaker);
  };

  const startMicrophone = () => {
    type RecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const browser = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("degraded");
      setNotice("Microphone recognition is not supported here. Use Script or Manual mode.");
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const result = event.results[0];
      if (result?.isFinal) void processTurn(result[0].transcript, speaker);
    };
    recognition.onerror = () => {
      setStatus("degraded");
      setNotice("Microphone permission or recognition failed. Use Script or Manual mode.");
      setMicActive(false);
    };
    recognition.onend = () => setMicActive(false);
    recognitionRef.current = recognition;
    setMode("microphone");
    setStatus("active");
    setMicActive(true);
    recognition.start();
  };

  const pauseMeeting = () => {
    scriptAbort.current = true;
    recognitionRef.current?.stop();
    setRunningScript(false);
    setMicActive(false);
    setStatus("paused");
  };

  const stopMeeting = () => {
    pauseMeeting();
    setStatus("stopped");
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
          <span className="source-count">SOURCES <strong>2/2</strong></span>
        </div>
      </header>

      {notice && <div className="degraded-banner" role="status"><AlertTriangle aria-hidden="true" />{notice}</div>}

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
                  onInspect={() => setSelectedCard(card)}
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
              <input value={manualText} onChange={(event) => setManualText(event.target.value)} placeholder="Enter a final transcript turn…" aria-label="Transcript turn" />
              <button type="submit" disabled={!manualText.trim() || processing}><Send aria-hidden="true" /> Submit turn</button>
            </>
          ) : (
            <button type="button" className={micActive ? "mic-button active" : "mic-button"} onClick={micActive ? () => recognitionRef.current?.stop() : startMicrophone}>
              <Mic aria-hidden="true" />{micActive ? "Listening — click to stop" : `Listen as ${speaker.label}`}
            </button>
          )}
        </form>
      )}

      <footer className="control-rail">
        <div className="meeting-controls">
          {status === "paused" || status === "stopped" ? (
            <button onClick={() => setStatus("active")}><Play aria-hidden="true" /> Resume</button>
          ) : (
            <button onClick={pauseMeeting}><Pause aria-hidden="true" /> Pause</button>
          )}
          <button onClick={stopMeeting}><CircleStop aria-hidden="true" /> Stop</button>
          <button onClick={reset}><RotateCcw aria-hidden="true" /> Reset</button>
          <button className={judgeMode ? "judge-toggle active" : "judge-toggle"} onClick={() => setJudgeMode((enabled) => !enabled)} aria-pressed={judgeMode}><ListChecks aria-hidden="true" /> Judge guide</button>
        </div>
        <div className="mode-tabs" aria-label="Input mode">
          {(["script", "manual", "microphone"] as InputMode[]).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        <div className="rail-action">
          {mode === "script" && <button className="run-script" onClick={runScript} disabled={runningScript || processing}><Play aria-hidden="true" />{runningScript ? "Running script" : "Run demo script"}</button>}
          <span className="timing">{lastTiming === null ? "—" : lastTiming < 1 ? "<1 ms" : `${lastTiming} ms`}</span>
        </div>
      </footer>

      {selectedCard && <EvidenceDrawer card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </main>
  );
}

function JudgeGuide({ cards, running }: { cards: ResolutionCard[]; running: boolean }) {
  const found = new Set(cards.flatMap((card) => card.evidence.map((item) => item.factId)));
  const completed = ["F-DEP-1", "F-LEGAL-1", "F-CAP-1"].filter((factId) => found.has(factId)).length;
  const guidance = [
    "Run the demo script. Watch “Yeah” resolve against the blocker question—not as an isolated word.",
    "Status warning found. Inspect GH-42, then let the script test the customer promise.",
    "Legal conflict found. Next, ClashPoint checks the P0 assignment against capacity.",
    "Golden path complete: context, legal policy, and capacity were all verified from source evidence.",
  ][completed];

  return (
    <aside className="judge-guide" aria-label="Guided judge demo">
      <div className="judge-guide-head">
        <span>Judge guide</span>
        <strong>{completed}/3 checks</strong>
      </div>
      <p>{running ? "Demo running — follow the decision cards as they arrive." : guidance}</p>
      <div className="judge-beats" aria-hidden="true">
        {["Context", "Policy", "Capacity"].map((label, index) => (
          <span key={label} className={completed > index ? "complete" : completed === index ? "current" : ""}>
            <i>{completed > index ? <Check /> : index + 1}</i>{label}
          </span>
        ))}
      </div>
    </aside>
  );
}

function ResolutionCardView({
  card,
  compact,
  onExpand,
  onInspect,
  onDismiss,
}: {
  card: ResolutionCard;
  compact: boolean;
  onExpand: () => void;
  onInspect: () => void;
  onDismiss: () => void;
}) {
  const isInterrupt = card.severity === "interrupt";
  return (
    <article className={`resolution-card ${isInterrupt ? "interrupt" : "warning"} ${compact ? "compact" : ""}`} tabIndex={-1}>
      <header>
        <div className="severity"><AlertTriangle aria-hidden="true" /><span>{isInterrupt ? "CONFLICT" : "WARNING"}</span><i>·</i>{card.title}</div>
        <span className="fact-id">{card.evidence[0]?.factId}</span>
      </header>
      {compact ? (
        <div className="compact-card-body">
          <p>“{card.eventQuote}”</p>
          <span>{card.evidence[0]?.source} · {card.evidence[0]?.sourceDate}</span>
          <button onClick={onExpand}>Expand decision <ChevronRight aria-hidden="true" /></button>
        </div>
      ) : (
        <>
      <div className="card-grid">
        <div><span className="card-label">You said</span><p>“{card.eventQuote}”</p></div>
        <div><span className="card-label">Conflicts with</span><blockquote>“{card.evidence[0]?.quote}”</blockquote><small>{card.evidence[0]?.source} · {card.evidence[0]?.sourceDate}</small></div>
      </div>
      <div className="card-reason"><span>Why this matters</span><p>{card.whyItMatters}</p></div>
      {card.saferWording && <div className="safer"><span>Safer version</span><p>“{card.saferWording}”</p></div>}
      <footer><button onClick={onInspect}>Inspect evidence <ChevronRight aria-hidden="true" /></button><button onClick={onDismiss}>Dismiss</button></footer>
        </>
      )}
    </article>
  );
}

function EvidenceDrawer({ card, onClose }: { card: ResolutionCard; onClose: () => void }) {
  const evidence = card.evidence[0];
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
        <header><div><span>Verified evidence</span><h2 id="evidence-title">{evidence.source}</h2></div><button autoFocus onClick={onClose} aria-label="Close evidence"><X aria-hidden="true" /></button></header>
        <div className="fixture-badge">Demo fixture</div>
        <blockquote>“{evidence.quote}”</blockquote>
        <dl>
          <div><dt>Source system</dt><dd>{evidence.sourceSystem}</dd></div>
          <div><dt>Object</dt><dd>{evidence.sourceObjectId}</dd></div>
          <div><dt>Fact ID</dt><dd>{evidence.factId}</dd></div>
          <div><dt>Status</dt><dd className="active-status">{evidence.status}</dd></div>
          <div><dt>Observed</dt><dd>{new Date(evidence.observedAt).toLocaleString()}</dd></div>
          <div><dt>Revision</dt><dd>{evidence.sourceRevision}</dd></div>
        </dl>
        <div className="freshness"><Check aria-hidden="true" /><div><strong>Freshness verified</strong><span>{card.freshness}</span></div></div>
        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open demo source <ExternalLink aria-hidden="true" /></a>
      </aside>
    </div>
  );
}
