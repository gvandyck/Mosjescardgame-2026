---
phase: 15-deck-reworks
plan: 02
status: COMPLETE
tests_added: 27
tests_total: 776
---

## What was done

- **starterDecks.js**: DIGITAL_CONTROL reworked — Mosjes: [mosje_coert_tech, mosje_binti], 11 piecies (kannetje_melk×3, varkenspootjes, pot_of_weed, quest_prep×2, bong_hit_demolition, redbull, keyboard, controller), snelle: [jensen×2, lucky_coin, counter_strikka], places: [tesla, bank_chilling], quest: [winston_tijd]
- **places.js**: Added place_tesla — trigger TURN_START, effectId effect_tesla, rarity ★★★
- **placeEffects.js**: Added effect_tesla (COERT +20 MP, BINTI +20 MP, both active +10 each; no-op when Coert absent); registered in resolvePlaceEffect switch
- **quests.js**: Added quest_personal_winston_tijd — requiredMosjeId mosje_binti, successMP 100, roll null, isBoosterOnly false, rarity ★★★★
- **questLogic.js**: 3 targeted inserts — canAttemptPersonalQuest Tesla gate, resolveQuest auto-succeed, resolvePersonalQuestSideEffects Tesla-to-hand + Varkenspootjes recovery
- **victoryChecker.js**: Tesla destruction hook in markMosjeDefeated — Coert sent to Welloe clears activePlace and unshifts place_tesla to discard
- **main.js**: Tesla activation guard in PLACE card play block — blocks when Coert not on field
- **deck-balance.test.ts**: 27 new tests across 4 describe blocks; removed stale BAL-01 piecie_mouse assertion

## Stale test fixed

BAL-01 `deck contains piecie_mouse` removed — new Digital Control deck replaces mouse with varkenspootjes/bong_hit_demolition/redbull.

## Test correction

effect_tesla Binti-alone test: expected 30 (not 20) because road-trip bonus also applies when both Coert+Binti are present.
