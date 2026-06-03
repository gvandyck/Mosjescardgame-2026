---
phase: 22-call-of-the-welloes
plan: "05"
subsystem: engine
tags: [tdd, gap-closure, bidirectional-destroy, call-of-welloes, piecie]
dependency_graph:
  requires: [22-04]
  provides: [COTW-BIDIR]
  affects: [src/engine/victoryChecker.js, tests/abilities/call-of-welloes.test.ts]
tech_stack:
  added: []
  patterns: [TDD RED/GREEN, bidirectional-destroy, immediate-discard]
key_files:
  modified:
    - src/engine/victoryChecker.js
    - tests/abilities/call-of-welloes.test.ts
decisions:
  - "Tightened findIndex to match both cardId AND linkedMosjeCardId — prevents accidental discard of unlinked Piecie"
  - "Slot is nulled entirely rather than clearing linkedMosjeCardId — cleaner state, no lingering ghost entries"
  - "Test K updated to accept null slot as satisfying D-17 (slot gone = link cleared)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-03"
  tasks: 2
  files: 2
---

# Phase 22 Plan 05: Bidirectional Destroy (Gap Closure) Summary

**One-liner:** Bidirectional destroy implemented — when a summoned Mosje dies, its anchor `piecie_call_of_welloes` is immediately pushed to `player.discard` and nulled from `piecieSlots` in the same `markMosjeDefeated` call.

## What Was Built

Closed the gap in the Call of the Welloes mechanic where the anchor Piecie lingered on the field after its linked Mosje was defeated. The Piecie was only having its `linkedMosjeCardId` cleared (D-17), deferring its removal to the next end-of-turn sweep.

**The fix (victoryChecker.js):** The existing D-17 block was replaced with a fully bidirectional destroy block:
- `findIndex` condition tightened to `cardId === 'piecie_call_of_welloes' && linkedMosjeCardId === mosje.cardId`
- On match: `discard.push(slot.cardId)` + `piecieSlots[pIdx] = null` in one synchronous operation
- No deferred sweep needed for the bidirectional case

## TDD Gate Compliance

- RED commit `eced576`: test L added and confirmed failing (piecieStillOnField true)
- GREEN commit `33bf6eb`: implementation + test K update — all 10 call-of-welloes tests pass, 896 total

## Deviations from Plan

**1. [Rule 1 - Bug] Test K needed assertion update as anticipated by plan**
- **Found during:** Task 2 (GREEN)
- **Issue:** Test K checked `expect(pSlot).toBeDefined()` — after nulling the slot, `pSlot` is `undefined`
- **Fix:** Updated assertion to `expect(pSlot == null || pSlot.linkedMosjeCardId == null).toBe(true)` as specified in the plan's implementation notes
- **Files modified:** `tests/abilities/call-of-welloes.test.ts`
- **Commit:** `33bf6eb`

## Verification

- `npm test`: 896 passing, 0 failing
- Test L present and green
- Test K updated and green
- `linkedMosjeCardId = null` assignment removed from victoryChecker.js (slot is nulled entirely)

## Known Stubs

None.

## Threat Flags

None. Change is entirely within engine-internal deep-cloned state (JSON.parse/stringify boundary at top of markMosjeDefeated).

## Self-Check: PASSED

- `src/engine/victoryChecker.js` — exists, contains `discard.push(pSlots[pIdx].cardId)` and `piecieSlots[pIdx] = null`
- `tests/abilities/call-of-welloes.test.ts` — exists, contains test L
- Commits `eced576` (RED) and `33bf6eb` (GREEN) present in git log
