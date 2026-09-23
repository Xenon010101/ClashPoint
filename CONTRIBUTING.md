# Contributing to ClashPoint

ClashPoint is evidence-first: models interpret conversation, while authorised source facts decide whether a warning is shown.

## Before you start

1. Read `agent.md` and the linked issue acceptance criteria.
2. Claim one issue and create a focused branch named `codex/<issue>-<short-topic>`.
3. State the files your change owns. If a change needs a shared hotspot, split the work or obtain agreement before editing it.

## Hotspots

`src/lib/analyze.ts`, `src/lib/schemas.ts`, and `src/components/ClashPointApp.tsx` are shared modules. Do not combine their refactors with new product behaviour. Prefer additive modules and compatibility facades.

## Required checks

Run `pnpm test` and `pnpm build`. Run `pnpm test:e2e` when a user-visible demo path changes.

## Merge rules

- One issue per pull request; avoid unrelated formatting and lockfile changes.
- Keep public schemas additive unless a linked issue explicitly authorises a break.
- Evidence must remain server-owned, authorised before use, and cited by known fact IDs only.
- Superseded or inactive facts must not trigger an interrupt.
- Provider failure must be represented as unavailable, never as a clean verification result.
