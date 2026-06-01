---
phase: 15-deck-reworks
plan: 01
status: COMPLETE
tests_added: 28
tests_total: 749
---

## What was done

- **starterDecks.js**: PHYSICAL_FORCE reworked — Mosjes: [mosje_gandoe_destroyer, mosje_michelle], 10 new piecies (boxing_gloves, bowie_stormey, eendjes_voeren, laat_me_chillen, kannetje_melk, protein_shake, affoe×2, quest_prep, tikker), snelle: [negate_elimination, emergency_healings, jensen, lucky_coin], places: [boxing_ring, toennoe], quest: [kickboxing_bootcamp]
- **places.js**: Added place_toennoe — trigger END_PHASE, effectId effect_toennoe, rarity ★★
- **placeEffects.js**: Added effect_toennoe (GANDOE +20 MP, MICHELLE +15 MP, both active +10 each); registered in resolvePlaceEffect switch
- **quests.js**: Added quest_personal_kickboxing_bootcamp — requiredMosjeId mosje_michelle, successMP 80, failMP -20, roll physical thresholds 4/3/2, isBoosterOnly false
- **questLogic.js**: Added getKickboxingBootcampDiceBonus export — returns 2 when Gandoe active, 0 otherwise
- **deck-balance.test.ts**: 28 new tests across 5 describe blocks (Physical Force rework, place_toennoe definition, kickboxing_bootcamp definition, effect_toennoe MP logic, diceBonus function); removed stale BAL-02 piecie_grammetje_pieter assertion

## Stale test fixed

BAL-02 `deck contains piecie_grammetje_pieter` removed — new Physical Force deck no longer contains that piecie.
