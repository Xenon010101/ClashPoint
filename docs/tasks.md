# ClashPoint Delivery Tasks

The implementation order is binding. P0 is required for the hackathon demo; P1 is optional only after every P0 acceptance condition passes.

## Phase 0 — Documentation (P0)

- [x] **DOC-01** Create `README.md`. Acceptance: setup, demo, deployment, browser support, and fallback instructions are explicit.
- [x] **DOC-02** Create `agent.md`. Acceptance: context, permission, evidence, freshness, failure, and visual invariants are unambiguous.
- [x] **DOC-03** Create `docs/design.md`. Acceptance: tokens, states, wireframe, contracts, fixtures, and screenshots are specified.
- [x] **DOC-04** Create `docs/tasks.md`. Acceptance: every build phase has measurable completion criteria.

## Phase 1 — Application and static shell (P0)

- [x] **APP-01** Scaffold Next.js, TypeScript, Tailwind, linting, Vitest, and Playwright. Depends: DOC-01–04. Acceptance: dev server and production build start cleanly.
- [x] **UI-01** Build consent/start screen. Depends: APP-01. Acceptance: disclosure, meeting, two labeled demo sources, mode choice, and start action are keyboard accessible.
- [x] **UI-02** Build console layout and tokens. Depends: APP-01. Acceptance: 36/64 desktop split, fixed header/control rail, responsive stack, no generic AI decoration.
- [x] **UI-03** Build transcript, current event, card, activity, composer, and drawer components. Depends: UI-02. Acceptance: all design states render from fixture props and drawer is keyboard operable.

## Phase 2 — Deterministic pipeline (P0)

- [x] **CORE-01** Add shared Zod schemas. Acceptance: valid contracts parse and unknown enum values fail.
- [x] **CORE-02** Add server facts, variants, and ACL filtering. Depends: CORE-01. Acceptance: restricted fact never appears for `demo_product`; approval variant supersedes the blocker.
- [x] **CORE-03** Add dialogue resolver and decision gate. Depends: CORE-01. Acceptance: operational “Yeah,” non-operational “Yeah,” tentative language, dates, and reversals match fixtures.
- [x] **CORE-04** Add retrieval and deterministic collision checks. Depends: CORE-02–03. Acceptance: status, policy, capacity, ownership, dependency, and freshness fixtures return exact IDs.
- [x] **CORE-05** Add verifier and resolution-card builder. Depends: CORE-04. Acceptance: every evidence quote equals its stored fact; invalid IDs cannot create cards.
- [x] **API-01** Add `POST /api/analyze-turn`. Depends: CORE-01–05. Acceptance: request/response validation, eight-turn bound, timings, and honest semantic state are enforced.
- [x] **UI-04** Connect console to API. Depends: UI-03, API-01. Acceptance: all golden turns create the intended transcript/event/card state.
- [x] **UI-05** Add compact decision history and Guided Judge Mode. Depends: UI-04. Acceptance: newest card remains expanded, older cards are recoverable, and Context → Policy → Capacity advances from actual evidence IDs.

## Phase 3 — Input modes (P0)

- [x] **INPUT-01** Add timed Script mode and reset. Depends: UI-04. Acceptance: three golden cards appear in sequence and five resets return identical state.
- [x] **INPUT-02** Add Manual mode with speaker selection. Depends: UI-04. Acceptance: submitted text traverses the same endpoint and cannot submit blank turns.
- [ ] **INPUT-03** Add browser microphone adapter. Interim results, explicit unsupported/denied/error states, and one-click fallbacks are complete; acceptance still requires a live microphone-permission rehearsal in Chrome or Edge.

## Phase 4 — Optional semantic resolver (P1)

- [x] **AI-01** Add server-only Gemini adapter. Depends: API-01. Acceptance: it is disabled by default and no credential enters browser code.
- [x] **AI-02** Validate model output and isolate it from evidence. Depends: AI-01. Acceptance: malformed output and timeout degrade honestly; the optional resolver is not permitted to return evidence IDs or quotations.

## Phase 5 — Verification and delivery (P0)

- [x] **TEST-01** Unit-test schemas, resolver, gate, ACL, retrieval, collision checks, supersession, and verifier. Acceptance: required safety and golden fixtures pass.
- [x] **GRAPH-01** Add an in-memory Graphify projection. Acceptance: it projects only authorised active facts, is idempotent, and cannot create evidence from conversation context.
- [x] **GRAPH-02** Add bounded evidence-path explanations. Acceptance: a verified conflict can expose a cycle-safe path with stored fact IDs in the evidence drawer.
- [x] **SOURCE-01** Define the read-only SourceAdapter contract. Acceptance: adapters expose explicit health and refresh states without provider types, credentials, or verification logic leaking into the engine.
- [x] **TEST-05** Add source/graph adversarial contracts. Acceptance: unavailable sources, prompt-injection-like transcript text, topic switching, ambiguous owners, and graph cycles cannot manufacture a conflict or hang analysis.
- [x] **TEST-02** Test API success, invalid input, bounded context, restricted variant, approval variant, and provider failure. Acceptance: response contracts and failure language pass.
- [x] **TEST-03** Add Playwright consent → script → evidence → reset and manual-input flows. Acceptance: stable in installed Edge.
- [x] **TEST-04** Add frozen 27-case evaluation and read-only report route. Acceptance: all cases pass, every expected collision is grounded, and false interrupt count is zero.
- [x] **UI-06** Add measured evaluation drawer. Depends: TEST-04. Acceptance: aggregates and all 27 case outcomes load from `GET /api/evaluation`; no metric is decorative.
- [x] **VIS-01** Capture required 1440×900 and 1920×1080 states. Acceptance: no clipping, overflow, hidden controls, or illegible metadata.
- [ ] **DEPLOY-01** Verify Vercel configuration. Acceptance: hosted demo works without Gemini credentials. Status: intentionally deferred until explicit owner approval; no deployment has been attempted.
- [ ] **DEMO-01** Rehearse scripted and microphone flows. Acceptance: golden narrative completes within 90 seconds with local fallback ready.

## Demo freeze

- [x] **HARDEN-01** Invalidate delayed analysis and microphone callbacks on Pause, Stop, Reset, and mode change. Acceptance: lifecycle tests deliver stale responses deliberately and verify no card or error can reappear.
- [x] **HARDEN-02** Limit short replies and pronouns to current unambiguous context. Acceptance: topic-change, ambiguous-owner, negation, and date regressions pass.
- [x] **HARDEN-03** Add 20 additional language regression cases outside the displayed 27-case corpus. Acceptance: paraphrases and safety cases pass without changing the original evaluation expectations.
- [x] **DEMO-02** Add presenter-controlled Next demo beat. Acceptance: browser test advances all three beats, blocks playback while paused, and verifies Reset restores the first beat.

- [ ] All P0 tasks and safety tests pass.
- [x] Script and Reset pass five consecutive runs.
- [x] Hosted and local builds use the same fixtures and copy.
- [x] No real-looking secret exists in source or examples.
- [x] Every source surface says **Demo fixture**.
- [x] Frozen 27-case run passes with 100% grounded evidence and zero false interrupts.
- [x] README recovery steps are verified on the demo laptop.
- [ ] No new feature or dependency is added during the final 24 hours; only proven bug fixes are permitted.
