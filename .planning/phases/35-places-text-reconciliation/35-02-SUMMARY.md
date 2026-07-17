---
phase: 35-places-text-reconciliation
plan: 02
subsystem: engine
tags: [places, place-effects, mp, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-03/D-04) that this plan implements"
provides:
  - "Arcade applies +15 MP to EVERY Technical ★★+ Mosje on the questing player's field on quest success, not just the first active slot"
  - "De Box's MICHELLE/TUK bonus matches any Tuk-family Mosje id (mosje_tuk_healer, mosje_tuk_architect), not only mosje_michelle"
  - "De Box's 3 console.log lines corrected from the stale copy-pasted 'Toennoe' to 'De Box'"
  - "New regression tests (place-arcade.test.ts, place-de-box.test.ts) closing the Wave-0 test gap for both cards"
affects: [35-03, 35-04, 35-05, 35-06, 35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "loop-all-active-slots: same for (const mosje of player.activeSlots) { if (!mosje || mosje.isDefeated) continue; ... } pattern from 35-01, reused for effect_arcade"
    - "widened substring match: else if (id.includes('michelle') || id.includes('tuk')) reuses the existing michelleSlot local so the both-together +10 bonus branch needed no separate change"

key-files:
  created:
    - tests/engine/place-arcade.test.ts
    - tests/engine/place-de-box.test.ts
  modified:
    - src/abilities/placeEffects.js

key-decisions:
  - "De Box's widened condition folds Tuk-family matching into the existing michelleSlot branch rather than adding a third branch — the both-together +10 bonus (Gandoe + Michelle/Tuk) automatically extends to Tuk-family Mosjes with zero extra code"
  - "Only the 3 'Toennoe' log strings inside effect_de_box were touched — no places.js data change needed, since place_de_box.description already said 'MICHELLE/TUK Mosje +15 MP'"

requirements-completed: [PLACE-03, PLACE-04]

# Metrics
duration: unknown (session interrupted; resumed and verified in a follow-up session)
completed: 2026-07-15
---

# Phase 35 Plan 02: Arcade + De Box Slot-Loop & Substring-Match Fix Summary

**Arcade only ever bonused the first active Mosje slot instead of every qualifying Technical Mosje, and De Box's MICHELLE/TUK bonus text was a lie — the code only matched 'michelle', silently excluding both Tuk-family Mosjes; both are now fixed, plus De Box's 3 log lines no longer say the wrong card name ("Toennoe").**

## Accomplishments
- Fixed the first-slot-only bug in `effect_arcade`: rewritten from a `findIndex` single-slot lookup to `for (const mosje of player.activeSlots)`, so every Technical ★★+ Mosje on the field gets +15 MP on quest success (matches the 35-01 `effect_bank_chilling`/`effect_obby_1` pattern).
- Widened `effect_de_box`'s bonus condition from `id.includes('michelle')` to `id.includes('michelle') || id.includes('tuk')`, so `mosje_tuk_healer` and `mosje_tuk_architect` now correctly trigger the +15 MP branch (previously only `mosje_michelle` did, despite the card's own description already promising "MICHELLE/TUK Mosje +15 MP").
- Fixed all 3 copy-pasted `'[ABILITY] Toennoe: ...'` console.log strings inside `effect_de_box` to correctly say `'[ABILITY] De Box: ...'`.
- Added 2 new regression test files (6 tests total) proving both fixes and guarding against regression.

## Task Commits
1. **Task 1: Arcade — loop-all-active-slots bug**
   - RED: `44e6ecd` test(35-02): add failing dispatcher-level test for Arcade
   - GREEN: `5eaf43c` fix(35-02): Arcade — loop all active slots instead of first-slot-only
2. **Task 2: De Box — widen Tuk-family match + fix Toennoe log bug**
   - RED: `f03d45a` test(35-02): add failing dispatcher-level test for De Box
   - GREEN: `40c6f4e` fix(35-02): De Box — widen Tuk-family match + fix Toennoe log bug

## Files Created/Modified
- `src/abilities/placeEffects.js` — `effect_arcade` rewritten to loop every active slot; `effect_de_box`'s bonus branch condition widened to include `'tuk'`; all 3 `Toennoe` log strings corrected to `De Box`
- `tests/engine/place-arcade.test.ts` — 3 tests: both-slots-gain-+15-on-success, quest-failure-no-gain, technical<2-exclusion
- `tests/engine/place-de-box.test.ts` — 3 tests: lone Tuk-family Mosje gains +15, Gandoe+Tuk together get the +10 bonus each, log output no longer contains "Toennoe"
- `.planning/phases/35-places-text-reconciliation/deferred-items.md` — re-confirmed the same 2 pre-existing unrelated `test:cards` failures (see Deviations)

## Decisions Made
- De Box's Tuk-family widening reuses the existing `michelleSlot` local variable for the both-together bonus branch, rather than introducing a separate `tukSlot` — per the plan's explicit instruction, this required zero additional code for the +10 bonus to extend to Tuk-family Mosjes.
- No `places.js` data changes were needed for either card — Arcade's `trigger: "ON_QUEST"` was already correct, and De Box's description text already promised the Tuk-family bonus; only the effect functions' code was out of sync with the text.

## Deviations from Plan
None affecting the plan's scope — plan executed as written.

### Deferred (out of scope, not fixed)
**1. Pre-existing `npm run test:cards` failures (mosje_amplifier, mosje_binti_creator)**
- **Found during:** Task 1/2 verification (`npm run test:cards`)
- **Issue:** Same 2 failures documented in 35-01's deferred-items.md recur identically: `ability: mosje_amplifier — MP_GAIN` and `ability: mosje_binti_creator — DRAW`.
- **Why deferred:** Neither Mosje nor `mosjeAbilities.js` is touched by this plan's changes (`src/abilities/placeEffects.js` only). Confirmed unrelated per the 35-01 precedent.
- **Logged in:** `.planning/phases/35-places-text-reconciliation/deferred-items.md`

## Issues Encountered
This session was interrupted mid-wave (token exhaustion) after Tasks 1 and 2 completed in the worktree but before final verification and merge. Resumed in a follow-up session: re-ran the full verification sequence cold against the existing worktree commits (no code changes needed, work was already correct and complete) before writing this summary and merging.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check src/abilities/placeEffects.js` (+ core UI files) — clean, no output
- `npm test` (full suite) — 626/626 passing (0 regressions)
- `npm run test:cards` — Ronald Kip stacking entry passes; 51 passed / 9 skipped / 2 failed (same 2 pre-existing unrelated failures as 35-01, not introduced by this plan)
- `npm run test:sim` — 2/2 spec files passed, 0 crashes, well under the 25% timeout target

## TDD Gate Compliance
Both tasks followed the mandatory RED → GREEN sequence, confirmed in git log:
- Task 1: `test(35-02)` commit `44e6ecd` (RED) → `fix(35-02)` commit `5eaf43c` (GREEN)
- Task 2: `test(35-02)` commit `f03d45a` (RED) → `fix(35-02)` commit `40c6f4e` (GREEN)

## Next Phase Readiness
- PLACE-03 and PLACE-04 are fully reconciled (text matches engine behavior); ready for 35-03 (PLACE-06, PLACE-07 — Synergy Chamber MP-touching prep work / Delluft + Dierenasiel per current wave plan).
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
