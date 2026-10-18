---
phase: 61-bot-2-0
plan: 02
requirements: [BOT-02]
commits: [64fe12a, 513d1ef]
---
# Phase 61 Plan 02: Legal Energy for the bot (BOT-02)

- Delluft known gap (60-06) CLOSED. `getBotPaymentCost(state, botId, cardId, kind)` = engine `getEffectiveCost` / `getSnelleCost` / `getCardEnergyCost` (Dierenasiel, Welloe Graveyard, Coert's Caravan, Blensen!, Chain Reaction offer) + `delluftFee`, never `commit`; `canBotAfford(..., reserve = 0)` on top. Both project with `asBotView`.
- New choosers: `chooseSummon` (highest affordable cost, then start MP, a 0 MP Mosje last; null on cooldown / full field / opponent turn; was: cheapest), `shouldUseAbility(state, botId, slotIndex, profile, reserve)` (moved out of botDriver, fee-aware, Strike and Risk&Reward gates kept), `choosePlaceToPlay` (legal, affordable, Tesla needs a Coert). All 5 exports are in the BOT-04 TRAP_TABLE plus a presence check for `asBotView(`.
- botDriver: Phase 0 / abilities / Phase F use them; Phase B checks `PIECIE_SLOT_COUNT` before each `playPiecie`; Phase C skips a Piecie when `canBotAfford` or `piecieActivationGate` (on the table view) says no. Old inline gates and unused imports deleted.
- `engine-refused { deck, call, cardId, error }` on every failed driver call (playMosje, playPiecie, activatePiecie, useMosjeAbility, playPlace, attackMosje, rollQuestAttempt, resolveQuestAttempt) and `{ call: 'resolveReaction', cardId, error }` in settleReactions; the `action-skip` metric stays.
- `tests/bot/bot-energy.test.ts` (37): cost / afford / summon / ability / Place cases from the plan, Delluft driver scenarios (Energy 2 vs 3), full slots, Tesla, and 6 seeded Example Deck games (3 plain + 3 with the Delluft preset): 0 Energy refusals. Mutation check: ignoring the fee fails 12 tests, incl. all 3 Delluft games (the gap was real).
- REMAINING refusals over those 6 games (161, ALL `useMosjeAbility`; every other call and every Energy error is 0; for the 61-08 sweep): "This ability works on its own" 111 (MOSJE_ABILITY_RULES kind != activated, e.g. Gandoe Wizard); "Extra Resources is used during your draw step" 43 (Coert Tech); "Perfect Setup needs 3 face-down Piecies" 3 (Chris); "Cooldown turn: only face-down Piecies" 2 (Phase A / D / G abilities still run on a cooldown turn); "Lucky Beats is used at the pause after a Quest roll" 2 (DJ 8020).
- Deviation (no rule change): `choosePlaceToPlay.js` and its TRAP_TABLE entry landed in the Task 1 commit (the trap table is one shared file; keeps each commit green). Scenario tests filter refusals by call name so the pre-existing ability refusals above don't mask the Energy / summon / Piecie / Place checks.
- `npm test` 158 files / 1794 green; `node --check` clean per file; no Playwright. No KNOWN GAPs left from this plan.

## Self-Check: PASSED
