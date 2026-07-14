# Deferred Items — Phase 35 (Places Text-vs-Engine Reconciliation)

Out-of-scope discoveries found during plan execution. Logged, not fixed, per the
executor's Scope Boundary rule (only auto-fix issues directly caused by the
current task's changes).

## 35-01: Pre-existing `npm run test:cards` failures (mosje-abilities.spec.js)

Found during: Task 1/2 verification (`npm run test:cards`)

- `ability: mosje_amplifier — MP_GAIN` — expects ownDelta >= 10, got -30
- `ability: mosje_binti_creator — DRAW` — expects deckDrawn >= 1, got 0

Both failures are in `tests/ui/cards/mosje-abilities.spec.js` / `card-registry.js`,
entirely unrelated to Places (`src/data/places.js` / `src/abilities/placeEffects.js`)
or this plan's files. Neither `mosje_amplifier` nor `mosje_binti_creator` is touched
by Bank Chilling or Obby #1. Confirmed pre-existing via `git log` — `mosjeAbilities.js`
was last touched by an unrelated Chris DDR commit (`cd93c32`), not by this plan.

Not fixed here — out of scope for phase 35 (Places). Flagging for a future
ability-text-reconciliation pass.
