# Phase 58: Mosje Abilities and Synergies - Research

**Date:** 2026-10-12 · **Discovery level:** 0 (internal patterns only, no new packages) · Source of truth: Card List Mosje tables + Rulings (CONTEXT locked).

## Code map (what exists today)

| Area | Where | State |
|---|---|---|
| Ability dispatch | `src/engine/turnManager.js` `useMosjeAbility` (~L1035) -> `mosjeAbilities[def.abilityId]`; checks cooldown turn, sideways (`canMosjeAct`), `slot.abilityUsedThisTurn`, `canPay(getAbilityEnergyCost)`; pays Energy after success; `unlimitedAbility` skips once-per-turn; Redbull echo lists (NO_DOUBLE / REPROMPT) | 2.0 Energy gate works; no active-player check; no once-per-game / max-N-per-turn data |
| Ability bodies | `src/abilities/mosjeAbilities.js` (875 lines, all in one file) | Almost every body is V4 (see gap table) |
| Energy costs | `src/rules/abilityEnergyCosts.js` `ABILITY_ENERGY_COSTS` (12 keys) + `ABILITY_IN_EFFECT_ENERGY` (Ming Predictor, Jeffrey Gambler) | Correct per Card List; keep |
| Mosje data | `src/data/mosjes.js`; generator (`scripts/obby2/buildMosjesFields.mjs`) owns name/rarity/startMP/abilityDescription/synergyEffect/cost/levels/abilityName/synergyLabel/limitPerDeck/foil. `abilityId`, `autoAbility`, `unlimitedAbility`, `synergyWith` are hand fields (V4) | `synergyLabel` + `synergyEffect` are the 2.0 synergy truth; `synergyWith` is V4 |
| Synergy | `src/engine/synergyResolver.js` (`getActiveSynergies` from V4 `synergyWith`, `hasFoodDoubleSynergy`, `hasAlyssaJiscaSynergy`); turnManager (Alyssa-Jisca +10, `hasBothChrisAndYouri`, DJ +2 on DDR chain, `activateSynergyWaiver`); questLogic `PARTNER_QUEST_SYNERGIES` (Senor West+AZN, Gandoe+Michelle) | All V4 pairs; Synergy Chamber is a V4 once-per-turn waiver |
| Quest hooks | `src/engine/quests/resolveQuestAttempt.js` (49 lines): `gainMP(win)` then `runQuestOutcomeHooks` -> questLogic `applyMosjeFieldEffectsOnQuest` (Michelle, Jeffrey, FPS Coert, V4) | Michelle double = second gain (known gap) |
| Attack triggers | `src/engine/attack/attackTriggers.js` `ATTACK_TRIGGERS {modifyAmount:[flowTaksedReducer], afterLoss:[unstoppableTrigger,...]}` | Flow reduction + Unstoppable already 2.0 |
| Loss pipeline | `src/engine/mp/lossSteps.js` `LOSS_STEPS {beforeLoss, base, reducers, caps}`; `applyMpLossToSlot`, `loseMP(state,pid,slotIdx,amt,source,_redirected,byPlayerId)`; gain funnel `gainMP(state,pid,slotIdx,amt,source)` / `applyGainToSlot(slot,amt,{turnNumber})` | 2.0 |
| Turn flow | turnManager `startTurn` (win check, Energy, resets, cooldown ticks, draw, R1, Places, Alyssa-Jisca V4, KasteLuck V4 roll, `clearOwnerProtections`), `endTurn` (Places, status ticks, Stays sweep, sideways stand-up, Leipe Swap, `expireThisTurnEffects`) | No Mosje trigger registry; V4 triggers inline |
| Piecie activation | turnManager `activatePiecieCore` (~L661): readiness, Void/Jeffrey V4 tag block, pay Energy, effect, Dubbele Temminks, counters, Places, Alyssa-Jisca, `maybeChainChrisDdrCombo` (V4: from HAND, 3/turn, DJ +2), `finishPiecieActivation`; wrapped by `withReactionWindow` | No free-activation primitive; no chain rule |
| Reaction windows | `src/engine/reactions/*` (Phase 57): `withReactionWindow`, `pendingReaction`, `resolveReaction`, 10 moments; Quest roll held in `state.pendingQuestRoll` between roll and resolve | Reuse for DJ reroll and the pause pattern |
| Targets | `resolveOppTargetSlot` (`_pendingTargets.opp_slot_index`, skips fresh), `resolveOwnTargetSlot` (`own_slot_index`), `isFresh`, `markMosjeDefeated` (Welloe) | Reuse |
| Dice | `deckEngine.rollDie` = `Math.random`; Quest dice seeded via `rng` option; main.js `setNextDice` = Quest dice only | Need a seeded ability-die queue for headless card tests |
| UI | `src/main.js` `handleUseAbility` -> `runAbilityActivation` (L1349-2132, ~780 lines of V4 per-ability prompts); `src/ui/boardRenderer.js` `.mosje-ability-btn` hidden when `autoAbility` | Replace with one data-driven input flow |
| Bot | `src/bot/botDriver.js` ability loop (~L273), `strategy/abilityTiming.js` | Must keep finishing games; smarter use = Phase 61 |
| Card tests | `tests/ui/cards/card-registry.js` `ABILITY_REGISTRY` (8 V4 entries) + `card-test-runner.js` (`playThen:'ability'`) + `mosje-abilities.spec.js`; hooks in main.js `window.__testHooks` (setMosjeOnField, setHand, setEnergy, setPiecieOnField, setPendingTargets, setNextDice, getGameState, setActivePlace, clearEntryProtection, ...) | Rebuild for all 32 |

## Per-Mosje gap table (Card List 2.0 vs engine today)

Kind: A = activated (button, Energy), T = trigger, P = passive. ED = Example Deck (1 Fighting, 2 Digital, 3 Artistic).

| # | Mosje (id) | ED | Kind | 2.0 text (short) | Engine today | Gap |
|---|---|---|---|---|---|---|
| 1 | Alyssa Fissa (`mosje_alyssa_fissa`) | 1 | T | Place destroyed by your card -> +20 (1/turn) | +5 per hand card (button) | rewrite; hook `triggerPlaceDestroyedEffects` |
| 2 | Gandoe Wizard (`mosje_gandoe_wizard`) | 1 | T start | 1-2 -10 self; 5-6 +10 Power this turn | button, MP table | rewrite |
| 3 | Michelle (`mosje_michelle`) | 1 | T quest win | 1-3 half, 4-6 double, ONE gain | second gain/loss after base; Gandoe kicker | rewrite (known gap) |
| 4 | AZN Cless (`mosje_azn_cless`) | 1 | T end | 1 discard 1 (owner picks); 6 draw 2 + 10 | button even/odd | rewrite |
| 5 | Parkour West (`mosje_parkour_west`) | 1 | T/P | Quest win +20; Flow reducer | button; Flow reducer done | quest part |
| 6 | Alyssa Bulldozer (`mosje_alyssa_bulldozer`) | 1 | P | Unstoppable | `unstoppableTrigger` done; V4 button fn | remove V4 fn, mark passive, fix cinema fixme |
| 7 | Coert Tech (`mosje_coert_tech`) | 2 | A draw step | 1 Energy +1 card, up to 2/turn | any time, unlimited | draw-step timing, 2/turn |
| 8 | The Hacker (`mosje_hacker`) | 2 | A | 1 E: top 3 any deck reorder + 10 | +10 + draw, 5-turn cooldown | rewrite |
| 9 | FPS Coert (`mosje_fps_coert`) | 2 | T quest win | Phys/Tech win, 6: +30, chosen opp -15 | first opp slot | target choice |
| 10 | FPS West (`mosje_fps_west`) | 2 | A + holder | 1 E: look hand, name next type, +20 / -10; synergy +10 both, reveal 1/turn | +70/-20 immediate | rewrite (known gap) |
| 11 | The Drainer (`mosje_drainer`) | 2 | T opp start | each opp turn start: chosen opp Mosje (>0 MP, not fresh) -5 | button DRAIN status | rewrite |
| 12 | Chris All-Rounder (`mosje_chris`) | 2 | A | 3 face-down -> free-activate one + 15 | unlock only, no MP | rewrite (known gap) |
| 13 | Tuk Healer (`mosje_tuk_healer`) | 3 | A | 1 E: own Mosje +20 | +10 | value |
| 14 | Jisca (`mosje_jisca`) | 3 | T after activation | 1/turn: 4-6 free ready Piecie + opp -15; 1-3 self -10 (not at 0) | button 5-6 | rewrite + chain rule |
| 15 | DJ 80/20 (`mosje_dj_8020`) | 3 | A reroll | 1/turn reroll any one die | +10 + quest bonus | rewrite (reroll window) |
| 16 | Binti (`mosje_binti`) | 3 | A + holder | 1 E + discard Piecie: chosen opp -10, opp discards their choice; food +10 w/ Coert Tech | any card, first opp slot, first card; FOOD double | rewrite |
| 17 | Cless Teacher (`mosje_cless_teacher`) | 3 | T each activation | 5-6 (4-6 w/ Historian) draw 1 + own Mosje +5 | +3 quest bonus button | rewrite |
| 18 | DDR Chris (`mosje_chris_ddr`) | 3 | T each activation | 5-6 free ready Piecie, 2/turn | from HAND, 3/turn, DJ +2 | rewrite + chain rule |
| 19 | Gandoe Destroyer | - | A once/game | 4 E: lowest-level opp -> Welloe (you choose tie) | tie by MP auto | tie choice, fresh |
| 20 | Jeffrey Strongman | - | P | your Quest wins +10; no MP-giving Piecies | only Jeffrey's own wins; FOOD/RESTORE tag block | rewrite |
| 21 | Ronald Chef | - | A | 2 E: look hand, set 1 aside face-down, returns end of their next turn | lock + 3-turn cooldown | rewrite |
| 22 | Ming Natural | - | A | reveal top: Piecie free (no wait) or hand; else draw + 15 | close; uses V4 free path | chain-safe free activation |
| 23 | Ming Predictor | - | A | look top of one Quest stack; may pay 1 E bottom | no stack choice, no Energy | in-effect Energy (known gap) |
| 24 | Martin Historian | - | A draw step + holder | instead of draw: top 5 any deck reorder + 15; end of turn draw 2; synergy | V4 graveyard retrieve | rewrite |
| 25 | Senor West | - | A + holder | name type, reveal top, +draw 2 +10 / -10; synergy Phys +15, Quest peek | close (V4 keys) | inputs, synergy wiring |
| 26 | Jeffrey Gambler | - | A in-effect E | stake 1-2 E roll ... | V4 quest block | rewrite (known gap) |
| 27 | Youri | - | A + holder | 1 E: same-turn activation (still pay) + draw 1; synergy | 3/game cap, 20 MP legacy tests | rewrite + fixmes |
| 28 | The Tactician | - | A | 2 E: set any Mosje 10-75 until end of turn | V4 transfer | rewrite (EFX-06, E26) |
| 29 | Ronald Mastermind | - | A | 2 E: Piecie from discard as if ready, back to discard | once per game, free | rewrite |
| 30 | Coert KasteLuck | - | T start | 4-6 draw 1 + 5 | same-turn-activation grant | rewrite |
| 31 | Martin Driver | - | P + A | wins +15; Pit Stop 1 E discard 2 draw 3 + 10 | level-scaled gain | rewrite |
| 32 | Tuk Architect | - | A | 1 E top 5: 2 to hand, rest bottom any order | close | bottom order input |

Not in 2.0 (hidden; leave alone, never in decks): `mosje_amplifier`, `mosje_coert_kastelein`, `mosje_binti_creator`.

Synergy pairs 2.0 (holder <- partner, from `synergyEffect` + Mosje ids in `synergyLabel`): Martin Historian <- Cless Teacher; Senor West <- AZN Cless; Youri <- DDR Chris; FPS West <- FPS Coert; Binti <- Coert Tech. Piecie-held texts (Ronald Kip, Chef's Special, Bowie & Stormey, Tony, ViannaPoes) are Phase 59 and reuse `isHolderTextActive`.

## Design choices (Claude's discretion)

- **One function per file:** each 2.0 ability/trigger in `src/abilities/mosje/<camelName>.js`; `mosjeAbilities.js` becomes re-exports (dispatch map by `abilityId`).
- **`src/rules/mosjeAbilityRules.js`** (data): per abilityId `{ kind: 'activated'|'trigger'|'passive', per: 'turn'|'game'|null, maxPerTurn, ownTurnOnly, inputs: [...] }`. `useMosjeAbility`, the UI button and the bot read it.
- **Trigger registry** `src/engine/mosje/mosjeTriggers.js`: `startOfTurn`, `oppStartOfTurn`, `endOfTurn`, `questWinAmount` (modifier before the ONE gain), `questSuccess`, `piecieActivated` (ctx.free), `placeDestroyed`, `cardPlayedFromHand`; runner `runMosjeTriggers(state, hook, ctx)`.
- **Trigger choices:** `state.pendingChoice = { playerId, choiceKind, options, triggerId, ctx }` + `resolvePendingChoice(state, value)`; one legal option = auto-pick, no pause. UI/bot settle it like `pendingReaction`.
- **Draw step pause:** `state.pendingDrawStep` only when a draw-step option exists (Coert Tech, Martin Historian); `finishDrawStep(state, playerId, choices)` does the normal draw (or Time Control), Coert extra draws, then the rest of `startTurn`.
- **Free activation:** `activatePiecieFree(state, playerId, source, opts)` — no Energy, sets `ctx.free = true` so `piecieActivated` triggers (Jisca, DDR, Cless) skip; gates (Jeffrey, Level 2) still apply.
- **Dice queue:** `src/engine/dice/testDiceQueue.js`; `rollDie` takes the next queued value first; test hook `setNextAbilityDice` (testMode only).

## Validation Architecture

- **Engine unit tests (vitest, `npm test`):** one test file per plan group importing the real `.js` modules (`tests/abilities/mosjes-*.test.ts`), dice via `vi.spyOn(Math,'random')` or the dice queue; E26 in `tests/engine/tactician.test.ts`; synergy + Chamber in `tests/engine/synergy-2-0.test.ts`; chain rule in `tests/engine/free-activation-chain.test.ts`; E-index guard `tests/meta/e-tests-index.test.ts` asserts every E1-E30 (+E7b) id appears in a test title.
- **Card tests (Playwright headless, card-test-library):** `tests/ui/cards/mosje-registry-2-0.js` (32 entries, Example-Deck 18 first) driven by `tests/helpers/mosjeCardTest.js` via `seedOfflineSession` + `GAME_URL_TEST` + test hooks; assert on-screen MP (`readMP`) plus Energy/hand/Power via `getGameState` where the 2.0 board doesn't show them yet (Phase 63).
- **§6b edge cases:** Jisca + DDR on one activation, free Piecie no second chain; Synergy Chamber makes a holder text work without its partner (`tests/ui/cards/mosje-chains-2-0.spec.js`).
- **Gates per plan:** `for f in src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js <new src/ui/actions/*.js>; do node --check "$f"; done`, then `npm test`. Playwright only via a temporary `playwright.headless.tmp.config.js` (copy with `headless: true`, deleted after). Never `npm run test:sim`.
