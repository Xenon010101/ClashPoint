# ClashPoint Design and Technical Contract

## Product frame

ClashPoint is a live decision-integrity instrument, not a meeting summary or chatbot. The judged experience must make three ideas immediately legible: what was said, what company fact disagrees, and why the evidence can be trusted.

## Visual principles

1. **Editorial hierarchy over cards.** Use rules, alignment, and whitespace; avoid a bento dashboard.
2. **Color carries state.** Amber is warning, red is conflict, green is readiness. Never use those colors decoratively.
3. **Evidence looks factual.** Source IDs, timestamps, revisions, and quotes use mono typography and consistent alignment.
4. **Motion confirms change.** Use 160–220ms transitions; only the recording dot may pulse.
5. **No AI costume.** No gradients, glass, chat bubbles, sparkles, floating assistants, or decorative charts.
6. **Metrics must be measured.** Evaluation values come from the frozen server-side suite and expose their individual cases; no vanity numbers are hard-coded into the UI.

## Brand mark

The primary mark is `public/clashpoint-mark.png`: two opposing operational paths converging around one restrained red verification point. Use the transparent original on graphite backgrounds. The mark appears in the consent wordmark, meeting header, evidence-source pages, favicon metadata, README, and generated acceptance screenshots. Do not recolor it, add effects, place it inside a rounded app tile, or combine it with a second symbol.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink-950` | `#0b0d0f` | page background |
| `--ink-900` | `#111418` | raised surface |
| `--ink-850` | `#171b20` | hover/selected surface |
| `--line` | `#2a3037` | structural rules |
| `--paper` | `#f2efe7` | primary text |
| `--muted` | `#98a2ad` | secondary text |
| `--amber` | `#efb64a` | warning only |
| `--red` | `#f06464` | interrupt only |
| `--green` | `#61b98b` | healthy/connected only |
| `--blue` | `#78a7d8` | neutral focus/action |

- Typography: IBM Plex Sans for interface text; IBM Plex Mono for metadata, timestamps, IDs, labels, and timings.
- Spacing unit: 4px. Main gaps: 12, 16, 24, and 32px.
- Radius: 6px controls, 8px surfaces, 10px resolution cards.
- Borders: 1px solid `--line`; severity cards add a 3px left border.
- Focus: 2px `--blue` outline with 2px offset.

## Desktop composition

Target 1440×900 and 1920×1080. Header is 64px, control rail 64px, body fills the remaining viewport. Transcript is 36%; decision surface is 64%.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ CLASHPOINT / ACME RELEASE REVIEW    08:42  ● LIVE   SOURCES 2/2     │
├──────────────────────────┬───────────────────────────────────────────┤
│ LIVE TRANSCRIPT          │ DECISION INTEGRITY                       │
│ chronological ledger     │ current canonical event                  │
│ speaker / time / text    │ resolution-card stack                    │
│                          │ pipeline activity                         │
├──────────────────────────┴───────────────────────────────────────────┤
│ Pause · Stop · Reset     Script / Manual / Microphone     312 ms    │
└──────────────────────────────────────────────────────────────────────┘
```

Evidence opens from the right and leaves the transcript visible. At widths below 960px the body stacks; below 720px evidence becomes a full-screen sheet.

## Component hierarchy

- `ConsentScreen`
- `MeetingConsole`
  - `StatusHeader`
  - `TranscriptLedger`
  - `DecisionSurface`
    - `CurrentEvent`
    - `JudgeGuide`
    - `ResolutionCard[]`
    - `PipelineActivity`
  - `ControlRail`
  - `ManualComposer`
  - `EvidenceDrawer`
  - `EvaluationDrawer`

## UI states

- **Consent:** disclosure, meeting name, connected demo sources, input selection, start action.
- **Listening:** live status, transcript ledger, no unearned “all clear.”
- **Processing:** compact Resolve → Retrieve → Verify stage row.
- **Checked/no issue:** only after a completed check; copy is scoped to connected sources.
- **Warning:** amber border and explicit `WARNING` label; transcript remains active.
- **Conflict:** red border and explicit `CONFLICT` label; card receives focus.
- **Paused:** persistent banner and no capture.
- **Degraded:** names the unavailable capability and exposes fallbacks.
- **Stopped:** transcript is retained in the current browser session; analysis stops.
- **Reset:** returns to the consent screen and initial fixtures.
- **Cancellation:** Pause, Stop, Reset, mode changes, and unmount invalidate old request and recognition callbacks. Pause/Stop disable all input until Resume. The ledger preserves captured raw turns; Reset clears it.
- **Presenter pacing:** Next demo beat processes the question/answer pair together, then one commitment and one assignment. Automatic playback resumes from the same cursor. Reset clears the cursor.
- **Guided demo:** a restrained Context → Policy → Capacity rail explains the golden path and can be disabled.
- **Evaluation:** a read-only drawer runs the 27 frozen cases and shows both aggregate measurements and per-case pass/fail state.
- **Microphone interim:** speech-service text is visibly provisional until the browser marks it final; unsupported, denied, and service-error states name Script and Manual as fallbacks.

## Resolution card

Required order: severity/type, “You said,” “Conflicts with,” source/date/status, “Why this matters,” optional safer wording, then Inspect evidence and Dismiss. Evidence text is verbatim from the fact store. Color is never the only severity signal.

The newest resolution card is expanded. Older cards collapse to severity, trigger, source, and an explicit Expand action; no evidence or dismissal state is lost.

## Domain contracts

`TranscriptTurn`, `ConversationEvent`, `Fact`, `CollisionRecord`, and `ResolutionCard` are defined once in `src/lib/schemas.ts` with Zod and inferred TypeScript types.

`POST /api/analyze-turn` accepts the current final turn plus at most eight recent turns, a fixed demo principal, and an optional fixture variant. It returns the normalized event, gate decision, verified collision/card, capability state, and stage timings.

`GET /api/evaluation` executes the fixed 27-case corpus without persistence and returns measured accuracy, grounding, false-interruption, latency, and per-case outcomes. The response is `no-store` so the drawer represents the current code path.

Pipeline:

```text
final turn → dialogue resolver → decision gate
  → authorized fact filter → retrieval → deterministic checks
  → optional semantic resolver → fact-ID verifier → resolution card
```

The browser owns the ephemeral meeting and transcript. The server owns seed facts, ACL filtering, ranking, checks, and evidence verification. There is no database.

## Fixture facts and golden scenarios

- `F-DEP-1`: GitHub GH-42 Auth Refactor is open and blocks SSO.
- `F-LEGAL-1`: Notion Legal Review requires DPA approval before promising Feature X externally.
- `F-CAP-1`: Valya owns three active P0s and the configured limit is three.
- `F-APPROVAL-2`: later approval supersedes `F-LEGAL-1` in the approval variant.
- `F-PRIVATE-1`: restricted Notion fact denied to `demo_product`.
- `F-DEC-1`: active Notion decision to use the standard Acme export rather than a custom export.

Golden scenarios:

1. Operational question + “Yeah” → status mismatch with `F-DEP-1`.
2. Friday external promise → legal/policy conflict with `F-LEGAL-1` and safer wording.
3. New P0 assigned to Valya → capacity conflict with `F-CAP-1`.

The extended frozen corpus covers 27 cases: context-dependent affirmations/rejections, conditional and tentative language, corrections, dates, pronouns, ownership, prior decisions, supersession, and restricted evidence. `src/lib/evaluation.ts` is the canonical corpus.

Additional language regressions in `src/lib/language-regression.test.ts` remain outside the displayed score. A short response only resolves against the immediately preceding operational context. Topic changes consume that context. Pronouns require an unambiguous adjacent subject/owner pair; unresolved short references are not passed to Gemini. Negation precedes commitment detection and conditional language cannot independently produce a red capacity alert.

## Optional Gemini boundary

Gemini may be called only for unfamiliar phrasing that deterministic resolution cannot confidently classify. It receives already-authorized candidate facts and returns schema-valid classifications with supplied fact IDs only. Missing configuration, timeouts, invalid output, and unknown IDs produce `semantic: unavailable` or a deterministic fallback—never an invented clean result.

## Accessibility and motion

- WCAG AA contrast, visible focus, semantic headings/landmarks, labeled controls, and escape-to-close drawer.
- Statuses use text and shape in addition to color.
- Honor `prefers-reduced-motion`; disable pulsing and translate animations.

## Visual acceptance

- Capture the consent screen and each golden card at 1440×900.
- Capture the active console at 1920×1080.
- Confirm no clipped text, horizontal overflow, obscured controls, generic AI decoration, or unreadable evidence metadata.
