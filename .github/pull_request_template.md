## Linked issue

Closes #

## What changed

## Files intentionally changed

## Out of scope

## Contract impact

- [ ] No public schema/API change
- [ ] Additive/backwards-compatible schema change
- [ ] Breaking change explicitly approved in the linked issue

## ClashPoint trust invariants

- [ ] Authorisation occurs before protected evidence is used
- [ ] LLM output cannot create source evidence
- [ ] Evidence text comes from the canonical fact store
- [ ] Superseded/expired facts cannot independently create critical alerts
- [ ] Provider failure is not represented as “no conflict”

## Testing

- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e` when relevant
- [ ] New behaviour has regression coverage

## Merge safety

- [ ] Branch is up to date with `master`
- [ ] No unrelated refactoring or dependency change
- [ ] Feature flags preserve existing demo behaviour by default
