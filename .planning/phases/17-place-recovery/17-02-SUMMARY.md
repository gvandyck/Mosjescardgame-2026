---
phase: 17-place-recovery
plan: 02
status: COMPLETE
tests_added: 11
tests_total: 821
simulation: 0 crashes, 0 timeouts (100 games)
---

## What was done — Place recovery cards

- **Slecht Gezet** (effect_slecht_gezet): ownership-aware. If `activePlacePlayedBy === activePlayerId` → return the Place directly to your hand (no discard). Otherwise → destroy it (routes to owner's discard via Plan 01 engine). Description + tags updated (DESTROY, PLACE-RECOVERY).
- **Huisbaas** (effect_huisbaas): DEFERRED deck-search removed. Now finds the first PLACE-type entry in the player's own `discard` (findIndex, so it works even with piecie entries on top) and returns it to hand. Description + tags updated (PLACE-RECOVERY).
- **Chillingsvoorbij!** (NEW snelle): `snelle_chillingsvoorbij` in snellePiecies.js + `effect_snelle_chillingsvoorbij` in snelleEffects.js. Same recovery logic as Huisbaas, instant-speed. Resolves via `playSnellie`'s generic effectId dispatch — no main.js change needed (no pre-UI target pick).
- **Physical Force deck**: `snelle_lucky_coin` → `snelle_chillingsvoorbij`.
- **deck-balance.test.ts**: 11 new tests (4 slecht_gezet, 3 huisbaas, 4 chillingsvoorbij).

## Verification

- npm test: 821 passing, 0 failures
- Simulation: 100 games, 0 crashes, 0 timeouts
- `grep PLACE-RECOVERY src/data/piecies.js` → 2 (slecht_gezet + huisbaas)
- `grep snelle_chillingsvoorbij src/data/snellePiecies.js` → 2
