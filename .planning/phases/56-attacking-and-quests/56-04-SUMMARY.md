---
phase: 56
plan: 04
requirements-completed: [PLAY-07]
---
# Phase 56 Plan 04: Quest extras Summary

Jab (`getJabTargets` whitelist + `applyQuestJab`, 10 MP via loseMP `QUEST_JAB`; hits level-up-protected, never fresh; kinds true/nonDigital/mostMp/larryOnly) and `QUEST_EXTRAS` winBonus/failBonus/failBase/onWin for Geen Raad (+Vraag Aad), Speed Run, Parkeren Delft, Cheat code, Debug System, Form Alliance. New: `isNamedMosje`, `drawFromEffect` (empty deck = no draw/reshuffle/cooldown), `reorderDeckTop`, `removeDiscardsFromGame` (`state.removedFromGame`). `discardedCardIds` now carried from paid cost into `pending`. `resolveQuestAttempt` applies bonuses once, then jab, then onWin; with no jabTarget choice it takes the first legal target.

Tests: `quest-jab` (E19), `quest-extras`; helper in `tests/helpers/quest56.js`. `npm test` 123 files green, node --check clean.

## Deviations / gaps
- Card List amounts (+10) used over CONTEXT's +20, as the plan said.
- Test note: the default test Mosje is a Gandoe, so the non-Gandoe case uses Youri.
- Shotje Obby tie: all tied Mosjes are legal targets (winner picks).

## Self-Check: PASSED
