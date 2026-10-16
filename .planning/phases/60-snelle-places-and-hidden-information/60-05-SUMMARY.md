---
phase: 60-snelle-places-and-hidden-information
plan: 05
requirements: [EFX-04]
commits: [4558ec2, ceced4f]
---
# Phase 60 Plan 05: Turn-start, dice and Quest Places

- `src/abilities/place/placeTurnQuestEffects.js`: `placeTurnStart` (Gym -10 non-Fighting, Bank Chilling +10 Social 2+, Eendjes Michelle +10; turn player only, fresh skipped), `placeQuestBonus` (Quest Haven, Obby #1, Delluft + Parkeren Delft +20; added in `resolveQuestAttempt` after Michelle's double, before the one gain / before loseMP), `placeSkiffaGrant` (forRoll reroll grant for an Artistic roller in `rollQuestAttempt`), `placeGearDraw` (DGS, in `afterPiecieEffect`), `placeTeslaCheck` (in `checkVictory`; `playPlace` refuses Tesla without a Coert).
- Removed: all `applyPlaceEffectsOn*` wrappers + calls, V4 bodies of Gym / Quest Haven / Bank Chilling / Obby #1 / DGS / Eendjes / Tesla, the `questBonusMP` consumer, the V4 Tesla spot in `victoryChecker`. END_PHASE counter `activePlaceTurnsActive` kept inline in `endTurn`. Momentum Factory untouched.
- Tests: new `places-turn-quest.test.ts` (13); rewrote place-skiffa / bank-chilling / digital-gaming-stop / obby-1; registry +18 cases (47 total, headless green); `npm test` 152 files / 1618 green; node --check clean.
- Deleted V4-rule tests (rules gone, replaced above): the 2 skipped Skiffa tests (Social +2, Tweede Kans modal param); questBonusMP tests in quest-behaviors (3); effect_tesla (4) + effect_eendjes_voeren (2) in deck-balance; effect_quest_haven (3) in phase48; effect_the_gym (5) in physical-equipment-scaling; `place-delluft.test.ts` and 2 end-phase cases in place-coerts-caravan (they called the removed end-phase hook; 60-06 rewrites Delluft / Caravan). `fresh-ignores-places` count floor 10 -> 5 (fewer effect_* exist).
- Unbuildable texts: none. Zie je die on-draw gap closed (no on-draw hook remains). Gym/Tesla/De Box/Arcade quest dice were not in this plan.

## Self-Check: PASSED
