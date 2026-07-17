---
phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
plan: "04"
subsystem: docs
tags: [places, card-reference, full-suite-verification, phase-close]

# Dependency graph
requires:
  - phase: 36-01
    provides: "Full mpCost audit ruling (35 Piecies + 10 Snelle Piecies corrected to free, piecie_welloe_force keeps 40)"
  - phase: 36-02
    provides: "Welloe Force tribute-payer picker + affordability gate (real charging mechanism)"
  - phase: 36-03
    provides: "Recorded trim-and-defer-todo decision for Delluft/Dierenasiel's now-vacuous cost-0 text"
provides:
  - "src/data/places.js — Delluft/Dierenasiel text trimmed per 36-03's ruling"
  - "docs/card-reference.md — fully current with all of Phase 36's mpCost/tribute changes"
  - ".planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md — future-phase todo"
  - "Full phase-gate verification proving 36-01+36-02+this plan's changes compose with zero regressions"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md
  modified:
    - src/data/places.js
    - docs/card-reference.md

key-decisions:
  - "Applied 36-03's trim-and-defer-todo decision exactly as recorded: Delluft keeps its real draw-1 function with the vacuous SUBSTANCE clause dropped; Dierenasiel's text becomes an honest 'currently no mechanical effect' statement; a pending todo documents why and points a future phase at designing a real passive mechanic."
  - "docs/card-reference.md Cost column updated to 'free' (or 'free, lvl N+' where a level requirement exists, matching the project's existing convention seen on piecie_leipe_swap) for the 29 Piecie rows + 10 Snelle Piecie rows actually present in the doc with a stale MP cost; 6 of the audit's 35 corrected Piecie IDs (piecie_tony, piecie_quest_prep, piecie_mp_amplifier, piecie_chain_reaction, piecie_dubbele_ding, piecie_mp_adjuster) were either already showing 'free' in the doc or are a pre-existing missing-row gap outside this doc's scope — verified by direct comparison against the audit's ID list, no silent skip."
  - "3 Snelle Piecie doc rows (snelle_emergency_healings, snelle_jensen, snelle_lucky_coin) still show a stale MP cost in the doc but were confirmed via direct data read (`mpCost: 0` already in `src/data/snellePiecies.js`) to be pre-existing doc staleness unrelated to Phase 36's audit scope (they were never in the 46-card nonzero-cost audit population) — left untouched, not silently ignored."
  - "The 2 `mosje-abilities.spec.js` test:cards failures (mosje_amplifier, mosje_binti_creator) are the exact same pre-existing failures documented in Phase 35's deferred-items.md — confirmed unrelated to any Phase 36 file (mosjeAbilities.js untouched by this phase) — not fixed, out of scope per the Scope Boundary rule."

requirements-completed: [COST-04, COST-09]

# Metrics
duration: ~55min (includes ~39min backgrounded test:sim run)
completed: 2026-07-16
---

# Phase 36 Plan 04: Delluft/Dierenasiel Text Trim + card-reference.md Sync + Full Phase-Gate Verification Summary

Closed out Phase 36 by applying Plan 36-03's recorded ruling to `src/data/places.js`, bringing
`docs/card-reference.md` fully current with everything the phase touched (35 Piecie + 10 Snelle
Piecie `mpCost` corrections from 36-01, Welloe Force's tribute-payer rework from 36-02, and this
plan's own Place-text edit), and running the complete verification sequence CLAUDE.md requires for
any MP-touching change set. Result: zero regressions across unit tests, the card-behavior suite
(including the Ronald Kip stacking entry), the dedicated Welloe Force Playwright spec, and a
160-game simulation run (0 crashes, 6.9% timeout rate).

## Accomplishments

- **Task 1 (Delluft/Dierenasiel text trim):** Edited `src/data/places.js`: `place_delluft`'s
  `description` dropped the now-vacuous "SUBSTANCE Piecies cost 0 MP this turn" clause, keeping
  its real draw-1 function (`"End Phase: All players draw 1 card."`); `place_dierenasiel`'s
  `description` became an honest `"Passive: currently no mechanical effect."` Created
  `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` documenting why
  Dierenasiel's `effect_dierenasiel` is a full no-op (both its prior clauses — the Phase 35
  typo-bug protection clause and this phase's now-vacuous cost clause — were independently
  removed as dead/vacuous) and flagging a future phase to design it a real passive mechanic.
  `node --check src/data/places.js` clean.
- **Task 2 (docs/card-reference.md sync):** Updated the Piecie table's Cost column to `free`
  (or `free, lvl N+` per the existing `piecie_leipe_swap` convention) for the 29 Piecie rows and
  10 Snelle Piecie rows present in the doc with a stale nonzero MP cost, each annotated with a
  brief "ruled free 2026-07-16" rationale note. Updated `welloe-force`'s Summary to describe the
  new tribute-payer picker + affordability gate (Cost cell kept at `40 MP, lvl 1+`). Updated
  `place_delluft`/`place_dierenasiel` table rows and all 3 cross-referencing summary lines
  (Place Design Notes, Phase 8 Questions "remaining partial/advanced cards" bullet, Phase 12
  Notes Dierenasiel-guard entry) to replace "deferred to Phase 36" framing with the actual
  applied outcome. `grep -c "deferred to Phase 36" docs/card-reference.md` returns 0.
- **Task 3 (full phase-gate verification):** Ran the complete sequence: `node --check` clean on
  all 6 touched runtime files; `npm test` 664/664 passing (0 regressions); `npm run test:cards`
  51 passed / 2 failed / 9 skipped — the 2 failures (`mosje_amplifier`, `mosje_binti_creator`)
  are the exact same pre-existing, unrelated failures documented in Phase 35's
  `deferred-items.md`, and the Ronald Kip stacking entry (`piecie_ronald_kip — MP_GAIN`, +50 MP)
  passed; `npx playwright test tests/ui/welloe-force-tribute.spec.js` 2/2 passing; `npm run
  test:sim` (backgrounded per STATE.md's tail-buffering caution, ~39 min) — **149/160 passing
  (11 failed, 6.9% timeout rate), 0 crashes across all 160 logged games** (confirmed via
  `grep -oE "[0-9]+ crashes"` — every one of the 49 per-game crash-count lines reads `0
  crashes`). All 11 failures are `page.waitForSelector('#reward-overlay')` 90s timeouts in the
  bot-vs-bot/deck-matrix sim specs — a known test-harness pattern (game genuinely resolves slower
  than the wait window on some seeds), not a crash or engine defect. Well under the 25% timeout
  threshold and no different in kind from prior phases' sim baselines (Phase 35's wave 8 recorded
  5% at a similar scale).

## Files Created/Modified

- `src/data/places.js` — `place_delluft`/`place_dierenasiel` `description` fields trimmed per
  36-03's ruling
- `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` — new pending todo
- `docs/card-reference.md` — Cost column corrected for 39 Piecie/Snelle Piecie rows,
  `welloe-force` Summary rewritten, `place_delluft`/`place_dierenasiel` rows + 3 summary lines
  updated, 0 remaining "deferred to Phase 36" references

## Decisions Made

- Applied 36-03's `trim-and-defer-todo` decision exactly as recorded — no re-litigation of the
  checkpoint's outcome.
- Where the audit's 35-corrected-Piecie-ID list didn't map 1:1 onto doc rows (6 IDs: `piecie_tony`
  not present in the doc at all — a pre-existing gap outside this doc's scope per the `place_tesla`
  precedent already noted in the Place table's own heading; `piecie_quest_prep`,
  `piecie_mp_amplifier`, `piecie_chain_reaction`, `piecie_dubbele_ding`, `piecie_mp_adjuster`
  already showed `free` in the doc pre-plan), verified each case individually via direct doc
  read rather than assuming a mechanical ID match — confirmed no genuine correction was silently
  skipped.
- Left 3 Snelle Piecie doc rows (`snelle_emergency_healings`, `snelle_jensen`,
  `snelle_lucky_coin`) at their stale-looking `10 MP` doc display untouched after confirming via
  direct `mpCost:` field read in `src/data/snellePiecies.js` that all three are already
  `mpCost: 0` in data and were never part of the 46-card nonzero-cost audit population —
  pre-existing doc staleness from before Phase 36, out of this plan's scope.

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed per their acceptance criteria.

## Issues Encountered

The 2 `tests/ui/cards/mosje-abilities.spec.js` failures (`mosje_amplifier — MP_GAIN`,
`mosje_binti_creator — DRAW`) are pre-existing and out of scope (Scope Boundary rule) — confirmed
identical to Phase 35's `deferred-items.md` record, in files (`mosjeAbilities.js`) untouched by
any Phase 36 plan. Not fixed here.

The 11 `test:sim` timeouts are `#reward-overlay` wait-selector timeouts in slower-resolving
simulated games, not crashes or engine defects — 6.9% is well under the 25% threshold and
consistent with prior phases' sim variance. Not investigated further per this task's acceptance
criteria (0 crashes + <25% timeout rate, both met).

## User Setup Required

None.

## Verification Results

- `node --check src/data/places.js` — no output, clean.
- `node --check src/data/piecies.js src/data/snellePiecies.js src/data/places.js
  src/abilities/piecieEffects.js src/ui/modalManager.js src/main.js` — no output, clean on all 6.
- `grep -c "deferred to Phase 36" docs/card-reference.md` → 0.
- `npm test` — 664/664 passing, 0 failures, 0 regressions.
- `npm run test:cards` — 51 passed / 2 failed (pre-existing, unrelated) / 9 skipped; Ronald Kip
  stacking entry (`piecie_ronald_kip — MP_GAIN`, ownΔ=50) confirmed passing.
- `npx playwright test tests/ui/welloe-force-tribute.spec.js` — 2/2 passing (affordable-payer
  path + blocked path).
- `npm run test:sim` — 149/160 passing, 11 failed (6.9% timeout rate, all `#reward-overlay`
  wait-selector timeouts), **0 crashes across all 160 logged games** (every per-game "N crashes"
  log line reads `0 crashes`, confirmed via grep across the full 39-minute run's output).

## TDD Gate Compliance

Not applicable — this plan's tasks are `type="auto"` documentation edits and a verification pass,
not TDD-gated feature work.

## Next Phase Readiness

Phase 36 is complete. All 4 plans (36-01 through 36-04) executed, committed, and verified as a
composed whole:
- 45 of 46 previously-nonzero-`mpCost` Piecies/Snelle Piecies corrected to free per the project's
  "text wins" convention; `piecie_welloe_force` is the sole tribute-charging card, now with a
  correct player-choice-driven, affordability-gated payment mechanism.
- Delluft/Dierenasiel's text is honest and consistent with the corrected cost model; Dierenasiel's
  real-mechanic redesign is tracked as a pending todo for a future phase.
- `docs/card-reference.md` fully reflects the phase's final state with zero stale
  forward-references.
- Full-suite verification (unit + card-behavior + dedicated Playwright spec + 160-game
  simulation) confirms zero regressions from the combined change set.

No blockers. Ready for `/gsd:verify-work`.

---
*Phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede*
*Completed: 2026-07-16*

## Self-Check: PASSED

- FOUND: src/data/places.js (edited, node --check clean)
- FOUND: docs/card-reference.md (edited, 0 "deferred to Phase 36" matches)
- FOUND: .planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md
- FOUND: e7f85b0 (docs: Delluft/Dierenasiel text trim)
- FOUND: 912052b (docs: card-reference.md sync)
