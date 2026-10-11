---
phase: 56
plan: 03
requirements-completed: [PLAY-01, PLAY-03, PLAY-04, PLAY-05, PLAY-06]
---
# Phase 56 Plan 03: Quest attempt Summary

Two-step 2.0 Quest attempt: `rollQuestAttempt` (one-action gate, face-up check, condition, cost paid on a clone, +1 die extras, seeded roll; Trained wins with no dice/rng) then `resolveQuestAttempt` (gainMP/loseMP, `runQuestOutcomeHooks`, `advanceQuestStack`, checkVictory). New tables `QUEST_CONDITIONS` (15), `QUEST_COSTS` (6, all 21 costIds covered, asserted), `QUEST_EXTRAS` (7 +1 die rules), `isReadyPiecieSlot`. `questLogic.runQuestOutcomeHooks` extracted from V4 `resolveQuest` (which now calls it; armed/partner bonus moved inside it, so it now applies after drawOnSuccess/opponentLoseMP, V4 tests unchanged). turnManager: `piecieActivationsThisTurn` (activatePiecie) and `cardsDrawnThisTurn` (phaseDrawCard), reset in startTurn.

Tests: `quest-costs` (E20), `quest-attempt` (E17/E18 + dice), `one-action` (E13); `cooldown-turn` swaps the V4 quest asserts for rollQuestAttempt + attackMosje (same error string). `npm test` 1218 green, node --check clean.

## Deviations / gaps
- Build Gadget / Speed Run are conditions (activate_N_ready_piecies), not pay-type costs, per the 2026-10-11 ruling.
- KNOWN GAP (fix in Phase 57): "Stays" Piecie condition falls back to the card def (`stays`/text) until slots carry a `stays` flag; ready = `canActivateOnTurn` else `playedOnTurn+1`.
- KNOWN GAP (fix in Phase 59): `drawFromEffect` does not exist yet; effect draws don't count toward Artistic Expression.
- PLAY-07 stays open for 56-04 (jab/named bonuses/Vraag Aad etc.). TDD note: tests were written together with the code, not as a separate RED commit.

## Self-Check: PASSED
