---
phase: 22-call-of-the-welloes
plan: "04"
subsystem: engine
tags: [tdd, engine, welloe, gap-closure, mechanic-revision]
dependency_graph:
  requires: [22-01, 22-02, 22-03]
  provides: [confirmCallOfWelloes-corrected, endTurn-defeat-on-sweep, piecie-persistence-guard, markMosjeDefeated-clears-link]
  affects: [src/engine/turnManager.js, src/engine/victoryChecker.js, src/data/piecies.js]
tech_stack:
  added: []
  patterns: [defeat-on-sweep, piecie-persistence-guard, link-clearing-on-defeat]
key_files:
  created: []
  modified:
    - tests/abilities/call-of-welloes.test.ts
    - src/engine/turnManager.js
    - src/engine/victoryChecker.js
    - src/data/piecies.js
decisions:
  - "returnMosjeToWelloe removed entirely — replaced by markMosjeDefeated call in endTurn sweep"
  - "confirmCallOfWelloes: slot.mp = 50; slot.level = 1 — unconditional fresh summon (D-05/D-06)"
  - "Piecie persistence guard uses continue in the sweep loop — clean, minimal change"
  - "markMosjeDefeated clears linkedMosjeCardId inline after activeSlots[slotIndex] = null"
  - "Test count net -1 (removed 5 old returnMosjeToWelloe tests, added 4 new mechanic tests: A/B/C/K)"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-03"
  tasks_completed: 2
  tasks_total: 2
  tests_before: 896
  tests_after: 895
---

# Phase 22 Plan 04: Call of the Welloes — Mechanic Revision (Gap Closure) Summary

**One-liner:** Replaced wrong Wave 1+2 mechanic (stat-restore + silent return) with correct mechanic: fresh Level 1/50 MP summon, Piecie persistence guard, and defeat-on-sweep via markMosjeDefeated with link clearing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — update tests to correct mechanic | f091ee6 | tests/abilities/call-of-welloes.test.ts |
| 2 | GREEN — implement correct mechanic | b872ce1 | src/engine/turnManager.js, src/engine/victoryChecker.js, src/data/piecies.js |

## What Was Fixed

### confirmCallOfWelloes (`src/engine/turnManager.js`)
Changed from restoring welloe-record stats to always setting `slot.mp = 50; slot.level = 1`. The summoned Mosje is now always fresh — balanced around the risk that the Piecie can be destroyed (which now triggers a real defeat).

### returnMosjeToWelloe — deleted
The function created in Wave 1 is gone. It was wrong: it silently returned the Mosje without defeat flags, discard entries, or victory check. All callers replaced by `markMosjeDefeated`.

### endTurn Piecie persistence guard (`src/engine/turnManager.js`)
Added a `continue` guard at the top of the piecieSlots sweep loop: if `slot.cardId === 'piecie_call_of_welloes'` and `slot.linkedMosjeCardId` refers to a live Mosje in `activeSlots`, skip sweeping. This keeps the Piecie on field while the summoned Mosje is alive.

### endTurn defeat-on-sweep (`src/engine/turnManager.js`)
Replaced `returnMosjeToWelloe` call with `markMosjeDefeated`. When the anchor Piecie is absent at end of turn, the summoned Mosje is truly defeated: `isDefeated=true`, discard entry added, victory check triggered.

### markMosjeDefeated link clearing (`src/engine/victoryChecker.js`)
After nulling `activeSlots[slotIndex]`, checks if the defeated Mosje had `summonedByPiecie === 'piecie_call_of_welloes'`. If so, finds the Piecie slot and sets `linkedMosjeCardId = null`. This allows the Piecie to be swept normally on the following turn.

### piecies.js description (`src/data/piecies.js`)
Corrected from "restoring its MP and Level from when it was last defeated" to: "Choose a Mosje in your Welloe pile and summon it to the field at Level 1, 50 MP. This Piecie stays on the field as long as that Mosje is active. If this Piecie is destroyed, the summoned Mosje is also defeated."

## TDD Gate Compliance

- RED commit: `f091ee6` — 4 tests failing (A: isDefeated, C: persistence guard, I: mp/level, J: description, K: linkedMosjeCardId)
- GREEN commit: `b872ce1` — all 9 tests passing

## Verification

- `npx vitest run tests/abilities/call-of-welloes.test.ts`: 9/9 passed
- `npm test`: 895 tests passing (0 failures, no regressions)
- `grep returnMosjeToWelloe src/engine/turnManager.js`: 0 matches (function deleted)
- `grep "slot.mp = 50" src/engine/turnManager.js`: matches in confirmCallOfWelloes
- `grep "linkedMosjeCardId = null" src/engine/victoryChecker.js`: matches in markMosjeDefeated
- `grep "Level 1, 50 MP" src/data/piecies.js`: matches piecie_call_of_welloes description

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The mechanic is fully correct. Wave 3 (22-03) UI wiring remains valid — `confirmCallOfWelloes` signature unchanged, only the stat values differ.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- `tests/abilities/call-of-welloes.test.ts`: EXISTS, 9 tests, all passing
- `src/engine/turnManager.js`: returnMosjeToWelloe absent, slot.mp = 50 present
- `src/engine/victoryChecker.js`: linkedMosjeCardId = null present
- `src/data/piecies.js`: "Level 1, 50 MP" in description
- Commits f091ee6 (RED) and b872ce1 (GREEN): confirmed in git log
