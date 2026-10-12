# Phase 57: Piecies, Snelle, Places and Reaction Windows - Research

**Researched:** 2026-10-12 (planner, targeted code read) · **Confidence:** HIGH for code map, MEDIUM for reaction-window design (new subsystem)

No new packages. Level 0 discovery: all work is inside the existing `.js` engine.

## Code map (what exists today)

| Area | Where | 2.0 status |
|---|---|---|
| Slot count | `src/engine/table/tableRules.js` `PIECIE_SLOT_COUNT = 3` | OK (Phase 55) |
| Place a Piecie | `turnManager.js` `playPiecie` (~L580) | Counts `activePlace` as a slot when the player owns it (V4); error text says "4". Sets `canActivateOnTurn = turnNumber + 1` (turnNumber is a ROUND counter, so +1 = owner's next turn). Chris+Youri / KasteLuck set it to the current round. |
| Readiness reads | `activatePiecie` (L752), `quests/isReadyPiecieSlot.js`, `main.js` `toPiecieCards` (~L2940), `botDriver.js` L342, `strategy/planPiecieActivations.js` L38 | Three of them fall back to `playedOnTurn + 1` (the KNOWN GAP). Writers: `mosjeAbilities.js` L509/544/699 (Youri/Chris unlock), `main.js` L978/2131. |
| Activation end | `activatePiecie` (~L890) | V4: `persistUntilEndOfTurn` cards stay face-up until the `endTurn` sweep (L490-512). 2.0: discard at once unless the card **Stays** (`stays` field, Phase 53). |
| Stays data | `src/data/piecies.js` `stays`: `endOfNextTurn` (10), `startOfNextTurn` (2), `custom` (Kleine Taks, Call of the Welloes); `snellePiecies.js` Blensen! `endOfTurn` | No engine reads `stays` except `quests/questConditions.js` `staysPiecie` (fallback to def text: KNOWN GAP). 9 non-Stays Piecies still carry V4 `persistUntilEndOfTurn: true`. Chris DDR / ability chains write `persistUntilEoT: true` (turnManager L150, mosjeAbilities L345/L652). |
| Snelle play | `turnManager.js` `playSnellie` (~L924) | Counts `activePlace` as a slot (V4); Snelle sits in the slot until the `endTurn` sweep (V4). Cooldown block, Energy pay, off-turn play already there (`canPlayerActNow` returns true for Snelle). |
| Places | `playPlace` (L1316) puts the Place **face-down in a Piecie slot**; `activatePlace(slotIndex)` (L674) pays and calls `setActivePlace` (gameState.js L269, which destroys an existing Place). `destroyActivePlace` (L294) sends it to `activePlacePlayedBy`'s discard. `placeEffects.js` L500 reads `activePlaceCanActivateOnTurn`. Bot Phase F (`botDriver.js` L362-385), UI Activate button (`boardRenderer.js` L288), `main.js` L2478 handler. | All V4: replace with play-from-hand. |
| Welloe pile | `victoryChecker.js` L169 push; removed only by `piecieEffects.js` `effect_mosje_reborn` (L566), `effect_call_of_welloes` (L843) + `turnManager.confirmCallOfWelloes` (L1002). `deckEngine` never reads it. | Missing: "not while Welloe Graveyard is the Place" exit block. |
| Existing interrupt | `main.js` `showDamageInterruptModal` / `humanTakesDamageOrElimination` (~L680-750): state-diff of a precomputed bot step, PROTECT-tag Snelle, re-run `driveBotTurnSteps` after a play. Offline only, human-only. | Replace with the engine reaction-window framework. |
| Snelle reaction flags | `snelleEffects.js` sets `state._snelleFlags.*` consumed in `activatePiecie` / loss pipeline (`mp/lossSteps/protectorSnelleReducer.js`). | Effects stay V4 until Phase 60; the framework only offers the cards. |
| Attack / Quest | `actions/attackMosje.js` (pure, returns `{state, ok}`); `quests/rollQuestAttempt.js` returns `{ok, state, pending}` then `resolveQuestAttempt(state, pending, choices)`. Callers: `botDriver.js` L412-424, `ui/actions/runAttackFlow.js`, `ui/actions/runQuestFlow.js`; dry-run in `strategy/chooseMosjeAction.js` L40. | Window hook points. |
| Quest "+N" bonus | `questPrepBonus` written by `piecieEffects.js` L492/502/553/1038/1095 and `mosjeAbilities.js`; never read by `rollQuestAttempt` (2.0 uses `player.questExtraDice` via `QUEST_DICE_SOURCES`). | chain-1 / chain-6 fixmes. |
| Headless Activate bug | `tests/ui/mechanics.spec.js` VIS-01/02/08 `test.fixme` (56-09): the Activate button on an own ready Piecie is not found headless. Rendered in `boardRenderer.js` L275 when `piecie.canActivate` (`main.js` `toPiecieCards`: `viewerOwns && isLocalTurn && !activated && turnNumber >= canActivateOnTurn`). Root cause unknown: must be reproduced first (CLAUDE.md). |

## Design decisions (Claude's discretion, per CONTEXT)

1. **Readiness:** keep the stored `canActivateOnTurn` (a round number = owner's next turn) as the readiness value, read only through one function `isPiecieReady(entry, turnNumber)`; delete the `playedOnTurn + 1` fallback everywhere (a face-down entry without the field is not ready). Cheapest correct fix; fixtures already set the field.
2. **Stays lifecycle:** on activation, `finishPiecieActivation` either discards the card or keeps it face-up with `{ stays: true, staysEnd, activatedRound }`. `sweepStaysSlots(state, playerId, 'start'|'end')`: `startOfNextTurn` leaves at the owner's next `startTurn`; `endOfNextTurn` at the owner's `endTurn` when `turnNumber > activatedRound`; `endOfTurn` (Blensen!) at the end of the current turn for **both** players' slots; `custom` only via `discardPiecieSlot` (Call of the Welloes link check moves there; Kleine Taks / "then discard" texts are Phase 59).
3. **Reaction windows = pending state + resolve step** (pure, serialisable, works for UI, bot and later online):
   - `state.pendingReaction = { id, moments[], responderId, actorId, eligible[cardIds], preview, action }`.
   - `withReactionWindow(state, actorId, action, run)`: runs the action on a clone, `detectReactionMoments(before, after, ctx)`, asks `getEligibleReactions`; if any card is eligible it returns the **unchanged** state plus `pendingReaction` (`ok: true, pending: true`); otherwise the normal result.
   - `resolveReaction(state, responderId, cardId|null)`: plays the Snelle (or passes), clears the window and replays `action` with `skipReactions: true` (so the same window can never reopen: no deadlock). A Jensen! played as a reaction opens one nested `jensenPlayed` window for the other player before the replay.
   - Quest: `rollQuestAttempt` opens an `afterQuestRoll` window with `action: { type: 'continueQuest' }` and stores the roll in `state.pendingQuestRoll`; `resolveQuestAttempt` refuses while a window is open. Dry-runs pass `skipReactions: true`.
   - Acting-player moments (Rulings): `beforeOwnQuestRoll`, `afterOwnQuestRoll`, `afterOwnPiecieActivation`; queued after the defender window.
   - Moments: `targeted`, `wouldLoseMp`, `attacked`, `toWelloe`, `afterQuestRoll`, `afterPiecieActivation`, `jensenPlayed`. Detection by state diff of the responder's Mosjes (MP drop / level drop / sideways / Welloe pile grew) plus the action type.
   - Eligibility: Snelle in the responder's hand whose data `reactionMoments` intersects the window's moments, a free Piecie slot, `canPay` cost, not a cooldown turn, not `_snelleBlocked`. Card "Needs:" checks are effect-side (Phase 60).
   - Bot policy `chooseReaction`: play the cheapest eligible card when the preview shows a getemt or a Welloe-pile move on one of its Mosjes, else pass. Human: `modal.showOptionSelect` (existing generic modal) with a Pass option. Remote online responder: auto-pass (online is hidden in the 2.0 lobby; KNOWN GAP to Phase 64).
4. **Places:** `playPlace` = own turn, not cooldown, `!state.activePlace`, pay `cost`, `setActivePlace`, PASSIVE at once, no slot. `activatePlace` and `type: 'PLACE'` slot entries deleted.
5. **Welloe Graveyard:** one gate `canLeaveWelloePile(state)` used by Reborn, Call of the Welloes and `confirmCallOfWelloes`.

## Snelle -> moment map (from Card List "Play when ..." texts)

| Snelle | reactionMoments |
|---|---|
| Emergency Healings, The Protector, Drain Reversal | `wouldLoseMp` |
| Perfect Dodge | `attacked` |
| Not Today! | `toWelloe` |
| Je Weet Niet | `afterQuestRoll` |
| Lucky Cóin | `afterQuestRoll`, `afterOwnQuestRoll` |
| Sleutelpuntje | `beforeOwnQuestRoll` |
| Dubbele Temminks | `afterOwnPiecieActivation` |
| Counter Strikka, Jensen! | `targeted` |
| Jammertje Gepakt! (Piecie activations only, Rulings), Gevalletje Klakkeloos | `afterPiecieActivation` |
| Frenssen! | `jensenPlayed` |
| Momentum Rush, Bijna Welloe, Ff Haaltje Nemen, Jantje Jantje..., Chillingsvoorbij!, Blensen! | `[]` (any time) |

## Common pitfalls
- `turnNumber` is a round counter (gameState.js L52), not a per-player turn counter.
- Engine functions deep-clone (`JSON.parse(JSON.stringify)`); `pendingReaction` must stay plain JSON (no functions).
- Effects using `Math.random` give a different result on replay than in the dry-run; detection is a preview only, the replay is the truth.
- `npm test` does not load `src/main.js` or `src/ui/*`: syntax-check each UI file separately.

## Validation Architecture
- Framework: vitest (`npm test`, ~121 files) + Playwright (`visual` project is headed by default -> run through a temporary `playwright.headless.tmp.config.js` copy with `headless: true`, deleted afterwards, 55-07/56-09 pattern).
- Quick check per task: `npx vitest run <file>`. Full gate per plan: syntax loop + `npm test`.
- Handoff tests: E22 `tests/engine/piecie-timing.test.ts`, E23 `tests/engine/snelle-slot.test.ts`, E24 `tests/engine/place-play.test.ts`, E25 `tests/engine/stays.test.ts`; TABLE-04 `tests/engine/reaction-windows.test.ts` + `tests/bot/reaction-bot.test.ts`; TABLE-06 `tests/engine/welloe-pile.test.ts`; U6 `tests/ui/snelle-reaction.spec.js`; U7 `tests/ui/place-play.spec.js`; Activate-button repro `tests/ui/piecie-activate-headless.spec.js`; SHELL-04 `tests/engine/v4-leftovers-removed.test.ts` + `tests/meta/fixme-reasons.test.ts`.
- No `npm run test:sim`. See 57-VALIDATION.md.

## Open questions (not resolvable from the docs; planned around, listed for Gandalf)
1. RESOLVED (Gandalf, Card List Rulings): windows are offered to BOTH players; the acting player also gets `beforeOwnQuestRoll`, `afterOwnQuestRoll`, `afterOwnPiecieActivation`. Several windows for one action open from a queue, defender first.
2. RESOLVED: Jammertje Gepakt! reacts to Piecie activations only.
3. "Targeted" is detected by an opponent Piecie/Snelle changing one of your Mosjes; true target declaration per effect comes with Phase 59/60.
4. "Needs:" gates on reaction Snelle (Perfect Dodge, Counter Strikka, Jammertje, Lucky Cóin) are not checked by the window in Phase 57 (effect-side, Phase 60).
5. Online rooms: a remote responder's window auto-passes until online 2.0 work.
</content>
</invoke>
