---
phase: 56
plan: 08
requirements-completed: []
---
# Phase 56 Plan 08: V4 Quest system removal Summary

V4 Quest code is gone from src/ and guarded: `v4-leftovers-removed.test.ts` now bans the deleted identifiers (comment-filtered, src/data excluded). `npm test` green (1162 passed, 3 skipped); `node --check` clean on the 6 UI files plus every touched src file. REQs not ticked (PLAY-03/04 close in 56-09 with the browser spec).

## Removed
- turnManager: attemptGeneralQuest/PersonalQuest, playPersonalQuest, activatePersonalQuest, hasAttemptedQuestThisTurn, Quest Haven maxQuests. gameState: shared Quest deck/discard. questLogic: checkTraitRoll, getQuestDiceThreshold, canAttempt*, getGeneralQuestBlockReason, all quest_req_*, `getFirstActiveMosje` (+ unused helpers). main.js: Personal Quest play branch; boardRenderer: Personal Quest Activate button.

## Deleted V4 tests and 2.0 counterparts
- quest-threshold -> quest-dice / quest-bands. quest-haven-double-quest -> one-action.test. first-turn-quest-lock -> v4-leftovers-removed.
- phase48-place-quest 10 quest_req_* describes -> quest-costs "E20 - conditions" (gates), quest-dice/quest-bands (thresholds). quest-behaviors hack_mainframe -> quest-dice. cooldown-turn activatePersonalQuest check -> the rollQuestAttempt check in the same test.
- Rewritten to 2.0: momentum-master, phase-22-quest-gates, equipment-scaling (QUEST_BLOCKED), place-synergy-chamber.

## Changed expectations
- momentum-master: 101 MP is now allowed (Card List "80 MP or more", no upper bound). phase-22: Chain Master is `disabled`, Sustained Assault has no gate in 2.0.
- offlineGame.smoke deck-out seed 0xC0FFEE -> 0xC0FFEF: removing the Quest-deck shuffle shifted the seeded RNG, the old seed ended by Level-3 before any deck-out.

## Deviations
- [Rule 2] QUEST_BLOCKED (Tikker / Jeffrey) was enforced only by the deleted canAttempt*; added to `checkQuestCondition` so the 2.0 attempt still refuses blocked Mosjes.
- [Rule 3] Ming Future Sight read the deleted deck: now peeks a 2.0 stack via `getMingPeekStack`. KNOWN GAP (fix in Phase 58): no stack choice in the UI.
- `questsAttemptedThisTurn` kept (not banned): `rollQuestAttempt` writes it as the 2.0 attempt counter (bot test, quest-success spec read it). Inert V4 fixture fields and `requirementId: "quest_req_*"` data strings remain in some test fixtures.

## Self-Check: PASSED
