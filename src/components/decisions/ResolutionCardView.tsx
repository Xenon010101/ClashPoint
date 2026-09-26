"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import type { ResolutionCard } from "@/lib/schemas";

export function ResolutionCardView({ card, compact, onExpand, onInspect, onDismiss, onRecord }: {
  card: ResolutionCard; compact: boolean; onExpand: () => void; onInspect: (trigger: HTMLButtonElement) => void; onDismiss: () => void; onRecord?: () => void;
}) {
  const isInterrupt = card.severity === "interrupt";
  return (
    <article className={`resolution-card ${isInterrupt ? "interrupt" : "warning"} ${compact ? "compact" : ""}`} tabIndex={-1}>
      <header><div className="severity"><AlertTriangle aria-hidden="true" /><span>{isInterrupt ? "CONFLICT" : "WARNING"}</span><i>·</i>{card.title}</div><span className="fact-id">{card.evidence[0]?.factId}</span></header>
      {compact ? (
        <div className="compact-card-body"><p>“{card.eventQuote}”</p><span>{card.evidence[0]?.source} · {card.evidence[0]?.sourceDate}</span><button onClick={onExpand}>Expand decision <ChevronRight aria-hidden="true" /></button></div>
      ) : (
        <>
          <div className="card-grid"><div><span className="card-label">You said</span><p>“{card.eventQuote}”</p></div><div><span className="card-label">Conflicts with</span><blockquote>“{card.evidence[0]?.quote}”</blockquote><small>{card.evidence[0]?.source} · {card.evidence[0]?.sourceDate}</small></div></div>
          <div className="card-reason"><span>Why this matters</span><p>{card.whyItMatters}</p></div>
          {card.saferWording && <div className="safer"><span>Safer version</span><p>“{card.saferWording}”</p></div>}
          <footer><button onClick={(event) => onInspect(event.currentTarget)}>Inspect evidence <ChevronRight aria-hidden="true" /></button>{onRecord && <button onClick={onRecord}>Create receipt</button>}<button onClick={onDismiss}>Dismiss</button></footer>
        </>
      )}
    </article>
  );
}
