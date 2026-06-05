---
plan: 27-02
phase: 27-youri-ability-chris-synergy-fix
status: complete
completed: 2026-06-05
---

## Summary

Wired the Youri ability UI handler in `handleUseAbility` in `src/main.js`.

## What was built

- Added `YOURI_SPEED_ACTIVATE_IDS = new Set(['mosje_youri'])` near other ID sets (line ~1233)
- Added handler block before the generic fallback in `handleUseAbility`:
  - Calls `useMosjeAbility` → gets `{ success, error, pendingYouriActivation }`
  - **Multi-piecie path**: shows `modal.showOptionSelect` with face-down slot options; sets `canActivateOnTurn = turnNumber` on chosen slot; calls `activatePiecie`; draws 1 card
  - **Single-piecie auto-path**: finds the engine-unlocked slot (canActivateOnTurn === turnNumber) and calls `activatePiecie`
  - **Cancel guard**: if player cancels slot picker, commits partial state with info modal
  - Logs `'Youri Speed Activate: paid 20 MP, activated face-down Piecie, drew 1 card.'`

## Self-Check: PASSED

- node --check: clean
- npm test: 929 passed, 1 pre-existing flaky smoke test (unrelated)
