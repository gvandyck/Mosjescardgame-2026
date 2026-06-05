---
plan: 27-03
phase: 27-youri-ability-chris-synergy-fix
status: complete
completed: 2026-06-05
---

## Summary

Implemented the Chris+Youri passive synergy in `playPiecie` and wrote 10 tests covering all ability and synergy cases.

## What was built

- **`hasBothChrisAndYouri(player)` helper** added to `turnManager.js` (module-level): checks `player.activeSlots` for live (non-defeated) Chris variant (`mosje_chris` or `mosje_chris_ddr`) AND `mosje_youri`
- **`playPiecie` synergy check**: before creating `newSlot`, calls `hasBothChrisAndYouri(player)` and sets `canActivateOnTurn: chrisYouriSynergy ? state.turnNumber : state.turnNumber + 1`
- `playPersonalQuest` canActivateOnTurn left unchanged (Quest cards only)
- **`tests/abilities/youri-chris-synergy.test.ts`**: 10 tests across 2 describe blocks:
  - `ability_youri_speed_activate`: use-cap, MP check, no-piecie check, single-piecie auto-path, multi-piecie pending path
  - `Chris+Youri passive synergy`: mosje_chris, mosje_chris_ddr, Chris-only, Youri-only, defeated-Chris cases

## Self-Check: PASSED

- node --check: clean
- npm test: 929 passed, 1 pre-existing flaky smoke test (confirmed failing before this branch)
- All 10 new tests pass
