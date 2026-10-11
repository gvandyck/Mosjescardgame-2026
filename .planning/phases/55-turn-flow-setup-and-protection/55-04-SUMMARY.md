---
phase: 55
plan: 04
requirements-completed: [RULE-08]
key-files:
  created: [src/engine/fresh/isFresh.js, src/engine/fresh/isOpponentSourced.js, tests/engine/fresh-protection.test.ts, tests/engine/fresh-ignores-places.test.ts]
  modified: [src/engine/mpManager.js, src/engine/mp/applyMpLossToSlot.js, src/engine/gameState.js, src/abilities/placeEffects.js, src/abilities/piecieEffects.js, src/abilities/mosjeAbilities.js, src/abilities/snelleEffects.js, src/rules/universal-rules.js, tests/engine/entry-protection.test.ts]
---
# Phase 55 Plan 04: Fresh 2.0 Summary

Fresh is now opponent-proof by source: `applyMpLossToSlot` and `loseMP` (new optional `byPlayerId`) fizzle when the slot is fresh and the loss is opponent-sourced (explicit byPlayerId, else inferred from the active player). The `COST` bypass is deleted. All Place effects skip fresh Mosjes (gain, loss, loops); Piecie/Mosje/Snelle `entryProtected === true` checks go through `isFresh`; hostile paths pass the source player; `getOpponentMosjes` uses `isFresh`. RULE-08 ticked (attack gates read these flags in Phase 56).

## Changed expectation
entry-protection.test.ts "cost payments never blocked" became "QUEST_COST label no longer bypasses fresh" (expects 50 MP, was 30): the bypass is removed per handoff 2a (MP is never a cost).

## Notes
fresh-ignores-places runs every `effect_*` export with generic args; effects that throw without extra context count as no-op (nothing applied). `npm test` 110 files / 1128 tests green; node --check clean. gsd-sdk not used; STATE/ROADMAP edited by hand.

## Self-Check: PASSED
