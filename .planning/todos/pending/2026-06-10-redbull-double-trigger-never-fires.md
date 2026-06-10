---
created: 2026-06-10
title: Fix Redbull double-trigger (flag set but never consumed)
area: abilities
files:
  - src/abilities/piecieEffects.js:400
  - src/engine/turnManager.js:97
  - src/main.js (handleUseAbility)
  - tests/ui/simulation/chain-tests.spec.js (chain-5)
---

## Problem

The Redbull piecie ("Your active Mosje's unique ability triggers TWICE this turn")
does nothing. `effect_redbull` (src/abilities/piecieEffects.js:400) sets
`player.abilityDoubleTrigger = true`, and `turnManager.js:97` clears it at endTurn,
but **no code reads the flag** to actually fire the Mosje ability a second time.
`handleUseAbility` in src/main.js (and `useMosjeAbility` in turnManager.js) never
check `abilityDoubleTrigger`.

Confirmed by `tests/ui/simulation/chain-tests.spec.js` chain-5 (currently `test.fail()`):
with Alyssa Fissa (+5 per card in hand), the gain was 35 (×1), not 70 (×2).

`grep -rn "abilityDoubleTrigger" src/` → set in piecieEffects.js, cleared in
turnManager.js, read NOWHERE.

## Solution

In the ability-use path (src/main.js `handleUseAbility`, and/or
`useMosjeAbility` in src/engine/turnManager.js), after the ability resolves:
if `player.abilityDoubleTrigger === true`, re-run the ability effect a second
time, then consume the flag (set false). Mirror how Dubbele Temminks does its
`doubleNextPiecie` double-fire in `activatePiecie` (turnManager.js ~line 716)
for a consistent pattern.

Then:
- Flip chain-5 in chain-tests.spec.js from `test.fail()` to a normal assertion
  (expect double the single-trigger gain).
- Per CLAUDE.md (touches MP/ability logic): re-run the Ronald Kip stacking test
  and the simulation after the fix.

NOTE: a separate, unrelated bug exists — **MP is not clamped to 100**. Piecies
NOT leveling up is CORRECT (game rule: only Quests permanently level up). But
non-quest gains (piecie `applyMPGain` + direct `.mp +=` in abilities/places) don't
cap at 100, so a Mosje can reach 105 — violating the 0–100 invariant
(phase0-rulings.md). See card-chains.spec.js "piecie MP gain caps at 100"
expected-failure. Track + fix separately (likely its own GSD plan — touches all
MP-gain sites + needs Ronald Kip test + sim).
