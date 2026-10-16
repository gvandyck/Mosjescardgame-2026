---
phase: 59-piecie-effects
plan: 05
requirements: [EFX-02]
key-files:
  created: [src/engine/mp/applyMpAmplifier.js, src/engine/mp/synergyFieldBonus.js, tests/abilities/piecies-sections-rest.test.ts]
  modified: [src/engine/mpManager.js, src/engine/gameState.js, src/engine/turn/expireThisTurnEffects.js, src/engine/targets/ownTargetEffects.js, src/abilities/piecieEffects.js, src/abilities/piecie/mpPiecies.js, src/abilities/piecie/substancePiecies.js, src/abilities/piecie/gearPiecies.js, src/abilities/piecie/petPiecies.js, src/abilities/piecie/utilityChainPiecies.js, src/abilities/piecie/gainFromPiecie.js, src/abilities/mosje/coertKasteLuckMorningLuck.js, tests/engine/ronald-kip-stacking.test.ts, tests/ui/cards/piecie-registry-2-0.js]
completed: 2026-10-16
---
# Phase 59 Plan 05: MP / Substance / Gear / Pet rest + MP Amplifier + Synergy Field Summary

The MP, Substance, Gear and Pet Card List sections are complete (10 + 9 + 6 + 5 effects); MP Amplifier and Synergy Field live inside `gainMP`; the Ronald Kip test is rewritten to the Card List numbers.

## Commits
- 35a044a Effects, gain-funnel changes, new Ronald Kip test (both tasks' code landed in one commit: the effects share files).
- 2340d5a 19 unit tests, 17 headless card cases (72 Piecies cases total), V4 test expectations rewritten.

## What changed
- `gainMP`: Synergy Field first (+10 per staying copy, `source === 'ABILITY'` only), then MP Amplifier (`applyMpAmplifier`: double, max +40 extra, one-shot, disarmed before the gain; The Void blocks the gain and keeps the flag). V4 `mpAmplifierActive` x1.5 and `synergyFieldTurnsLeft` removed; `mpAmplifierThisTurn` ends with the turn.
- Ronald Kip 50/60 + draw, Chef's Special 15..45, Warm Kannetje Melk, Shoettoe (+30, 20 MP or less), Stripje Bennies, Pot of Weed, Dumbbells, Skipping Rope on traits stars, Mouse (+10, pick a deck, order its top 2; only the activator sees the names).
- Tony / Gekke Vogels / KatjeGang on the Pet cover helper; Gekke Vogels pays 15 each to Jisca + an Alyssa at the next turn start when a KatjeGang stays; Morning Luck works on 3-6 while a Tony stays.
- Ronald Kip test: 12 cases (50, 60 + draw, empty deck, 90, 100 -> Level 2, Quest 40 -> 80 once, Binti extra doubled, Level 3 cap 95, Void).

## Deviations
- Mouse sits in gearPiecies.js (not its own file) because the registry guard scans `*Piecies.js`; Skipping Rope left `OWN_TARGET_EFFECT_IDS` (no pick); Tony / Gekke Vogels / KatjeGang added.
- V4 expectations rewritten (never weakened): dumbbells / skipping rope (Fighting subtype -> Physical stars), Mouse interim label, Tony / Gekke / KatjeGang halved-loss tests, card-chains Amplifier chain (+40 x1.5 -> +50 doubled).
- Jisca's random Perfect Combo roll made the new Gekke tests flaky: pinned with `jiscaRolledThisTurn` / `abilityDice`.
- Synergy Field order: +10 first, then the Amplifier doubles (the Card List does not fix the order).

## Verification
npm test 147 files / 1546 green; node --check clean (6 UI files + touched src, each separately); headless Playwright via a temporary config (deleted): piecie-cards-2-0 72/72, card-chains Amplifier chain green. No sim run (Node smoke in npm test).

## Known gaps
Unbuildable texts: none. "Look at the opponent's hand" in Chef's Special is the count only (no reveal modal); Phase 60 audits hidden-information prompts. `mosjeAbilities.js applyGain` is unused dead code, untouched.

## Self-Check: PASSED
