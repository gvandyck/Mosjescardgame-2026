---
phase: 57
plan: 05
requirements-completed: []
key-files:
  created: [src/engine/reactions/*.js (7 files), src/bot/settleReactions.js, src/bot/strategy/chooseReaction.js, tests/engine/reaction-windows.test.ts, tests/bot/reaction-bot.test.ts]
  modified: [src/data/snellePiecies.js, src/engine/actions/attackMosje.js, src/engine/turnManager.js, src/engine/quests/rollQuestAttempt.js, src/engine/quests/resolveQuestAttempt.js, src/bot/botDriver.js, src/bot/strategy/chooseMosjeAction.js]
---
# Phase 57 Plan 05: Reaction-window engine and bot Summary

attackMosje / activatePiecie / playSnellie / rollQuestAttempt pause on a serialisable `state.pendingReaction` when a player holds a fitting, payable Snelle (all 10 moments); `resolveReaction(state, player, cardId|null)` plays or passes, opens queued windows (defender first, actor second, re-checked), then replays once with `skipReactions`. Bot answers via `chooseReaction` + `settleReactions`; `driveBotTurnSteps(state, id, { humanIds })` pauses at a human window and resumes idempotently. TABLE-04 NOT ticked (57-06, after human prompt + U6). `npm test` 127 files green; all touched files pass `node --check`.

## Bot-vs-bot (3 Example Deck pairings, seeds unfixed, all FINISH, no open window)
TAKSEN v REGELAARS: winner player_1 after 6 turns; CREATIEVELINGEN v TAKSEN: player_2 after 13; REGELAARS v CREATIEVELINGEN: player_1 after 36.

## Notes / deviations
- Window result flag is `reactionPending: true` (not `pending: true`) because rollQuestAttempt already returns `pending` as the roll.
- Detection runs the action as a dry run on the unchanged state; the replay is the truth (Math.random effects may differ).
- Not Today! (`snelle_negate_elimination`) mapped to `toWelloe` per the RESEARCH map; Jensen!/Lucky Coin effects themselves unchanged (Phase 60).
- Quest args drop `rng` when stored in pendingReaction (replay uses Math.random). No test expectations changed.
- Human-side wiring (UI prompt, bot answering a window opened by a human action) is 57-06; use `settleReactions` there.
