# Phase 61: Bot 2.0 - Research (planner-written, short)

Read from code on obby-2.0 @ 1152618. No research agent (Gandalf's cheapest process).

## What the bot does today
- `src/bot/botDriver.js` (391 lines) `driveBotTurnSteps(state, botId, { humanIds })` runs one turn through the real engine and returns `[{ state, label }]` (main.js animates these). Phases: 0 summon cheapest Mosje -> A early abilities -> B place every hand Piecie face-down until slots are full -> cooldown stop -> C activate ready Piecies (`planPiecieActivations`, tag order) -> D preQuest abilities -> E per slot `chooseMosjeAction` (attack or Quest) -> F first Place in hand -> G late abilities -> H `endTurn`.
- `settleReactions.js` / `settleMosjePauses.js` answer bot windows / pauses (`chooseReaction`, `chooseTriggerChoice` = first option). The UI path `src/ui/actions/settleReactions.js` and main.js L1141 also call `chooseReaction` / `chooseQuestChoices` directly.
- `chooseMosjeAction`: attack swing = min(Power, MP) + 20 if getemt; Quest swing = p*(win + jab 10) - (1-p)*(lose + 20 if self-getemt) - discard rank. Legality via `canMosjeTakeAction`, `isValidAttackTarget`, dry-run `rollQuestAttempt(..., { rng: () => 0, skipReactions: true })`. No level awareness, no Level 3 logic, slot order only.
- Bot-vs-bot on the 3 Example Decks already finishes (tests/bot/offlineGame.smoke.test.ts: 34-67 bot turns, ~50 ms a game). Metrics: 111 of 155 action-skips are "no-positive-swing".

## 2.0 engine APIs the bot must use for legality
- Energy: `getEffectiveCost(state, pid, id, 'piecie'|'ability', { caravan: true })` (no `commit` = pure), `getSnelleCost(state, pid, def)`, `getCardEnergyCost(id)` (Mosje/Place), `delluftFee(state, pid, amount)`, `canPay(player, n)`. `payEnergy` adds the fee; `activatePiecie` pays 0 while `player.chainReactionOffer > 0`.
- Table: `PIECIE_SLOT_COUNT`/`MAX_FIELD_MOSJES` (tableRules.js), `isPiecieReady`, `piecieActivationGate(state, pid, def)` (Jeffrey givesMP, levelGate, PIECIE_CONDITIONS), `isCooldownBlocked`, `snelleConditionMet(state, pid, def, reaction)`, `fieldHasMosjeNamed` (Tesla needs a Coert).
- Actions: `canMosjeTakeAction`, `canMosjeAct`, `isFresh`, `isValidAttackTarget` (fresh + `levelUpProtected`), `attackMosje(state, pid, params, { skipReactions: true })` returns `final` (dry-run gives the real loss after pets / Zo is Natuur / Stabilizer / Flow), `getJabTargets`, `getQuestDiceCount`, `getPower(slot, state, ownerId)`.
- Reactions: `state.pendingReaction = { moments, eligible, preview: { getemt, toWelloe, mpLoss, welloeSlots }, action: { type, args }, actorId, responderId }`; Snelle `reactionMoments` in snellePiecies.js; `resolveReaction(state, who, cardId|null)`.

## Old (1.x / V4) assumptions still in the bot
- Summon `canPay(printed cost)`; abilities `cost > energy` (printed, no Welloe Graveyard discount, no fee); Piecie activations and Places have NO affordability check (engine refuses silently, the driver ignores the failure). This is the Delluft gap (60-06 SUMMARY).
- Phase B fills all 3 slots: never keeps a slot (or Energy) for a reaction Snelle. No proactive Snelle on its own turn at all (Momentum Rush, Jantje Jantje... Jantje?, Ff Haaltje Nemen, Bijna Welloe, Chillingsvoorbij!).
- `chooseReaction` covers Sleutelpuntje, Lucky Coin, DJ/Piecie rerolls, Jensen!, Frenssen!, else "cheapest eligible on getemt"; nothing for Jammertje, Gevalletje, Je Weet Niet, Dubbele Temminks, Counter Strikka; ignores the Delluft fee on own-turn windows. Engine: `getEligibleReactions` uses `canPay` without the fee, so an own-turn window can offer an unpayable Snelle.
- `comboTags.js`: V4 roles (Boxing Gloves "mp-gain" is a Power boost, F1 Telemetry "quest-prep" is MP+draw; Super Saiyan Mos, Continuous Assault, Loaded Dice, Dikke Plaat, TweedeKANs, Place destroyers untagged). Power boosts and direct opponent losses share the `attack` tag.
- `planPiecieActivations` fires every ready Piecie (8 Slecht Gezet / 6 Bong Hit activations in 3 smoke games: destroying its own Place). `pickBotOwnTarget` uses the printed level-row Power and ignores fresh / Level 3.
- `botProfiles.js` keyed by V4 duo deck ids; the 3 Example Decks get the default profile. README still talks about the 20 MP Quest cost and Personal Quests.

## Hidden-information leak vectors
- Opponent hand (only its count is public), both decks (own deck: count only), Quest stack decks, the opponent's face-down Piecie ids, `state.revealed[opponentId]` (what THEY saw, may include the bot's deck top), `pendingChoice.options` when the choice is the opponent's, `pendingReaction.eligible` when the opponent responds, opponent `_pendingTargets`.
- Legit reveals: `getRevealedFor(state, botId)` (this turn), the bot's own `pendingChoice.options`, and a Piecie the opponent is activating (`pendingReaction.action.type === 'activatePiecie'`: that slot is face-up at the table).
- Today: `defaultAbilityInputs` is guarded (60-07); the rest is clean by convention only. No test covers every chooser.

## Known gaps assigned to Phase 61
- (a) Delluft fee in bot Energy planning: OPEN -> 61-02 (and 61-06 for the reaction offer).
- (b) Drain Reversal reflect: ALREADY CLOSED in 60-02 (`effect_snelle_drain_reversal`: the threatened Mosje loses 20 less, one opponent Mosje loses a fixed 10, matching the Card List). Tested in tests/abilities/snelle-protect-dice.test.ts. No plan needed; 61-09 marks the ROADMAP line.
- (c) Skiffa +2 Social dice / Tweede Kans reroll: ALREADY CLOSED. The 2.0 Skiffa text has no +2 dice; 60-05 wired `placeSkiffaGrant` (Artistic roller reroll) and deleted the two V4 `it.skip` cases; TweedeKANs is a Phase 59 `anyQuest` reroll grant. `grep it.skip tests` finds none. The bot already spends grants through `pickDjRerollDie(..., 'piecieReroll:')`. 61-09 marks the ROADMAP line.

## Design choices (Claude's discretion, no rule changes)
- BOT-04 by construction: `getBotView(state, botId)` builds a redacted copy (reads only `.length` of hidden arrays); every exported chooser in `src/bot/strategy/` projects on entry via `asBotView`. Guard test: a "trap" state whose hidden arrays throw on element reads + a source scan that forces every new state-taking export into the trap table.
- Value model (desk-sim idea, not code): slot worth = (level-1)*100 + MP + level bonus (L2 +25, L3 +200) - 25 if sideways; Welloe pile = -145. Attacks scored by the attackMosje dry-run on the view (sums every opponent slot change, minus thorns on the attacker). Own Level 3: no Quest whose loss would leave MP at or below the opponent's next-turn threat (sum of their upright Mosjes' Power).
- Legality evidence: the driver emits `engine-refused` for every engine call that fails; the final legality test asserts 0 refusals, independent target / Energy / cooldown checks per step, over seeded bot-vs-bot games of all 3 Example Decks (plus a Delluft-preset run, since no Example Deck holds Delluft).

## Open rule questions
None blocking. (The bot only remembers this turn's reveals, which is less than a human remembers: never more information than the table gives.)
