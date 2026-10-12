---
phase: 56
plan: 07
requirements-completed: []
---
# Phase 56 Plan 07: resolveQuest removal Summary

`tests/helpers/forceQuestResult.js` faces a Quest up, rolls forced dice (all 6s = win, all 1s = lose) through `rollQuestAttempt` + `resolveQuestAttempt`, and throws if the attempt is refused or the dice give the wrong result. 11 test files moved onto it. `resolveQuest`, `resolvePersonalQuestSideEffects`, `getFirstActiveMosjeSlotIndex` deleted from questLogic.js (`runQuestOutcomeHooks` kept).

## Changed expectations (amounts now Card List, not V4 successMP)
- ability-text-reconciliation (FPS Coert): Arm Wrestling +40 / Hack Mainframe +40 / Inspire +25 / lose -30; start MP 10 so the 80 totals still hold; slot traits 2 stars (2 dice). Social win 50->75, fail 50->20, "below 6" 50->50 (start 10).
- phase48 Jeffrey: Quick Thinking +25/-15 (was 40/-15): 30+25+10.
- quest-behaviors bonus block: Quick Thinking / Arm Wrestling, 20->55, 75->85, 60->55, 65->85; assertions on the bonus and synergy kept.
- gandoe-michelle: Arm Wrestling +40; Gandoe->Michelle 90->65; Michelle test starts at 70 (was 40) so the base win still levels her first; KNOWN GAP (Phase 58) kept, value 65->40.
- getemt: L2 starts 30 (was 20) to hit exactly 0 on -30. level-up: Jeffrey start 70 (was 90). place-the-void: no-Void 80->45. aad-recovery / geen-raad: same numbers (coin flip 50/-25), titles reworded.

## Deleted / replaced V4 tests
- quest-behaviors drawOnSuccess (3): replaced by `quest-extras.test.ts` "Cheat code win draws 1; empty deck ..." plus a new fail-draws-nothing test here.
- quest-behaviors opponentLoseMP (3, Elimination Challenge, now `disabled`): counterpart `quest-jab.test.ts` (win jab).
- dead-flag-engine Battle Concert redirect: `it.skip`, KNOWN GAP (fix in Phase 58; 2.0 = flat 15, resolveQuestAttempt does not read `_battleConcertActive`). The "non-Alyssa takes own fail" test runs live.

## Deviations
- `getFirstActiveMosje` kept (renamed body only): `canAttemptGeneralQuest`/`canAttemptPersonalQuest` still use it and their tests (outside this plan's list) pass; goes with 56-08. Perfect Sync / Winston Tijd / Personal side effects had no test in the list, so no deletions to name.
- Remaining `resolveQuest` text is in comments only (questLogic 862, quests.js 1076, test comments).

`npm test` green (1237 passed, 3 skipped); `node --check` clean on the 6 UI files, questLogic.js and the new helper.

## Self-Check: PASSED
