---
phase: 55
plan: 06
requirements-completed: [RULE-10]
key-files:
  created: [src/engine/targets/resolveOwnTargetSlot.js, src/engine/targets/resolveOppTargetSlot.js, src/engine/targets/findTagSlot.js, src/engine/targets/ownTargetEffects.js, src/bot/strategy/pickBotOwnTarget.js, tests/engine/own-target-choice.test.ts, tests/engine/no-active-mosje.test.ts]
  modified: [src/abilities/piecieEffects.js, src/abilities/mosjeAbilities.js, src/main.js, src/bot/botDriver.js, tests/engine/v4-leftovers-removed.test.ts]
---
# Phase 55 Plan 06: Active Mosje removed Summary

Piecie effects now use `resolveOwnTargetSlot` (chosen `own_slot_index`, else the only Mosje) and `resolveOppTargetSlot` (chosen slot, else first non-fresh). Abilities act on their own Mosje via `getActiveSlotIndexForMosje(player, mosjeId)`. main.js reuses `modal.showTargetSelector` for all 32 effects in `OWN_TARGET_EFFECT_IDS` when 2 Mosjes are in play; the bot picks via `pickBotOwnTarget`. Old first-active helpers deleted; static guard added. RULE-10 ticked.

## Deviations / notes
- Registry excludes `effect_affoe`, `effect_leipe_swap` (dedicated pickers) and `effect_boosterpackkie` (tag-only lookup); guard test lists them as exempt.
- Abilities called without a Mosje id (legacy tests) fall back to the only living Mosje (warn if several); with an id there is no fallback. No test expectations changed.
- KNOWN GAP (fix in Phase 56): Quest acting Mosje (`questLogic.getFirstActiveMosje`, main.js quest path) replaced by the Quest action.

`npm test` 113 files / 1144 tests green; node --check clean on all touched files.

## Self-Check: PASSED
