"use client";

import { Check } from "lucide-react";
import type { ResolutionCard } from "@/lib/schemas";

export function JudgeGuide({ cards, running }: { cards: ResolutionCard[]; running: boolean }) {
  const found = new Set(cards.flatMap((card) => card.evidence.map((item) => item.factId)));
  const completed = ["F-DEP-1", "F-LEGAL-1", "F-CAP-1"].filter((factId) => found.has(factId)).length;
  const guidance = [
    "Choose Next demo beat to resolve “Yeah” against the blocker question. Advance each beat when ready.",
    "Status warning found. Inspect GH-42, then choose Next demo beat to test the customer promise.",
    "Legal conflict found. Next, ClashPoint checks the P0 assignment against capacity.",
    "Golden path complete: context, legal policy, and capacity were all verified from source evidence.",
  ][completed];

  return (
    <aside className="judge-guide" aria-label="Guided judge demo">
      <div className="judge-guide-head"><span>Judge guide</span><strong>{completed}/3 checks</strong></div>
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
