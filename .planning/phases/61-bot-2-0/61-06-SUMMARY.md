---
phase: 61-bot-2-0
plan: 06
requirements: [BOT-03, BOT-02]
commits: [0fef764, fe293e4, d77295e, 537bf55]
---
# Phase 61 Plan 06: Reaction slot and Energy kept, fee-correct own-turn offers (BOT-03, BOT-02)

- `reactionReserve(state, botId) -> { keepSlot, energy, cardIds }`: hand Snelle with a DEFENDER moment (every moment except beforeOwnQuestRoll / afterOwnQuestRoll / afterOwnPiecieActivation); energy = cheapest printed cost held (Blensen! 4, no Delluft fee); holds on a cooldown turn. Own-turn (Sleutelpuntje, Dubbele Temminks) and proactive Snelle (Momentum Rush ...) reserve nothing. The condition ("Needs: ...") is not judged, so a held Perfect Dodge reserves even while no Mosje has Physical ★★.
- `choosePieciesToPlace(state, botId)`: `playPriority` moved out of botDriver (V4 'QUEST' branch gone); returns hand Piecies by role order, at most `PIECIE_SLOT_COUNT - filled - (keepSlot ? 1 : 0)`, never negative. Chris's Perfect Setup gets no exemption (handoff 5: no exceptions).
- botDriver: Phase B places exactly that list; Phase C gives `planPiecieActivations` `budget = energy - reserve` and re-checks `canBotAfford(..., reserve)` before each activation; abilities and Places pass the reserve; the reserve is read again at every decision point. Summons stay exempt (Energy 3 + Jensen! still summons a cost-3 Mosje).
- Engine fix: `getEligibleReactions` checks `cost + delluftFee(...)` (the price `payEnergy` charges); off-turn windows are unchanged because the fee is 0 there. 5 cases in `tests/engine/reaction-eligible-fee.test.ts`, incl. offered iff `payEnergy` accepts at Energy 0..3.
- Tests: `tests/bot/reaction-reserve.test.ts` (23: reserve, placement count, driver slot / Energy / Place / ability / summon cases); both new exports are in the BOT-04 TRAP_TABLE plus a presence check for `asBotView(`. Mutation check: reserve args forced to 0 and the old Phase B list restored fails 5 driver tests.
- `npm test` 162 files / 1972 green; `node --check` clean per file; `tests/ui/snelle-reaction.spec.js` 5/5 green headless (1920x1080, temp config deleted). No sim. BOT-02 / BOT-03 stay unticked (61-07 / 61-08 / 61-09 carry them).
- Deviations: none from the rules. The plan's executor line names "Claude Opus 5.5" in the Co-Authored-By trailer; the orchestrator's rule (Sonnet 5.5) was used. No KNOWN GAPs.

## Self-Check: PASSED
