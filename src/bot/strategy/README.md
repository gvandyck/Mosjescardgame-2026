# Bot Strategy Layer (Obby 2.0)

Decision-making for the bot, separated from execution. `../botDriver.js` runs the turn through the real engine
functions (`turnManager.js`, `attackMosje`, `rollQuestAttempt` / `resolveQuestAttempt`); everything in this directory
only *chooses* - it never mutates game state. Bot valuation (what the bot prefers) is never a rule: legality is always
the engine's (`canMosjeTakeAction`, `isValidAttackTarget`, `piecieActivationGate`, dry-runs of the real call).

## The only-the-table-view rule (BOT-04)

The bot may use only what a player at a real table can see: its own hand, both boards, the public counters, the face-up
Place, and cards revealed to it THIS turn. Not the opponent's hand, either deck, the Quest stack decks, the opponent's
face-down Piecie ids or its pending options.

- `getBotView.js` builds that view (a new object assembled from public parts, hidden arrays only ever `.length`-read).
- `asBotView.js` is the FIRST statement of every state-taking chooser: `const view = asBotView(state, botId)`.
- `tests/bot/no-hidden-info.test.ts` guards it inside `npm test`: a trap state (hidden arrays throw on any read) runs
  every state-taking export listed in its `TRAP_TABLE`, a source scan fails on an export that is missing from the
  table (add a new chooser there), and an invariance check changes only hidden information and expects the same decision.

## Files

| File | Role |
|---|---|
| `getBotView.js` / `asBotView.js` | The table view of one seat and the projection every chooser starts with (see above). |
| `getBotPaymentCost.js` / `canBotAfford.js` | What a payment really costs the bot right now (engine cost functions: Place discounts, Delluft parking fee; never commits) and whether it can pay that and still keep `reserve` Energy back. |
| `botValues.js` / `slotWorth.js` / `valueOfGain.js` / `valueOfLoss.js` / `opponentThreat.js` | The value model: what a Mosje is worth (Level, MP, sideways), what a gain or loss does to it under the 2.0 level and getemt rules, and the Power the opponent can hit with next turn. Data in `botValues.js`. |
| `scoreMosjeAction.js` / `chooseMosjeAction.js` / `orderActingMosjes.js` | One action per Mosje: attack OR Quest, by expected value (attack = `attackMosje` dry-run through the real loss pipeline; Quest = chance x gain - chance of failing x loss; a Level 3 never risks a Quest the opponent could punish; a getemt is finished when possible). `orderActingMosjes` puts the most valuable Mosje first and the driver asks again after every action. |
| `questWinChance.js` / `questNeeds.js` / `chooseQuestCostChoice.js` / `chooseQuestChoices.js` / `assessQuestRisk.js` | Quest odds per band and dice count, the cheapest legal "First you must" cost, jab target and Quest picks, loss-severity words for fixed-odds gambles. |
| `comboTags.js` / `cardAmounts.js` | Tuning data from the 2.0 Card List: Piecie role tags and the numbers on Piecie texts. They steer choices, never rules. |
| `isUsefulActivation.js` / `planPiecieActivations.js` | Which ready Piecies are worth activating now (engine gate, would it do anything, Energy budget) and in which order (multipliers, MP gains, quest-prep, attacks, draw, defense, payoffs). |
| `pickBotOwnTarget.js` / `pickOwnSlotByRole.js` / `pickMosjeOption.js` / `chooseTriggerChoice.js` | Which own Mosje a "your Mosje" Piecie aims at (by what the card does) and the answer to a Mosje pause. |
| `reactionReserve.js` / `choosePieciesToPlace.js` | BOT-03: while a reaction Snelle for the opponent's turn is held, one Piecie slot stays free and its Energy stays unspent. `choosePieciesToPlace` picks the Piecies to place face-down within that room. |
| `chooseReaction.js` / `pickDefensiveSnelle.js` / `pickCounterSnelle.js` / `pickDjRerollDie.js` | The answer to an open reaction window: the bot's own windows (Sleutelpuntje, rerolls, Lucky Coin, Dubbele Temminks) are decided in `chooseReaction`; the opponent's actions go to the defensive picker (a Mosje in danger) and the counter picker (Jensen!, a Piecie, a winning Quest roll). Every Snelle must be affordable now. |
| `chooseProactiveSnelle.js` / `choosePlaceToPlay.js` / `placeFit.js` | Own-turn cards from hand: Snelle without a reaction moment (Momentum Rush, Bijna Welloe, ...) when legal and worth something; a Place only when it is legal, payable and `placeFit` (Power, Quest dice, Good for / Bad for) is above 0. |
| `chooseSummon.js` / `shouldUseAbility.js` / `defaultAbilityInputs.js` / `abilityTiming.js` | Which Mosje to summon (priced with fee and discounts, none on a cooldown turn), whether a Mosje ability button is accepted by the engine and affordable, the plain inputs for it, and when in the turn it fires. |
| `botProfiles.js` | Per-Example-Deck personality (`riskTolerance`, `comboPatience`, `preferAttack`); unknown decks get the balanced default. A profile changes what the bot weighs, never what is legal. |
| `emitBotMetric.js` / `withQuietLog.js` | `[BOT] METRIC {json}` console lines (`attack`, `quest-roll`, `action-skip`, `reaction-played`, `engine-refused`, ...) and quiet dry-runs. |

`../settleReactions.js` and `../settleMosjePauses.js` answer the reaction windows and Mosje pauses that belong to a bot
so a game can never stall on them; they stop at a human's window or pause.

## Turn order (`../botDriver.js`)

summon -> early abilities -> place Piecies face-down -> (cooldown turn: end here) -> activate Piecies -> own-turn Snelle
-> pre-Quest abilities -> one attack-or-Quest per Mosje -> Place -> late abilities -> end turn.
Every engine call the engine refuses is reported as an `engine-refused` metric; the legality test requires none.

## Tests

- `tests/bot/no-hidden-info.test.ts` - BOT-04, the table-view guard.
- `tests/bot/no-hidden-info-driver.test.ts` - BOT-04 for the driver files (61.1): a source scan of `src/bot/*.js` that fails on
  any read of `hand`, `deck`, `piecieSlots`, `revealed` or `_pendingTargets` that is not `players[botPlayerId]` (a new bot file is
  scanned automatically; extend the `OWN_WRITES` allowlist only with the exact text of a line that WRITES the bot's own input),
  plus a full-turn invariance check (the opponent's hand swapped with its deck top must not change the bot's actions up to the
  first wait for a human). The scan is a tripwire for obvious reads; the invariance test catches a computed-key read.
- `bot-legality.test.ts` also asserts 0 unexplained "Fresh ... fizzled" engine lines per game (Straffoe, which hits every
  opponent Mosje, is the one explained exception, see `tests/helpers/classifyFizzles.js`). The `engine-refused` metric now also
  covers `settleMosjePauses` (refused pause answer or draw step) and the second `settleReactions` failure (even the pass refused).
- `tests/bot/reaction-replay-seeds.test.ts` - the 61.1 regression seeds 0xB00E (Drain Reversal) and 50349 (Perfect Dodge).
- `tests/bot/bot-legality.test.ts` - BOT-01..BOT-03 over 15 seeded bot-vs-bot games on the 3 Example Decks (6 ordered
  pairings x 2 seeds, plus 3 with Delluft in play): every game finishes, 0 refused engine calls, every attack targets a
  non-fresh, non-level-up-protected Mosje (checked with the engine's own helpers), Energy stays an integer 0-6, a cooldown
  turn only places Piecies, a reaction slot is kept free, and the bot summons, activates (some costing Energy), plays
  Places and Snelle, attacks, finishes a getemt and tries Quests. The games run on `tests/helpers/runSeededBotGame.js`.
- `tests/bot/bot-energy.test.ts`, `bot-actions-2-0.test.ts`, `bot-values.test.ts`, `bot-targets.test.ts`,
  `reaction-reserve.test.ts`, `reaction-bot.test.ts`, `bot-hand-cards.test.ts`, `strategy.test.ts`,
  `ability-defaults.test.ts` - the choosers one by one.

The old deck-matrix simulation still uses pre-2.0 deck ids until Phase 64, so it is not used for the bot.

## Known gaps

- The bot never uses draw-step abilities (Coert Tech, Martin Historian); the draw step is settled with a normal draw.

Details: `.planning/phases/61-bot-2-0/deferred-items.md`.
