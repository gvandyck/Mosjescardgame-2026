---
phase: 17-place-recovery
plan: 01
status: COMPLETE
tests_added: 7
tests_total: 810
---

## What was done — Unified graveyard engine

- **gameState.js**: Removed `sharedPlaceDiscard` from `createInitialGameState`. `setActivePlace` and `destroyActivePlace` now route the displaced/destroyed Place to the owner's personal `player.discard` as `{ cardId, type: 'PLACE' }`, falling back to `state.activePlayerId` when `activePlacePlayedBy` is null.
- **victoryChecker.js**: `markMosjeDefeated` now dual-writes — full slot object to `player.welloe` (unchanged, for Mosje Reborn revival) PLUS a lightweight `{ cardId, type: 'MOSJE', level, mp }` ref to `player.discard` for the unified graveyard.
- **tests/engine/unified-graveyard.test.ts**: 7 new tests (5 Place routing, 2 Mosje dual-write).

## Cleanups (dead/stale references)

- `turnManager.js:984` comment updated (sharedPlaceDiscard → owner discard).
- `tests/cards/test-placeEffects.js` (legacy, not run by vitest — `.js`, no caller): 3 stale assertions updated to check `players.player_1.discard` instead of `sharedPlaceDiscard`.

## Verification

- `grep sharedPlaceDiscard src/engine/gameState.js` → 0 hits
- Full suite: 810 passing, 0 failures
- `player.welloe` still receives full slot object — Mosje Reborn unaffected (also simplified separately to startMP+40)
