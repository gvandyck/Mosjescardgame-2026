# Phase 60 - Research (short)

**Date:** 2026-10-16 · Source of truth: Card List Snelle / Places / Rulings + Handoff §2f/§2g/§3c/§6b. Nothing under `/_archive/` read.

## Code map

| Area | Where | State today |
|---|---|---|
| Snelle data | `src/data/snellePiecies.js` | 20 ids, costs match the Card List, `reactionMoments` set (57-05). No `needs` field, no limit field for The Protector. |
| Snelle effects | `src/abilities/snelleEffects.js` (323 lines) | **All 20 bodies are V4** (first-Mosje auto-target, `_snelleFlags` one-shots, Jensen = +20 MP, Jantje = steal 30, Lucky Coin = coin flip). |
| Snelle play | `turnManager.js playSnellie` L564-641 → `playSnellieCore` | slot rule + pay + discard OK (57-03). Calls `effectFn(state, playerId)` with no context; Gevalletje V4 copy flag; `_snelleBlocked` (Those Eyelashes). |
| Reaction windows | `src/engine/reactions/*` | Window opens on a dry run, Snelle is played **before** the action replays (`resolveReaction` → `replay`). Jensen queues a `jensenPlayed` window. Nothing passes the window's `preview` / `action` to the Snelle, no cancel path, eligibility ignores "Needs:". |
| V4 Snelle interceptions | `mpManager.js loseMP` L97-128 (Counter Strikka / Perfect Dodge / Drain Reversal reflect = full amount), `turnManager.js` L235-241, L503-528 (negateNext*), `victoryChecker.js` L150 (negateNextElimination), `runPiecieEffect.js` L57 (doubleNextPiecie), `questDiceSources.js` snelleFlagDice, `main.js` L1778-1795 pills, `actionAnimations.js` L35-44 | all to be replaced. |
| Loss pipeline | `src/engine/mp/lossSteps.js` (beforeLoss / base / reducers / caps) | `drainZoneBonus` (V4: +10 on DRAIN), `zoIsNatuurReducer` (2.0 OK), `coertsCaravanShield` (V4 Quest shield), `protectorSnelleReducer` (V4 flag), `momentumStabilizerCap` (2.0 OK). `loseMP` L80 The Void blocks **all losses** (V4). |
| Power | `src/engine/mp/getPower.js getPower(slot)` | no Place Power. Callers: `attackMosje.js` L27, `bot/strategy/chooseMosjeAction.js` L19. Power is not shown on screen; tests read state. |
| Place data / play | `src/data/places.js` (20 + parked Momentum Factory), `turnManager.js playPlace` L884 | play rule OK (57-04); owner in `state.activePlacePlayedBy`. |
| Place effects | `src/abilities/placeEffects.js` (600 lines) + dispatcher `resolvePlaceEffect` (END_PHASE / START_PHASE / ON_DRAW / ON_QUEST / ON_PIECIE_ACTIVATE / ON_WELLOE / PASSIVE); hooks in `turnManager.js` L815-880, called from turnManager L70/190/195/206/297, `afterPiecieEffect.js` L19/L39, `questLogic.js` L88/L91 | **Every body is V4** except Synergy Chamber (58-01). No 2.0 Place has an on-draw or end-of-turn effect. |
| Place dice / traits | `questDiceSources.js placeDice` (Gym / Arcade / De Box / Tesla 2.0 OK, fresh skipped), `questLogic.js` L44 (Eendjes resilient 3) | Skiffa reroll missing. |
| Energy | `energy/payEnergy.js`, `canPay.js`, `getCardEnergyCost.js`, `table/piecieActivationGate.js` (The Void V4 tag block) | no cost modifiers (Delluft, Dierenasiel, Welloe Graveyard, Coert's Caravan). |
| Quest win / loss MP | `quests/resolveQuestAttempt.js` L33-45 (`questWinAmount` trigger then one gain), `questExtras.js quest_parkeren_delft` | no Place bonus; `questLogic.js` L59-63 `questBonusMP` consumer is dead (no setter). |
| Hidden info | `state.revealedHandTo = { viewerId, turnNumber }` set by `fpsWestGuess.js`, `ronaldChefStrategicInsight.js`, `fpsWestRevealHand.js`; Stookerino / Jantje / Chef's Special read the opponent hand inside pause options; no UI reads `revealedHandTo`. | single-viewer field, no reveal modal. |
| Card tests | `tests/helpers/mosjeCardTest.js` / `mosjeCardSetup.js` / `mosjeCardTrigger.js` (kinds: button, playFromHand, turnStart/End, activatePiecie, quest, attacked, botPlayPiecie), `reactionUi.js answerReaction`, `forceQuestResult.js`; registries `mosje-registry-2-0*.js`, `piecie-registry-2-0.js`; old V4 `card-registry.js` SNELLE_SPECS + `snelle-effects.spec.js` | no Snelle / Place / Quest 2.0 registry; no Power expectation; no hook for bot Snelle / bot Quest / Power. |
| V4 unit tests that will change | `tests/engine/place-*.test.ts` (14 files), `fresh-ignores-places.test.ts`, `loss-pipeline-order.test.ts`, `reaction-windows.test.ts`, `snelle-*.test.ts`, `tests/effects/phase48-*.test.ts`, `tests/abilities/interrupt-data-fixes.test.ts`, `tests/abilities/quest-behaviors.test.ts` (questBonusMP) | rewrite to Card List numbers; delete only when the rule is gone (name it in the SUMMARY). |

## Design calls (Claude's discretion, from the locked context)
- **Snelle context:** `playSnellie(state, id, ref, def, opts)` passes `ctx = { reaction: { moments, preview, action, actorId } | null, picks }` to the effect; `resolveReaction` hands its `pendingReaction` to it. Snelle picks use the 59-01 `pendingChoice` pause (`hook: 'snelle'`), bot defaults in `defaultAbilityInputs` style.
- **Reaction effects that change the held action** write to `state.reactionMods` (one list, cleared when the replay finishes): `{ kind: 'reduce', playerId, slotIndex, amount }`, `{ kind: 'gainFirst', ... }`, `{ kind: 'save' }` (Not Today!), `{ kind: 'cancel', by, dest: 'discard'|'deckBottom' }` (Jensen! / Jammertje), `{ kind: 'retarget', to }` (Counter Strikka). `replay` reads them; a new `snelleReactionReducer` in `LOSS_STEPS.reducers` replaces `protectorSnelleReducer`; Emergency Healings is the `beforeLoss` hook already named in lossSteps.js.
- **Needs / Only if:** `needs` data on the Snelle def, checked by one `snelleConditionMet(state, playerId, def, reaction)` in `getEligibleReactions` and in `playSnellieCore` (refused, nothing paid).
- **Place Power:** `getPower(slot, state, ownerId)` adds `placePowerBonus(state, slot, ownerId)` (0 for fresh); callers pass state + owner. New test hook `getMosjePower(playerId, slotIndex)`; card-test expect key `power`.
- **Place triggers:** dispatcher keeps only START_PHASE (Gym, Eendjes, Bank Chilling) + checks; ON_DRAW, END_PHASE, ON_QUEST V4 hooks are removed (closes the Zie je die on-draw gap). Quest MP Places go through `resolveQuestAttempt` (win: after the `questWinAmount` trigger, so Michelle doubles only the Quest's own MP; loss: base amount). Effects in section files `src/abilities/place/*.js`, Snelle in `src/abilities/snelle/*.js` (59 ruling).
- **Energy cost modifiers:** one `getEffectiveCost(state, playerId, cardId, kind)` used by canPay checks and payEnergy callers (Dierenasiel pets 0, Welloe Graveyard -1, Coert's Caravan 0 once per turn, Delluft parking fee); `canPay` gates use it so a card you can't afford with the fee is refused.
- **Hidden info:** `state.revealed = { [viewerId]: [{ source, cardIds, turnNumber }] }` replaces `revealedHandTo`; UI shows a read-only reveal on the generic modal only when `viewerId === localPlayerId`; bot options built from the reveal list only.

## Per-card gap table
### Snelle (Example Deck = ED)
| Card | ED | Today | 2.0 work | Plan |
|---|---|---|---|---|
| Momentum Rush | ED | +15 first Mosje | pick own Mosje, +15 | 01 |
| Bijna Welloe | | +20 if first Mosje <=10 | Only-if gate, pick a Mosje with <=10 | 01 |
| Ff Haaltje Nemen | | draw 2 (raw splice) | draw 2 via mid-turn draw rule (empty deck = nothing) | 01 |
| Chillingsvoorbij! | | first Place in discard | last Place you lost (most recent) | 01 |
| Jantje Jantje... Jantje? | ED | steal 30 | Only while Bank Chilling: opp -15, own +15, picks | 01 |
| Emergency Healings | ED | +25/35 to first Mosje | wouldLoseMp: the threatened Mosje gains first (beforeLoss) | 02 |
| The Protector | | V4 flag -30 | that Mosje loses 30 less; limit 1 per deck | 02 |
| Perfect Dodge | ED | negate attack +15 | Needs Phys ★★ on attacked Mosje; -20 / -30 (Phys ★★★) | 02 |
| Drain Reversal | ED | reflect full amount | -20, one opp Mosje loses 10 (known gap) | 02 |
| Not Today! | ED | flag in victoryChecker | not sent; stays (sideways kept); <5 MP -> 5 | 02 |
| Lucky Cóin | ED | coin flip | Needs Cre ★; reroll chosen dice once; Cre ★★★ choose results | 02 |
| Sleutelpuntje | ED | +1 flag | beforeOwnQuestRoll: +1 die on that Quest (max 4) | 02 |
| Je Weet Niet | | forceReroll flag | after opp roll: reroll all, keep new | 02 |
| Jensen! | ED | +20 MP | cancel the targeting Piecie/Snelle | 03 |
| Frenssen! | | chain flag | cancel the Jensen!; one Jensen-player Mosje -10 | 03 |
| Blensen! | | chain flag, cost 4 | free after Jensen!/Frenssen! this turn; cards can't target your Mosjes until end of turn; Stays | 03 |
| Counter Strikka | | negate next Piecie | Needs Men ★★; retarget to another legal target; Men ★★★ draw 1 | 03 |
| Jammertje Gepakt! | ED | negate search | Needs Men ★★; cancel opp Piecie -> bottom of their deck, Energy spent; Men ★★★ draw 1 | 03 |
| Dubbele Temminks | | flag (59-01 runner) | effect again, same/new targets; not ★★★★★ | 03 |
| Gevalletje Klakkeloos | | V4 copy flag | same effect for you, own targets; not ★★★★★ | 03 |

### Places
| Place | ED | Today | 2.0 work | Plan |
|---|---|---|---|---|
| The Gym | ED | V4 MP drip | Fighting +10 Power; Physical Quest +1 die (done); start of turn non-Fighting -10 MP | 04-05 |
| Boxing Ring | | V4 MP | Fighting +10 (Gandoe +20), Digital/Artistic -10 Power | 04 |
| De Box | ED | V4 MP | Gandoe/Michelle/Tuk +10 Power (+1 die done) | 04 |
| Eendjes Voeren | | Michelle +10 at end | Resilient ★★★ on Quest rolls (done); Michelle +10 at owner's turn start | 05 |
| Arcade | ED | V4 MP | Fighting -10 Power (+1 die done) | 04 |
| Skiffa | ED | nothing (2 skipped V4 tests) | Artistic Quest roll: may reroll 1 die; Digital -10 Power | 04-05 |
| Bank Chilling | ED | +15 Social | start of turn Social ★★+ +10 MP; all -10 Power | 04-05 |
| Drain Zone | | +10 to DRAIN, V4 end drain | all +10 Power (known gap) | 04 |
| Tesla | | V4 MP | play only with a Coert; Coert/Binti +1 die (done); destroyed when no Coert (any exit) | 05 |
| Coert's Caravan | ED | V4 Quest shield | once per turn, a Coert player activates 1 Piecie for 0 Energy | 06 |
| Delluft | | V4 draw | parking fee (+1, Cless +2, Coert/Binti 0); Parkeren Delft win +20 | 06 (Parkeren 05) |
| Dierenasiel | | no-op | pets cost 0; no staying pet -> that player's Mosjes -10 Power | 04-06 |
| Welloe Graveyard | | V4 +20 swap | Welloe-sending cards cost 1 less; can't leave pile (done) | 06 |
| Digital Gaming Stop | | V4 equipment MP | activate a gear Piecie -> draw 1 | 05 |
| Quest Haven | | +10 / +25 | every Quest win +10 | 05 |
| Obby #1 | | trait-based | win +10, loss +10 | 05 |
| Zo is Natuur | | V4 end gain (reducer OK) | reducer only; V4 body gone | 06 |
| Momentum Stabilizer | | cap OK + V4 flag | cap 30 per attack / card / Quest; §6b 40 -> 30 | 06 |
| The Void | | blocks every loss (V4) | Piecies and Snelle can't make a Mosje gain MP | 06 |
| Synergy Chamber | | passive (58-01) | card test only | 06 |

### Hidden info (EFX-07, plan 07)
Ronald Master Chef (Strategic Insight), FPS West (Tactical Analysis + holder reveal), Stookerino, Jantje Jantje... (Piecie), Chef's Special (with Ronald: count only shown to the player), Those Eyelashes (opponent picks their own discard; a human gets the pick when the bot plays it).

## Known gaps closed (ROADMAP / 57-59 SUMMARYs)
Drain Reversal reflect (02) · Skiffa + 2 skipped V4 tests rewritten to the 2.0 Skiffa (05) · Drain Zone +10 Power (04) · `questBonusMP` consumer + its tests retired (05) · Zie je die vs on-draw Place hook (05, hook removed) · Chef's Special / Jantje reveal (07) · chain-tests chain-7 Eendjes fixme (08) · any `test.fixme` naming Phase 60 (08 guard).

## TEST-02 scope note
"Every Card List card" includes the 38 Quests, which have no card-test-library registry yet; plan 08 adds one case per Quest (win path, Card List numbers) plus a 183-card coverage guard.
