---
phase: 57
plan: 04
requirements-completed: []
key-files:
  created: [tests/engine/place-play.test.ts]
  modified: [src/engine/turnManager.js, src/engine/gameState.js, src/abilities/placeEffects.js, src/bot/botDriver.js, src/main.js, src/ui/boardRenderer.js]
---
# Phase 57 Plan 04: Places from hand Summary

playPlace now plays from hand on the owner's own turn: refuses on cooldown, off-turn, hand lock, while any Place is in play, or without Energy; pays cost, sets activePlace (owner = player), runs PASSIVE effects at once, uses no slot. activatePlace, face-down Place slots, the Place Activate button and `activePlaceCanActivateOnTurn` are gone (engine, bot, UI); both names are banned in v4-leftovers-removed. TABLE-05 is NOT ticked here (57-06, after U7). `npm test` 125 files / 1187 passed.

## Test changes
- energy-charging: three Place cases moved from activatePlace/face-down to playPlace (Energy paid on play; refusal keeps card in hand).
- cooldown-turn: dropped the activatePlace row (function removed; playPlace row still asserts the cooldown error).
- unified-graveyard: removed the dead `activePlaceCanActivateOnTurn` field; setActivePlace replace path kept as defensive and still tested.
- botDriver: face-down-Place test replaced by "becomes activePlace, no slot" and "no second Place while one is in play".

## Notes
- E24 uses Drain Zone/Momentum Stabilizer; "fresh ignores Place" stays covered by fresh-ignores-places.test.ts, not re-asserted.
- Hand play-button disabling for a blocked Place was not added: the engine refuses and main.js shows the modal. Left for 57-06 (U7).
- Bot-vs-bot not run separately; botDriver tests pass.
