# Phase 56: Attacking and Quests - Research (planner's targeted code read)

**Date:** 2026-10-11 · No researcher agent ran; this is the planner's own code map.
**Sources:** 56-CONTEXT.md (locked), Card List "Quests" (lines 69-132), Handoff §2c-§2e, §6a, 55-0x SUMMARYs.

## Code map (what exists today)

| Area | Where | Notes for Phase 56 |
|---|---|---|
| Act gate | `src/engine/mp/canMosjeAct.js` | `!!slot && !isDefeated && !sideways`. New actions must call it (54-11 gap). |
| Power | `src/engine/mp/getPower.js` | level row + `powerBoost` + `powerBoostThisTurn`, ×10, min 0. No Place power yet (Phase 60). |
| Loss funnel | `loseMP(state, playerId, slotIndex, amount, source, _redirected, byPlayerId)` in `src/engine/mpManager.js` -> `applyMpLossToSlot` -> `LOSS_STEPS` (`src/engine/mp/lossSteps.js`) -> getemt | Fresh fizzle uses `isOpponentSourced(state, owner, byPlayerId)`. Level-up protection is NOT checked by the funnel (good: jabs/cards hit it). Use source `'ATTACK'` / `'QUEST'` / `'QUEST_JAB'`. |
| Gain | `gainMP(state, playerId, slotIndex, amount, source)` | Blocked by The Void; level-up sets `levelUpProtected` + `levelledUpTurn`. |
| Fresh | `src/engine/fresh/isFresh.js` (`slot.entryProtected === true`) | Cleared at owner's turn start (`clearOwnerProtections`). |
| Level-up protection | `slot.levelUpProtected` | Set in `applyGainToSlot`/`normalizeSlotMp`, cleared in `clearOwnerProtections`. |
| This-turn expiry | `src/engine/turn/expireThisTurnEffects.js` (end of turn, all slots) | Add `actedThisTurn`, `attackedThisTurn`, `takenByAttacksThisTurn`, `unstoppableFired`, `flowFired`. |
| Cooldown | `src/engine/turn/isCooldownBlocked.js` + `COOLDOWN_ERROR` | Both actions refuse on a cooldown turn. |
| Quest data | `src/data/quests.js` (48 rows; 38 with `stack`, 10 V4 rows `disabled: true`), `src/data/questBands.js` | 2.0 fields: `stack, band, rollTrait (physical/resilient/mental/technical/creative/social/best/none), costId, costText, win, lose, extras, text`. Trained trait lives in `costId` (`physical_2`, `technical_2`, `social_2`). |
| Quest stacks | `state.questStacks[stackId] = { deck: [questId], faceUp: questId, tokens: 0, discard: [] }`, built by `src/engine/setup/buildQuestStacks.js`; `QUEST_STACK_IDS` in `setupRules.js` | Phase 55-01 built it; nothing resolves it yet. |
| Slot traits | `slot.traits` = current level row (`refreshLevelTraits`) e.g. `{ physical: 3, resilient: 1 }` | `best` = max value; missing trait = 0 stars -> 1 die (min 1). |
| Mosje family | `slot.subtype` FIGHTING/DIGITAL/ARTISTIC; `slot.name` ("Gandoe, The Destroyer", "FPS Coert", "AZN Cless, ...") | Named bonuses match the name word (Gandoe/Youri/Coert/Cless). |
| Piecie slots | `player.piecieSlots[3]` entries `{ cardId, faceDown, activated, playedOnTurn, canActivateOnTurn }` | "Ready" = face-down and `canActivateOnTurn <= turnNumber` (Phase 57 formalises). Piecie `tag` (`food`, `substance`, `gear`, `pet`). "Larry / Zegeltje" is one Piecie card. |
| Dice | `rollDie()` in `deckEngine.js` (Math.random, no injection) | New `rollQuestDice(count, rng)` with injectable rng for seeded tests. |
| +1 die today | `state._snelleFlags.questDiceBonus` (Sleutelpuntje, `snelleEffects.js:245`) | Keep as a die source (consume on roll). Places with dice in Card List: The Gym (Physical), Arcade (Technical), De Box (Gandoe/Michelle/Tuk on Physical), Tesla (Coert/Binti every Quest). Piecie "+1 die on one Quest this turn" -> `player.questExtraDice` (Phase 59 cards set it). |
| V4 quest engine | `turnManager.js`: `attemptGeneralQuest` (577), `attemptPersonalQuest` (619), `playPersonalQuest` (733), `activatePersonalQuest` (774), `questsAttemptedThisTurn` reset (262); `gameState.js` `sharedGeneralQuestDeck` (34, 191); `questLogic.js` (1141 lines): `getFirstActiveMosje*`, `checkTraitRoll`, `getQuestDiceThreshold`, `canAttempt*`, `getGeneralQuestBlockReason`, `resolveQuest` (308), `quest_req_*` (665-1080), `resolvePersonalQuestSideEffects` | `resolveQuest` also runs post-quest hooks still needed until Phases 58/60: armed `questBonusMP`, `getPartnerSynergyQuestBonus`, `applyMosjeFieldEffectsOnQuest`, `applyPlaceEffectsOnQuest`, `applyPiecieFieldEffectsOnQuest`, `checkVictory`. Extract these into one exported `runQuestOutcomeHooks` before deleting `resolveQuest`. |
| Bot | `src/bot/botDriver.js` Phase E `runQuestPhase` (lines ~497-600) uses `attemptGeneralQuest`, `resolveQuest`, `rollBotQuestDice`, `assessQuestRisk`, `questOdds` | Replace with per-Mosje action choice (attack vs Quest by expected MP swing). |
| UI | `game.html` buttons `#btn-general-quest`, `#btn-personal-quest`; `main.js` handlers ~1260-1600 (General) and ~2544-2740 (Personal), button state ~1676-1724, test hook `injectQuestToTopOfDeck` (~1077); `modalManager`: `showOptionSelect`, `showMosjeSelect(slots, onSelected, questDef, overrides)` (options with `disabled`), `showInfo`, `showConfirm` | Reuse `showOptionSelect` / `showMosjeSelect`; no new modal type. |
| Attack triggers in data | Card List: Unstoppable (Alyssa, The Bulldozer: taksed 30+ in one turn -> +25 MP, +10 Power until the end of her owner's next turn, ruling 2026-10-11), Flow (Parkour West: once per turn, taksed 30+ -> loses 20 less), Welloe Force (Stays; opponent attacks yours -> attacker loses 15; V4 flag `state._welloeForceActive.ownerId`), Momentum Diefje (attack makes a Mosje lose MP -> attacker +20), MP Hemorrhage (mark first attacked Mosje), Zo is Natuur (Resilient ★★+ lose 10 less from attacks; today's reducer is the V4 cap-25), Momentum Stabilizer (cap 30, already in `LOSS_STEPS.caps`) | Diefje/Hemorrhage 2.0 card effects (Phase 59) don't set the hook flags yet -> KNOWN GAP; hooks tested by setting the flag. Perfect Dodge / Drain Reversal / Emergency Healings / The Protector = Phase 57/60 reaction windows. |

## Design (Claude's discretion, per CONTEXT)

- New folders, one exported function per file: `src/engine/actions/` (gate + attack), `src/engine/attack/` (trigger registry + triggers), `src/engine/quests/` (dice, bands, stacks, conditions, costs, extras, attempt).
- **Two-step Quest attempt** so the UI/bot can choose after seeing the dice: `rollQuestAttempt(state, playerId, { slotIndex, stackId, costChoice, dieChoices, rng })` -> `{ state, ok, error?, pending }` (gate, condition, pay cost, mark acted, count dice, roll, band result); then `resolveQuestAttempt(state, pending, choices)` -> state (win/lose MP, extras, jab, tokens/replace, hooks, checkVictory). A refused attempt (gate/condition/cost) changes nothing and does not use the action.
- **Gated conditions / costs** keyed by the existing `costId` values (21 ids) in one `QUEST_CONDITIONS` / `QUEST_COSTS` table.
- **Quest-row extras** keyed by quest id in `QUEST_EXTRAS` (`extraDice(ctx)`, `onWin(ctx)`, `onFail(ctx)`, `jab: true|'nonDigital'|'mostMp'|'larryOnly'`).
- **Seeded dice:** every roll takes `rng: () => number`; tests pass a fixed sequence.
- Per-slot flags: `actedThisTurn` (one action), `attackedThisTurn`; per-player counters `piecieActivationsThisTurn`, `cardsDrawnThisTurn` (reset at turn start).

## Validation Architecture

- **Engine (vitest, `npm test`)** — the real `.js` modules on `makeEngineState` states with `createMosjeSlot` slots and seeded rng: attack.test (E12, E10 attack side), attack-triggers.test, quest-dice.test (E15), quest-bands.test (E16), quest-stacks.test (E17), one-action.test (E13 + `canMosjeAct` gate + cooldown), quest-attempt.test (E18 + PLAY-03 any Mosje any stack), quest-costs.test (E20), quest-jab.test (E19, E10 jab side), quest-extras.test (PLAY-07).
- **Bot (vitest)** — bot-actions-2-0.test (legal attack/Quest choice, never a fresh/protected target) + `offlineGame.smoke.test.ts` (Example Decks finish).
- **Static guard** — `tests/engine/v4-leftovers-removed.test.ts` extended: no V4 Quest identifiers left in `src/`.
- **Live board (Playwright, headless temp config, never `npm run test:sim`)** — `tests/ui/attack-and-quest-2-0.spec.js` + the 55-07 `test.fixme` Quest specs re-enabled.
- **Syntax** — `node --check` per touched UI file, one file per call.

## Rulings applied (Card List "Rulings (2026-10-11, Phase 56)")
- Mid-turn draws from an empty deck draw nothing (no reshuffle, no cooldown) -> `drawFromEffect` (56-04).
- Build Gadget / Speed Run are conditions; Calculate Odds = card type; Form Alliance / Shotje Obby winner picks, never fresh; no-attempt when condition/cost fails; fresh may Quest, no Place dice; Parkeren Delft 10.

## Pitfalls
- Removing `resolveQuest` before `main.js`/`botDriver.js` stop importing it breaks the browser silently (node --check does not resolve imports) -> UI and bot migrate first (56-05/06), removal after (56-07/08).
- `JSON.parse(JSON.stringify())` clone pattern: functions in `pending` must not hold state references; keep `pending` plain data.
- `loseMP` returns a new state: never mutate the old `player` after the call.
- Do not tune band numbers (handoff §8.5, balancing parked).
