---
plan: 27-01
phase: 27-youri-ability-chris-synergy-fix
status: complete
completed: 2026-06-05
---

## Summary

Fixed `ability_youri_speed_activate` engine function and added `youriAbilityUses` counter to player state.

## What was built

- **Task 1 (gameState.js)**: Added `youriAbilityUses: 0` to `createPlayerState` return object, after `questsAttemptedThisTurn`. Counter persists for the full game (not reset in startTurn).

- **Task 2 (mosjeAbilities.js)**: Replaced the wrong Youri ability with correct logic:
  - 3-use cap check → `{ success: false }` with error string
  - Youri must be on field (not defeated)
  - 20 MP check on Youri's slot → `{ success: false }` with error string
  - No face-down piecies → `{ success: false }` with error string
  - Deducts 20 MP from Youri's slot, increments `youriAbilityUses`
  - Single face-down piecie: sets `canActivateOnTurn = state.turnNumber`, draws 1 card, returns `{ success: true }`
  - Multiple face-down piecies: sets `state._pendingYouriActivation`, returns `{ success: true, pendingYouriActivation: true }`
  - Removed `instantPiecieThisTurn` flag entirely

## Self-Check: PASSED

- node --check: clean
- npm test: 920 passed, 0 failures
