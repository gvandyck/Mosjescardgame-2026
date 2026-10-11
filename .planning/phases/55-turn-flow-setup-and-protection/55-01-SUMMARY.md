---
phase: 55
plan: 01
requirements-completed: []
key-files:
  created: [src/engine/setup/*.js, src/engine/turn/getNextPlayerId.js, tests/engine/setup-2-0.test.ts]
  modified: [src/engine/gameState.js, src/engine/turnManager.js, src/main.js]
---
# Phase 55 Plan 01: Setup Summary

2.0 setup: Example-Deck starting Mosje on the field (L1, fresh, one deck copy removed), 3-card hand, 2 Energy, `questStacks` (FIGHTING/DIGITAL/ARTISTIC, top face-up), opening d6 (ties reroll, `firstPlayerId` option overrides), R5 first-draw skip via one-shot `firstTurnDrawSkipPending`, round counter via `getNextPlayerId` (wraps at `firstPlayerId`).

## Decisions
- V4 decks without `startingMosje` keep the random-pick fallback.
- `main.js`: `firstPlayer` URL param only honoured with `testMode=true` (default player_1 there); opening rolls logged.
- RULE-05 not ticked (turn-loop half is 55-02).

## Deviations
None to the plan. Test changes: callers assuming player 1 starts now pass `{ firstPlayerId }` (first-turn-quest-lock, energy, mosje-slot-factory, offlineGame.smoke, general-quest-mosje-select); the "first config listed = first player" assertion became an explicit override because the die now decides. No assertion weakened. botDriver.test.ts did not use createInitialGameState (unchanged).
- V4 skip-branch advance uses getNextPlayerId too; `sharedGeneralQuestDeck` kept: KNOWN GAP (fix in Phase 56).

## Verification
`npm test` 104 files green; node --check clean.

## Self-Check: PASSED
