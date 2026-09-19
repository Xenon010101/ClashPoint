<img src="./public/clashpoint-mark.png" alt="ClashPoint logo" width="72" />

# ClashPoint

ClashPoint is a real-time decision-consistency copilot for meetings. It resolves commitments, approvals, deadlines, assignments, and status claims from conversational context, checks them against authorized company facts, and presents exact source evidence when the meeting and the recorded reality disagree. This repository is a hackathon demo: GitHub and Notion are represented by clearly labeled, server-side fixtures; the analysis and evidence-verification path is real.

## Run locally

Requirements: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The deterministic demo requires no external services.

Optional Gemini configuration:

```bash
GEMINI_ENABLED=false
GEMINI_AUTH_KEY=
GEMINI_MODEL=
```

Gemini is an optional resolver for unfamiliar phrasing. When it is disabled or unavailable, deterministic checks continue and the interface reports the semantic check state honestly.

## Demo modes

- **Script:** runs the judge-facing sequence through the real `/api/analyze-turn` pipeline.
- **Manual:** choose Maya or Diego, enter a final transcript turn, and submit it.
- **Microphone:** uses the browser `SpeechRecognition` API with visible interim text, permission/error states, and immediate recovery. Use current Chrome or Edge; recognition may use an online browser service. Manual and Script remain available as fallbacks.

Guided Judge Mode is enabled by default. It advances through Context → Policy → Capacity while the script runs. Older cards collapse into a compact decision history so the newest finding remains readable. Choose **EVAL 27** in the header to run and inspect the frozen 27-case fixture suite; every number in that drawer is returned by the live evaluation endpoint.

## 90-second judge flow

1. Start **Acme release review** and point out the two connected demo sources.
2. Run Script. Maya asks, “Are all the Acme blockers cleared?” Diego answers, “Yeah.” ClashPoint resolves the short reply and shows a yellow status mismatch grounded in GitHub issue GH-42.
3. Maya says, “Okay. Let’s promise Feature X to Acme by Friday.” ClashPoint shows a red policy conflict with the exact Notion fixture and safer wording.
4. Maya says, “Fine. Make the new work P0 and give it to Valya.” ClashPoint shows a deterministic capacity conflict.
5. Open an evidence drawer to show source, revision, freshness, and the **Demo fixture** label.
6. Open **EVAL 27** and show that all 27 frozen language/safety cases were measured, including grounded-evidence rate and false interruptions.
7. Reset, switch to Manual or Microphone, and demonstrate that every input mode uses the same analysis endpoint.

## Deploy to Vercel

Deployment is intentionally deferred until the repository owner explicitly approves it. These are the prepared steps; they have not been executed.

1. Push the repository to GitHub and import it into Vercel as a Next.js project.
2. Keep `GEMINI_ENABLED=false` for a credential-free public demo, or add the optional server-only variables above.
3. Deploy and verify Script, Reset, Manual, and the evidence drawer.
4. Test microphone permission in Chrome or Edge over the deployed HTTPS URL.

## Troubleshooting

- **Microphone unsupported or denied:** switch to Manual or Script from the bottom control rail.
- **Gemini unavailable:** deterministic checks remain active; no clean bill of health is fabricated.
- **Venue internet is unreliable:** use the local build and Script mode.
- **A demo run is out of sequence:** press Reset; this restores the exact initial fixture state.
- **Evaluation drawer cannot load:** close it and retry; it is a read-only local fixture run and does not affect the meeting pipeline.

## Commands

```bash
pnpm dev          # local development
pnpm build        # production build
pnpm test         # unit and contract tests
pnpm test:e2e     # Playwright golden path
```

Implementation invariants live in [agent.md](./agent.md), the UI and architecture contract in [docs/design.md](./docs/design.md), and the delivery checklist in [docs/tasks.md](./docs/tasks.md).

## Brand asset

The primary transparent product mark is [`public/clashpoint-mark.png`](./public/clashpoint-mark.png). It represents two operational paths converging on one verified collision point. Use it on dark graphite surfaces without recoloring, shadows, gradients, or an enclosing app-icon tile.
