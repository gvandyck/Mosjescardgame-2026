---
phase: "09"
plan: "09-01"
subsystem: "engine/abilities"
tags: [bug-fix, mp-floor, senor-west, loseMP, activation-guard]
dependency_graph:
  requires: []
  provides: [ability_martin_senor_west_calculated_guess_uses_loseMP, west_activation_guard]
  affects: [src/abilities/mosjeAbilities.js, src/main.js]
tech_stack:
  added: []
  patterns: [loseMP-routing, activation-guard]
key_files:
  created: []
  modified:
    - src/abilities/mosjeAbilities.js
    - src/main.js
    - tests/engine/west-calculated-guess.test.ts
decisions:
  - "Change const to let for state variable in west ability so loseMP return value can be assigned"
  - "Use 'ABILITY' source string for loseMP call to avoid triggering DRAIN-specific Place effects"
  - "Activation guard placed after deck-empty check and before showCardTypeSelect to fail fast without showing UI"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  files_changed: 3
---

# Phase 09 Plan 01: Senor West MP Floor Fix Summary

BUG-03 fixed: Senor West wrong-guess penalty now routes through `loseMP()` with floor clamp and level regression, and main.js blocks activation when Mosje is at Level 0 with 0 MP.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add loseMP import and fix wrong-guess penalty | 5321ddb | src/abilities/mosjeAbilities.js |
| 2 | Add BUG-03 MP floor test cases | 6f52374 | tests/engine/west-calculated-guess.test.ts |
| 3 | Add West activation guard in main.js | 3af0c0d | src/main.js |

## What Was Built

- `mosjeAbilities.js`: Imported `loseMP` from `../engine/mpManager.js`. Changed `const state` to `let state` in `ability_martin_senor_west_calculated_guess` so the return value of `loseMP` can be reassigned. Replaced `player.activeSlots[si].mp -= 10` with `state = loseMP(state, playerId, si, 10, 'ABILITY')`.
- `west-calculated-guess.test.ts`: Updated `makeState` to accept optional `level` param (defaults to 0). Added `describe("West — MP floor behavior (BUG-03)")` block with 3 new tests: floor clamp at mp=0+level=0, level regression at mp=0+level=1, partial drain clamp at mp=5+level=0.
- `main.js`: Added activation guard in `handleUseAbility` inside the West branch. Guard fires after the deck-empty check and before `modal.showCardTypeSelect`, blocking the ability with `showInfo` when `westSlot.level === 0 && westSlot.mp === 0`.

## Test Results

- Before fix: 6 West tests passing (buggy behavior — mp went to -10)
- After fix: 9 West tests passing (6 original + 3 new BUG-03 cases)
- Full suite: 591 tests passing, 0 failures, 0 regressions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `const` to `let` for state variable in west ability**
- **Found during:** Task 1 (GREEN phase — tests failed immediately after loseMP call was added)
- **Issue:** `const state = cloneState(gameState)` prevented reassignment of `state = loseMP(...)`. loseMP returns a new state object.
- **Fix:** Changed `const state` to `let state` in `ability_martin_senor_west_calculated_guess`
- **Files modified:** `src/abilities/mosjeAbilities.js`
- **Commit:** 5321ddb (included in Task 1 fix)

## Known Stubs

None — the fix is fully wired end-to-end.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The activation guard is a defensive UI check — it does not expand attack surface.

## Self-Check: PASSED

- src/abilities/mosjeAbilities.js: FOUND (loseMP import on line 6, usage on line 304)
- src/main.js: FOUND (activation guard on line ~879)
- tests/engine/west-calculated-guess.test.ts: FOUND (9 tests, all passing)
- Commit 5321ddb: FOUND
- Commit 6f52374: FOUND
- Commit 3af0c0d: FOUND
