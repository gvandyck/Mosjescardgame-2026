---
phase: 56-attacking-and-quests
plan: 01
requirements-completed: [PLAY-02]
---
# Phase 56 Plan 01: Attack action and trigger registry Summary

`attackMosje` (taksen by Power through `loseMP` 'ATTACK'), the shared `canMosjeTakeAction` one-action gate (uses `canMosjeAct`, closes 54-11 gap), `isValidAttackTarget`, and an `ATTACK_TRIGGERS` registry (Flow, Unstoppable, Welloe Force thorns, Momentum Diefje, MP Hemorrhage mark).

- Commits: task 1 `feat(56-01): action gate...`, task 2 `feat(56-01): attack trigger registry...`
- Tests: `tests/engine/attack.test.ts` (11), `tests/engine/attack-triggers.test.ts` (7); `npm test` 1162 green.
- PLAY-02 ticked. PLAY-01 not ticked (Quest side is 56-03).

## Changed expectations / deviations
- Zo is Natuur loss step rewritten from V4 "cap 25" to 2.0 "-10 on ATTACK for Resilient 2+"; no existing test asserted the V4 cap.
- `src/data/mosjes.js` Alyssa ability text updated to "until the end of your next turn" to match the Card List ruling (card-list-2-0-mosjes test).
- `getPower` now adds `powerBoostUntilOwnerTurnEnd`; `expireThisTurnEffects` clears it only when the owner's turn ends.

## KNOWN GAP (fix in Phase 59)
Piecie effects that set `momentumDiefjeThisTurn` / `mpHemorrhageArmed`, and Hemorrhage's end-of-next-turn 10 MP loss. V4 `ability_alyssa_bulldozer_unstoppable` untouched (Phase 58). Reaction windows (Perfect Dodge etc.) are Phase 57/60.

## Self-Check: PASSED
