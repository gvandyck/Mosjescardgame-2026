---
phase: 35-places-text-reconciliation
plan: 03
subsystem: engine
tags: [places, place-effects, mp-manager, turn-manager, dead-code, docs, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-06/D-07) that this plan implements"
provides:
  - "Dierenasiel's dead +25% PET-protection clause and its typo'd setter/reader ('dienasielActive' vs 'dierenasielActive') fully removed from all 3 files (placeEffects.js, mpManager.js, turnManager.js)"
  - "Dierenasiel's description no longer promises a non-functional bonus"
  - "Delluft's draw-1 behavior has dispatcher-level regression test coverage for the first time (was a Wave-0 test gap)"
  - "docs/card-reference.md rows for both cards correctly point their remaining cost-0 MP clause to Phase 36"
affects: [35-04, 35-05, 35-06, 35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dead-code removal via full-chain grep: confirmed zero remaining references (setter + all readers) before considering a dead-flag removal complete, not just the primary consumer"

key-files:
  created:
    - tests/engine/place-dierenasiel.test.ts
    - tests/engine/place-delluft.test.ts
  modified:
    - src/data/places.js
    - src/abilities/placeEffects.js
    - src/engine/mpManager.js
    - src/engine/turnManager.js
    - docs/card-reference.md
    - tests/engine/stub-engine-wiring.test.ts

key-decisions:
  - "Dropped the +25% clause entirely rather than just fixing the typo (per the locked CONTEXT.md ruling) — effect_dierenasiel is now an intentional no-op PASSIVE-trigger body until Phase 36 implements the real cost-0 mechanism"
  - "Removed the now-obsolete 'Test 17' artifact check in stub-engine-wiring.test.ts (asserted the literal string 'dierenasielWaiver' existed in turnManager.js) since that string was the exact dead code this plan deletes — a necessary, expected consequence of Task 1, not an unplanned regression"
  - "Delluft required zero code changes — its draw-1 effect already matched its text; only a missing regression test was added"

requirements-completed: [PLACE-06, PLACE-07]

# Metrics
duration: ~40min
completed: 2026-07-15
---

# Phase 35 Plan 03: Dierenasiel Dead-Code Removal + Delluft Regression Test Summary

**Dierenasiel's +25% PET-protection clause was permanently dead code (a setter/reader spelling typo that never matched) — dropped entirely per the locked ruling, along with its 3-file trail of dead reads; Delluft's already-correct draw-1 behavior gets its first regression test.**

## Accomplishments
- Removed `effect_dierenasiel`'s `state.dienasielActive = true` setter (the typo that made the clause permanently unreachable).
- Deleted the dead `if (state.dierenasielActive) { lossAmount *= 0.75; ... }` block from `mpManager.js`'s `loseMP`.
- Deleted the dead `dierenasielWaiver` const + its `if` block + 2 stale STUB-09 doc-comment lines from `turnManager.js`'s `useMosjeAbility`.
- Updated `place_dierenasiel.description` to drop the "PET protection bonuses +25%" sentence, keeping only the still-Phase-36-deferred "All PET Piecies cost 0 MP" clause.
- Added `tests/engine/place-dierenasiel.test.ts` (3 tests) proving the dead code is fully gone, not just newly-unreachable.
- Added `tests/engine/place-delluft.test.ts` (1 test) proving Delluft's draw-1 fires through the real `applyPlaceEffectsOnEnd` dispatch path — first-ever coverage for this card.
- Updated both cards' `docs/card-reference.md` rows to point their remaining unimplemented cost-0 MP clause at Phase 36.

## Task Commits
Both tasks were implemented directly on `card/full-game-text-audit` (no worktree isolation used for this wave), following the TDD RED → GREEN sequence within the session.

## Files Created/Modified
- `src/data/places.js` — `place_dierenasiel.description` shortened to drop the dead clause
- `src/abilities/placeEffects.js` — `effect_dierenasiel` setter line removed
- `src/engine/mpManager.js` — dead `dierenasielActive` branch removed from `loseMP`
- `src/engine/turnManager.js` — dead `dierenasielWaiver` const/branch + 2 stale doc-comment lines removed from `useMosjeAbility`
- `docs/card-reference.md` — `place_delluft` and `place_dierenasiel` rows updated with Phase 36 deferral notes
- `tests/engine/place-dierenasiel.test.ts` — new: setter removal, full-loss-amount-under-loseMP, description no longer contains "25%"/"protection bonuses"
- `tests/engine/place-delluft.test.ts` — new: dispatcher-level draw-1 regression test
- `tests/engine/stub-engine-wiring.test.ts` — removed the now-obsolete "Test 17" artifact check that asserted the literal (now-deleted) string `dierenasielWaiver` existed in `turnManager.js`

## Decisions Made
- Per the locked CONTEXT.md ruling, dropped the clause entirely (not a typo-only fix that would have made a previously-inert 25%-reduction suddenly active) — a typo-only fix would have been a silent balance change, not a text/code reconciliation.
- `grep -rn "dienasielActive\|dierenasielActive" src/` used as the acceptance gate — confirms both the setter and every reader are gone, not just the primary consumer.

## Deviations from Plan
None affecting scope. One necessary follow-on fix: `tests/engine/stub-engine-wiring.test.ts`'s "Test 17" was a source-content artifact check for the exact string this plan's Task 1 deletes (`dierenasielWaiver`) — removed as a direct, expected consequence of Task 1, not a new bug.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check src/data/places.js src/abilities/placeEffects.js src/engine/mpManager.js src/engine/turnManager.js` (+ core UI files) — clean, no output
- `grep -rn "dienasielActive\|dierenasielActive" src/` — zero matches
- `npm test -- tests/engine/place-dierenasiel.test.ts tests/engine/place-delluft.test.ts` — 4/4 passing
- `npm test` (full suite) — 629/629 passing (0 regressions after the expected stub-engine-wiring.test.ts update)
- `npm run test:cards` / `npm run test:sim` — not required by this plan's verify block (no MP-touching-card amount changes; this plan removes a dead branch and adds a doc-only regression test)

## TDD Gate Compliance
Both tasks followed RED → GREEN: `place-dierenasiel.test.ts` and `place-delluft.test.ts` were written first and confirmed failing against pre-fix code (3 assertion failures matching the exact bugs being fixed), then the source changes made them pass.

## Next Phase Readiness
- PLACE-06 and PLACE-07 are fully reconciled; ready for 35-04 (PLACE-08, PLACE-09 — Coert's Caravan + Digital Gaming Stop).
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
