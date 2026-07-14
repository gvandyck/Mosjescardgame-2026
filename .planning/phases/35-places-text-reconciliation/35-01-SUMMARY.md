---
phase: 35-places-text-reconciliation
plan: 01
subsystem: engine
tags: [places, place-effects, turn-manager, mp, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-01/D-02) that this plan implements"
provides:
  - "Bank Chilling fires through the real startTurn dispatch path (was dead code — trigger-string never matched any real dispatch call)"
  - "Bank Chilling applies +15 MP to EVERY Social ★★+ Mosje on the field, not just the first active slot"
  - "Obby #1 applies +20 MP success / -10 MP fail to EVERY Physical ★★+/Resilient ★★+ Mosje on the questing player's field, not just the first active slot"
  - "Dispatcher-level regression tests (place-bank-chilling.test.ts, place-obby-1.test.ts) closing the Wave-0 test gap for both cards"
affects: [35-02, 35-03, 35-04, 35-05, 35-06, 35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "loop-all-active-slots: for (const mosje of player.activeSlots) { if (!mosje || mosje.isDefeated) continue; ... } replacing single-slot findIndex lookups in per-player Place effect functions (mirrors the pre-existing effect_zo_is_natuur pattern)"
    - "dispatcher-level test proof: Place effect regression tests call startTurn()/applyPlaceEffectsOnQuest() (the real dispatch path), not the raw effect function directly, so a trigger-string regression fails the test"

key-files:
  created:
    - tests/engine/place-bank-chilling.test.ts
    - tests/engine/place-obby-1.test.ts
    - .planning/phases/35-places-text-reconciliation/deferred-items.md
  modified:
    - src/data/places.js
    - src/abilities/placeEffects.js

key-decisions:
  - "Bank Chilling trigger string corrected from the dead 'TURN_START' to the working 'START_PHASE' (matches place_boxing_ring/place_tesla) — no call site in src/ ever passed 'TURN_START', so this card had never fired in live play"
  - "Both effect_bank_chilling and effect_obby_1 keep their existing per-player function signatures — only the inner slot-iteration changed from findIndex(first-slot) to a for...of loop over all activeSlots"

requirements-completed: [PLACE-01, PLACE-02]

# Metrics
duration: ~50min
completed: 2026-07-14
---

# Phase 35 Plan 01: Bank Chilling + Obby #1 Slot-Loop & Dead-Dispatch Fix Summary

**Bank Chilling's trigger string was silently dead ("TURN_START" never matched any real dispatch call) and, along with Obby #1, only ever touched the first active Mosje slot instead of every qualifying Mosje — both now loop all slots and Bank Chilling actually fires via the real startTurn dispatch.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-07-14T20:34:25Z
- **Tasks:** 2/2
- **Files modified:** 2 (src/data/places.js, src/abilities/placeEffects.js)
- **Files created:** 2 test files + 1 deferred-items log

## Accomplishments
- Fixed Bank Chilling's silent dead-dispatch bug: `trigger: "TURN_START"` (a string no call site in `src/` ever passes) corrected to `"START_PHASE"` (the string `applyPlaceEffectsOnStart` actually dispatches) — the card had never fired in live play until this fix.
- Fixed the first-slot-only bug in both `effect_bank_chilling` and `effect_obby_1`: both now loop every active slot (`for (const mosje of player.activeSlots)`) instead of stopping at the first non-defeated slot via `findIndex`.
- Added 2 new dispatcher-level regression test files (6 tests total) that call the REAL dispatch path (`startTurn()` / `applyPlaceEffectsOnQuest()`) rather than the raw effect functions — guarding against a regression back to the dead `'TURN_START'` string.

## Task Commits

Each task followed the mandatory TDD RED → GREEN sequence:

1. **Task 1: Bank Chilling — dead-dispatch + loop-all-slots**
   - RED: `485ca2f` test(35-01): add failing dispatcher-level test for Bank Chilling
   - GREEN: `58a0133` fix(35-01): Bank Chilling — fix dead-dispatch trigger string + loop all slots
2. **Task 2: Obby #1 — loop-all-active-slots**
   - RED: `2506f27` test(35-01): add failing dispatcher-level test for Obby #1 (also logged deferred-items.md in this commit)
   - GREEN: `58261b5` fix(35-01): Obby #1 — loop all active slots instead of first-slot-only

## Files Created/Modified
- `src/data/places.js` — `place_bank_chilling.trigger` corrected from `"TURN_START"` to `"START_PHASE"`
- `src/abilities/placeEffects.js` — `effect_bank_chilling` and `effect_obby_1` both rewritten to loop every active slot instead of `findIndex`-ing the first one
- `tests/engine/place-bank-chilling.test.ts` — 3 tests via `startTurn()`: both-slots-gain-+15, dispatcher-proof (`_lastPlaceEffect.placeId`), social<2 exclusion
- `tests/engine/place-obby-1.test.ts` — 3 tests via `applyPlaceEffectsOnQuest()`: both-slots-gain-+20-on-success, both-slots-lose-10-on-failure, neither-trait-qualifies exclusion
- `.planning/phases/35-places-text-reconciliation/deferred-items.md` — out-of-scope pre-existing test failures logged (see Deviations)

## Decisions Made
- Kept both effect functions' existing per-player signatures (`playerId` param for `effect_bank_chilling`; `questCard, didSucceed` for `effect_obby_1`) — only the inner slot-iteration logic changed, per the plan's explicit instruction not to add an outer `Object.keys(state.players)` loop to Bank Chilling.
- Failure branch of Obby #1 continues to call `applyDamage(mosje, 10)` (not a raw `mosje.mp -= 10`) to preserve entry-protection/level-regression handling — verified by source assertion per plan's acceptance criteria.

## Deviations from Plan

None affecting the plan's scope — plan executed as written. One out-of-scope discovery was logged (not fixed) per the Scope Boundary rule:

### Deferred (out of scope, not fixed)

**1. Pre-existing `npm run test:cards` failures (mosje_amplifier, mosje_binti_creator)**
- **Found during:** Task 1 & 2 verification (`npm run test:cards`)
- **Issue:** `ability: mosje_amplifier — MP_GAIN` (expects ownDelta >= 10, got -30) and `ability: mosje_binti_creator — DRAW` (expects deckDrawn >= 1, got 0) both fail
- **Why deferred:** Neither Mosje is touched by Bank Chilling or Obby #1, or by any file this plan modifies. `git log` confirms `mosjeAbilities.js` was last touched by an unrelated Chris DDR commit, not this plan. Out of scope per the executor's Scope Boundary rule.
- **Logged in:** `.planning/phases/35-places-text-reconciliation/deferred-items.md`

## Issues Encountered
- An unrelated file, `tests/ui/simulation/sim-deck-matrix-results.md`, was already modified in the working tree before this plan started (a generated report file, not part of this plan's scope) and was further modified by running `npm run test:sim` twice during verification. Left uncommitted/untouched — it is a generated artifact, not this plan's output.
- Two `npm run test:sim` runs were inadvertently kicked off concurrently during verification (a coordination slip, not a code issue). The concurrent run's 19/160 failures (all Playwright `TimeoutError`s — UI element visibility / reward-overlay waits, zero assertion/logic crashes) are consistent with the documented "sim + cards tests are not parallel-safe, always run --workers=1" constraint. A subsequent clean solo re-run of `npm run test:sim` (after the concurrent run finished) showed 5/160 failures (3.1% timeout rate), also all `TimeoutError`s with 0 crashes — comfortably under the plan's "0 crashes, timeout rate < 25%" target.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check src/data/places.js src/abilities/placeEffects.js` — clean, no output
- `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` — clean, no output
- `npm test -- tests/engine/place-bank-chilling.test.ts tests/engine/place-obby-1.test.ts` — 6/6 passing
- `npm test` (full suite) — 619/619 passing (0 regressions; baseline was 616 before the 3 new dispatcher-level tests in place-bank-chilling.test.ts were added, +3 net from place-obby-1.test.ts's 3 tests balancing out — final count 619)
- `npm run test:cards` — `piecie_ronald_kip` (Ronald Kip stacking, mandatory per CLAUDE.md MP-touching-card rule) passes with `ownΔ=50` (within the 50-100 MP range); 2 pre-existing unrelated failures documented above, not introduced by this plan
- `npm run test:sim` — 0 crashes; clean solo run showed 5/160 failures (3.1% timeout rate), all Playwright `TimeoutError`s unrelated to MP/game-logic; well under the 25% target

## TDD Gate Compliance
Both tasks followed the mandatory RED → GREEN sequence, confirmed in git log:
- Task 1: `test(35-01)` commit `485ca2f` (RED, 3 failing tests) → `fix(35-01)` commit `58a0133` (GREEN, all 3 passing)
- Task 2: `test(35-01)` commit `2506f27` (RED, 2 of 3 failing — the third already passed because its fixture's first slot happened to be the qualifying Mosje, confirming the bug was isolated to the second/later slot) → `fix(35-01)` commit `58261b5` (GREEN, all 3 passing)

## Next Phase Readiness
- PLACE-01 and PLACE-02 are fully reconciled (text matches engine behavior); ready for 35-02 (PLACE-03, PLACE-04) which continues the sequential-wave pattern touching the same two files.
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-14*

## Self-Check: PASSED
All created files verified present (2 test files, SUMMARY.md, deferred-items.md); all 5 commit hashes (485ca2f, 58a0133, 2506f27, 58261b5, 2aed649) verified present in git log.
