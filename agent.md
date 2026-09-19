# ClashPoint Agent Contract

This file constrains every implementation and review session in this repository.

## Product invariant

- Resolve the operational meaning of a final transcript turn from bounded recent context; never classify an isolated “yeah,” date, pronoun, or reversal phrase without its pending dialogue state.
- Keep raw transcript text immutable. Canonical event text is an interpretation, never a replacement.
- A `DecisionGate` result of `ignore` terminates retrieval and collision analysis.

## Trust invariant

- Filter facts by tenant/principal authorization before ranking or any model call.
- A model may select only supplied `fact_id` values. It may not author evidence quotations.
- Display evidence text only after looking up the selected ID in the server-owned fact store and rechecking authorization and status.
- Facts marked `resolved`, `superseded`, `expired`, or `unknown` cannot independently create an interrupt-level card.
- Never imply that a fact does not exist outside connected sources.

## Failure invariant

- Provider failure becomes an explicit `unavailable` state; never translate it to “no conflict found.”
- The deterministic pipeline and scripted demo must work without credentials or network access.
- Invalid schema output or unknown fact IDs are rejected and cannot produce UI evidence.

## Demo boundary

- GitHub and Notion data in this repository are seeded fixtures and must be labeled **Demo fixture** in the UI and documentation.
- Do not add OAuth, webhooks, persistent databases, autonomous source mutations, production authentication, or enterprise abstractions unless the project scope is explicitly changed.
- Do not expose secrets in browser code, logs, fixtures, `.env.example`, or error messages.

## Engineering rules

- Use the shared Zod schemas for every route and domain boundary.
- Keep browser state bounded to eight recent turns; the server owns facts, ACL filtering, retrieval, collision checks, and verification.
- Keep components small, accessible, keyboard operable, and testable.
- Preserve reduced-motion behavior, semantic landmarks, visible focus, and non-color severity labels.
- Do not introduce generic AI visual motifs: no purple gradients, glassmorphism, chat bubbles, sparkles, decorative assistants, glowing blobs, or vanity metrics.
- Follow [docs/design.md](./docs/design.md) for tokens, layout, copy, states, and responsive behavior.
- A task is complete only when its acceptance condition in [docs/tasks.md](./docs/tasks.md) passes.
