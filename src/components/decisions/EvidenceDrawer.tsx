"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { useRef } from "react";
import type { ResolutionCard } from "@/lib/schemas";
import { useModalFocus } from "@/components/useModalFocus";

export function EvidenceDrawer({ card, onClose }: { card: ResolutionCard; onClose: () => void }) {
  const evidence = card.evidence[0];
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef);
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside ref={dialogRef} className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
        <header><div><span>Verified evidence</span><h2 id="evidence-title">{evidence.source}</h2></div><button autoFocus onClick={onClose} aria-label="Close evidence"><X aria-hidden="true" /></button></header>
        <div className="fixture-badge">Demo fixture</div><blockquote>“{evidence.quote}”</blockquote>
        <dl><div><dt>Source system</dt><dd>{evidence.sourceSystem}</dd></div><div><dt>Object</dt><dd>{evidence.sourceObjectId}</dd></div><div><dt>Fact ID</dt><dd>{evidence.factId}</dd></div><div><dt>Status</dt><dd className="active-status">{evidence.status}</dd></div><div><dt>Observed</dt><dd>{new Date(evidence.observedAt).toLocaleString()}</dd></div><div><dt>Revision</dt><dd>{evidence.sourceRevision}</dd></div></dl>
        {card.evidencePath.length > 0 && <section className="evidence-path" aria-labelledby="evidence-path-title"><span id="evidence-path-title">Why ClashPoint interrupted</span><ol>{card.evidencePath.map((step, index) => <li key={`${step.relation}-${step.label}-${index}`}><small>{step.relation}</small><strong>{step.label}</strong></li>)}</ol></section>}
        <div className="freshness"><Check aria-hidden="true" /><div><strong>Freshness verified</strong><span>{card.freshness}</span></div></div>
        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open demo source <ExternalLink aria-hidden="true" /></a>
      </aside>
    </div>
  );
}
