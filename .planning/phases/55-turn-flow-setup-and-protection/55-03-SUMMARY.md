---
phase: 55
plan: 03
requirements-completed: [RULE-07, TABLE-01]
key-files:
  created: [src/engine/turn/isCooldownBlocked.js, tests/engine/cooldown-turn.test.ts, tests/engine/summon-cost.test.ts]
  modified: [src/engine/turnManager.js, src/bot/botDriver.js, src/main.js]
---
# Phase 55 Plan 03: Cooldown turn and summon cost Summary

Deck-out now sets `cooldownTurn` (discard reshuffled, Welloe pile untouched, +1 Energy kept); the V4 `skipNextTurn` skip is gone. `isCooldownBlocked` gates all nine action entry points in the engine; `endTurn` clears the flag. `playMosje` requires own turn, pays Mosje `cost` in Energy (hand restored on failure) and always arrives fresh. Bot summons the cheapest affordable Mosje and on a cooldown turn only places Piecies. UI notice text updated.

## Changed expectations (not weakened)
- deck-out.test.ts / deckout-event-marker.test.ts / offlineGame.smoke: "skips turn" assertions became cooldown assertions (flag set, turn not skipped, endTurn clears, chained both-players case alternates normally).
- energy, hold-level-3-win, sideways, botDriver, entry-protection tests: `skipNextTurn` setups swapped to `cooldownTurn` with the same intent.
- mosje-slot-factory playMosje test: gives the player 6 Energy (summon now costs Energy).

## Deviations
None. `tests/ui/deckout-hang-repro.spec.js` still mentions skipNextTurn (rewritten in 55-07 per plan).

## Verification
`npm test` 108 files / 1101 tests green; node --check clean on all touched files.

## Self-Check: PASSED
