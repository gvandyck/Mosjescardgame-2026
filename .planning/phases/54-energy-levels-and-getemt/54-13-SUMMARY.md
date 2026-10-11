---
phase: 54-energy-levels-and-getemt
plan: 13
subsystem: engine
tags: [mp-funnel, piecie, static-guard, obby-2.0]
requires: ["54-10"]
provides:
  - "piecieEffects.js: every relative MP change goes through applyGainToSlot / applyMpLossToSlot"
  - "tests/engine/no-direct-mp-writes.test.ts: static funnel guard (FUNNELLED_FILES grows in 54-14, 54-15)"
key-files:
  created:
    - tests/engine/no-direct-mp-writes.test.ts
    - tests/helpers/makePiecieState.js
  modified:
    - src/abilities/piecieEffects.js
    - tests/engine/level-up.test.ts
    - tests/engine/getemt.test.ts
    - tests/effects/thematic-piecies.test.ts
requirements-completed: []
duration: 25min
completed: 2026-10-11
---

# Phase 54 Plan 13: Piecie MP funnel Summary

Piecie gains now level up (100+ -> next Level at 0 MP, L3 stops at 95) and Piecie losses run the 2.0 loss pipeline and getemt; a static guard keeps it that way.

## Commits
- 7f12ba5: guard + Piecie-path tests (red).
- 121edba: piecieEffects.js funnelled.

## Red run (before the change)
- Guard: 15 offending lines in piecieEffects.js (48, 57, 99, 306, 613, 682, 717, 776, 802, 807, 995, 1010, 1016, 1043, 1065).
- level-up: bare `effect_kannetje_melk` on L1 at 95 gave `[1, 100]` not `[2, 0]`; L3 at 90 gave `[3, 100]` not `[3, 95]`. (Through `activatePiecie` these passed already because the checkVictory normaliser backstop repairs the 100; so the tests call the bare effect to prove the funnel itself.)
- getemt: Affoe on an opponent L2 at 10 gave `[1, 95]` (V4 loop) not `[1, 50]`.

## Changes
- `applyMPGain`: Amplifier 1.5x + roundToFive kept, write is now `applyGainToSlot(..., { turnNumber })`.
- `applyDamage(state, playerId, slot, amount, source='DRAIN')` wraps `applyMpLossToSlot`; `applyHostileDamage(state, playerId, slot, amount)` keeps the U8 gate. `playerId` is the owner of the hit slot (T-54-30: Affoe test asserts the opponent's Welloe pile, not the actor's). V4 loop and `_pendingDefeat` / 54-05 interim removed.
- 13 direct `+=` gains (Momentum Diefje, Stookerino, Those Eyelashes, F1 Telemetry, Grammetje Pieter, Dikke Jonko own + opponents, Tikker, Larry Zegeltje) now use `applyGainToSlot` directly (no Amplifier, as before).

## mp-direct-ok lines
- :603 `revived.mp = slot.mp` - copies the fresh Reborn slot's MP into the Welloe-pile record, no change to a Mosje.
- :672, :673 Leipe Swap - swap is never a gain or loss (handoff §2b).
- :816, :817 Perfect Setup clamp 60..90 - V4 effect, Phase 59.

## Test expectations rewritten
- thematic-piecies.test.ts, Boosterpackkie and Perfect Rhythm "capped +10 MP" (95 + 10): was `mp 100, level 1` (V4 100 ceiling); under 2.0 100+ levels up, so now `level 2, mp 0`. Titles updated.

## Notable 2.0 behaviour changes
- Piecie gains can now level a Mosje (previously capped at 100 until the sweep). Dikke Jonko's +10 to opponents can level them.
- Piecie damage leaving a Mosje at exactly 0 or below now does getemt (L2-3 drop a Level to 50, L1 sideways, sideways -> Welloe pile) instead of the V4 regression.

## Known gaps (not this plan)
- turnManager.js Perfect Dodge `+= 15` (turnManager is 54-15 scope) and the Varkenspootjes resolution in main.js are not covered by this guard yet.

## Deviations
None.

## Tests
npm test: 101 files / 1032 tests green. node --check (CLAUDE.md list + piecieEffects.js) clean. Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
