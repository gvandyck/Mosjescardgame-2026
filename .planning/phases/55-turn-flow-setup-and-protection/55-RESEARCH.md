# Phase 55: Turn Flow, Setup and Protection - Research (planner code map)

**Done by:** planner (no separate research run) · **Date:** 2026-10-11 · **Branch:** obby-2.0
**Discovery level:** 0 (existing codebase patterns, no new packages, no installs → no package legitimacy gate)

## Code map (verified by reading, line numbers approximate)

| Concern | Where today | 2.0 change (plan) |
|---|---|---|
| Game creation | `src/engine/gameState.js:24 createInitialGameState(playerConfigs, roomCode)`; `activePlayerId = firstPlayerId = playerConfigs[0]`; V4 `sharedGeneralQuestDeck` | die roll, `questStacks`, R5 flag (55-01) |
| Starting Mosje | `createPlayerState` → `pickRandomMosjeId(deckDef.mosjes)`; `buildDeck(deckDef,{excludeCardIds:[starter]})` drops EVERY copy | use `deckDef.startingMosje` (Example Decks have it, `src/data/exampleDecks.js`); remove one copy only (55-01) |
| Opening hand | `gameState.js:87` and `initializeGame:193` `deck.splice(0, 6)`; warn if not 6 | 3 (55-01) |
| Mosje slot / fresh | `src/engine/mp/createMosjeSlot.js` sets `entryProtected: true` (U8). Setup Mosje is therefore already fresh | keep field name `entryProtected` as the fresh flag; add `isFresh` (55-04) |
| Turn start | `turnManager.js:240 startTurn`: checkWin → gainEnergy → V4 `skipNextTurn` branch (recursive) → per-turn resets → entryProtected clear (BEFORE triggers) → Welloe Force tick → checkVictory → Place START → **+10 trickle** (:360) → Alyssa+Jisca +10 → KasteLuck → draw (`phaseDrawCard`) | reorder per CONTEXT; trickle gone; R5; R1; flag clear last (55-02) |
| Turn end | `turnManager.js:473 endTurn`: Place END, status ticks, Snelle/persist sweep, sideways stand-up, questPrepBonus reset, Leipe Swap back; next player = `(index+1) % n`, `turnNumber++` when `nextIndex===0` | next player via `getNextPlayerId`, round++ when play wraps to `firstPlayerId` (55-01); `expireThisTurnEffects` (55-02) |
| Deck-out | `turnManager.js:420 phaseDrawCard`: reshuffle `graveyard`, draw 1, `skipNextTurn = true`, `_deckOutEvent`. `welloePile` already separate (54-01) | `cooldownTurn` flag instead of skip; gates (55-03) |
| Summon | `turnManager.js:1206 playMosje`: max 2 slots, no cost, no own-turn check, restores `savedState` | pay `cost` Energy, own turn, not on cooldown (55-03) |
| Energy | `src/engine/energy/{payEnergy,canPay,gainEnergy,energyRules}.js`; `payEnergy(state,pid,amount)` → `{state,success,error}` | reuse |
| Level-up stamp | `mp/applyGainToSlot.js:17`, `mp/normalizeSlotMp.js:14` set `slot.levelledUpTurn` | add `levelUpProtected = true`; clear at owner turn start (55-02) |
| Power | `mp/getPower.js` = level-row power + `powerBoost` | + `powerBoostThisTurn`, expired at end of turn (55-02) |
| U8 guards | `mpManager.js:74-88` loseMP fizzles when `entryProtected && activePlayerId !== owner && !source.includes('COST')`; `placeEffects.js:17 applyDamage` skips; `piecieEffects.js:57,70` hostile damage/status skip; `mosjeAbilities.js:84,279,584`; `gameState.js:230 getOpponentMosjes` marks `protected`; bot `botDriver.js:86,157,161,242`; UI badge `boardRenderer.js:80,102` | add "opponent-sourced" check (not active-player based), Places skip fresh for gains too, remove COST bypass (55-04) |
| First-turn Quest lock | `questLogic.js:153` (`turnNumber===1 && playerId===firstPlayerId`); test `tests/engine/first-turn-quest-lock.test.ts`; hook comment `main.js setTurnNumber` | delete (55-05) |
| Piecie slots | `gameState.js:101` 4 nulls; `turnManager.js normalizePiecieSlots(player, 4)` ×12; `main.js:3660-3662`; `boardRenderer.js:206,237 slice(0,4)`; helpers `tests/helpers/makeEngineState.js:26`, `testHelpers.js` | `PIECIE_SLOT_COUNT = 3` (55-05) |
| "Active Mosje" | `piecieEffects.js getFirstActiveSlotIndex` (48 uses), `getFirstActiveMosjeTagSlotIndex`; `mosjeAbilities.js` (15 uses, incl. opponent `getFirstActiveSlotIndex(opp)`); `_pendingTargets.own_slot_index` honoured by only kannetje_melk / dikke_jonko / tikker; UI picker hard-coded list `main.js:~2802`; quest path `questLogic.js:156 getFirstActiveMosje`, `main.js:1283,2547` | own/opp target resolvers + registry + UI/bot choice (55-06). Quest acting Mosje = Phase 56 (ROADMAP 56 known gap 54-11) |
| Bot | `src/bot/botDriver.js:262 driveBotTurnSteps`: Phase 0 plays first hand Mosje if a slot is free (no cost), then Piecies, activations, Place, Quest | affordable summon, cooldown = only place Piecies (55-03); own-target choice (55-06) |
| UI turn start | `main.js startGame:1107` → `createInitialGameState` → `startTurn`; `logTurnTrickle` at :665/815/857/1118/1238; deck-out notice :1617-1628 "skips their next turn" | die roll log, no trickle log, cooldown text |
| Quest data | `src/data/quests.js` 38 quests with `stack: FIGHTING|DIGITAL|ARTISTIC` | `state.questStacks` (55-01) |

## Decisions taken under Claude's Discretion (record in SUMMARYs)
1. **Quest stack shape** (Phase 56 builds on it): `state.questStacks = { FIGHTING|DIGITAL|ARTISTIC: { deck: [questId…], faceUp: questId|null, tokens: 0, discard: [] } }`. V4 `sharedGeneralQuestDeck` stays until Phase 56 replaces Quest resolution — KNOWN GAP (fix in Phase 56).
2. **First player**: `rollOpeningDice` rolls 1 d6 each, rerolls ties; `createInitialGameState(configs, room, { firstPlayerId })` override skips the roll (tests, testMode). `firstPlayerId` = die winner; `turnNumber` stays a round counter (++ when play wraps back to `firstPlayerId`).
3. **R5**: state-level one-shot `state.firstTurnDrawSkipPending = true` set only by `createInitialGameState`; consumed by the first player's first draw step. Hand-built fixtures never skip a draw.
4. **R1 order** (follows `docs/obby-2.0/tools/obby_desk_sim.py`): cheapest by `cost` from hand; only if hand has no Mosje, cheapest from deck, then shuffle the deck. Ties: first found. The R1 Mosje stays fresh (the turn-start flag clear only touches slots that were on the field before R1).
5. **Cooldown flag**: `player.cooldownTurn = true` whenever that player draws from an empty deck (reshuffle). Cleared at the end of that player's own turn. A deck-out during the opponent's turn therefore makes the player's next own turn a cooldown turn. `_deckOutEvent` marker kept (UI notice).
6. **Fresh** = `slot.entryProtected === true` (no rename; 30+ call sites). `isFresh(slot)` helper. Opponent-sourced = loss/target caused by a player other than the owner (explicit `byPlayerId` when known, else `activePlayerId !== owner`).
7. **Level-up protection**: boolean `slot.levelUpProtected` set beside `levelledUpTurn`; cleared at the owner's turn start. The attack gate that reads it is Phase 56.
8. **Own-Mosje choice**: `_pendingTargets.own_slot_index` (existing key) is the one contract; `resolveOwnTargetSlot` / `resolveOppTargetSlot` read it; a data registry lists the effect ids that need it; UI asks via the existing `modal.showTargetSelector`; bot picks via `pickBotOwnTarget`.

## Validation Architecture
- Framework: vitest (`npm test` = `vitest run`, covers `tests/**/*.test.ts` incl. `tests/bot/offlineGame.smoke.test.ts` = the Node bot-vs-bot Example-Deck smoke).
- Builders: `tests/helpers/makeEngineState.js` (hand-built state), `createInitialGameState` with `{ firstPlayerId }` for setup tests. Randomness: inject via `vi.spyOn(Math, 'random')` or the override option.
- Static guards (grep-based vitest, pattern of `tests/engine/no-level-zero.test.ts`): no `skipNextTurn`, no trickle, no `firstPlayerId` Quest lock, no 4-slot literal, no `getFirstActiveSlotIndex` in `src/abilities`.
- Playwright: headless only, via a temporary headless copy of the `visual` project config (54-16 method), deleted after. Never `npm run test:sim`.
- Handoff tests: E2 (55-03), E9 (55-02), E11 (55-01), E21 (55-03). See 55-VALIDATION.md.
