# Project State

**Last updated:** 2026-05-31
**Current phase:** Phase 12 — In progress (5 plans, 5 waves) — Plan 03 complete
**Branch:** audit/unimplemented-stubs-and-mechanics

## Phase 11 Progress

### 11-01: Bot Driver — driveBotTurn (COMPLETE)
- Created src/bot/botDriver.js — pure 7-step heuristic bot turn driver
- Imports only engine and data — zero multiplayer imports
- 8 unit tests in tests/bot/botDriver.test.ts; 661 total tests passing

### 11-02: Offline Lobby Entry Point (COMPLETE)
- Added "Play Offline vs Bot" checkbox to lobby form (index.html)
- Wired offline submit branch in initLobbyPage() — writes mosjes:offline to sessionStorage, navigates to game.html?offline=true&player=player_1
- Bot deck: random STARTER_DECKS element with id != human's deckId
- Online create/join path completely unaffected

### 11-03: Offline Game Init Branch (COMPLETE)
- isOffline flag declared from urlParams.get('offline') in initGamePage() scope
- readOfflineData() module-level helper reads sessionStorage 'mosjes:offline'
- player_1 else branch: when isOffline=true, calls startGame(human, humanDeck, 'Bot', botDeck)
- syncManager and Firebase listeners never called in offline mode
- 661 tests passing, online path completely unaffected

### 11-04: Bot Turn Trigger in End Turn Handler (COMPLETE)
- import { driveBotTurn } from './bot/botDriver.js' added to src/main.js
- btn-end-turn handler: isOffline && activePlayerId==='player_2' triggers 600ms setTimeout
- setTimeout calls driveBotTurn, re-renders board, calls startTurn for human's next turn
- End Turn button disabled during bot's 600ms window, re-enabled after
- Online End Turn path completely unchanged; 661 tests passing

### 11-05: Offline Game Over + Smoke Test (COMPLETE)
- Added renderAndCheckWin() helper inside initGamePage() — renders then checks isOffline && FINISHED
- Replaced renderFromState(gameState) with renderAndCheckWin() in all 7 human action handlers (17 total occurrences: 1 def + 16 calls)
- Offline game now shows result overlay when any human action triggers FINISHED
- Created tests/bot/offlineGame.smoke.test.ts — 3 smoke tests drive full games to FINISHED, 0 crashes
- Fixed useMosjeAbility in turnManager.js: try/catch around ability dispatch prevents Binti throw when bot calls without pending targets
- 664 tests passing

### Decisions
- Offline mode entry: checkbox short-circuits Firebase, stores sessionStorage 'mosjes:offline' with name/deckId/botDeckId/playerId='player_1'
- Bot deck selection filters STARTER_DECKS, fallback to STARTER_DECKS[0]
- driveBotTurn is a pure function: follows 7 priority steps, calls same turnManager.js functions as human
- Test file uses .ts extension (vitest only picks up tests/**/*.ts per vitest.config.js)
- isOffline declared at urlParams scope (not inside startGame) so Plan 04 btn-end-turn listener can read it for bot turn trigger
- Bot turn trigger: triple guard (isOffline && player_2 active && not FINISHED) ensures online path is untouched
- startTurn called after driveBotTurn returns because driveBotTurn already calls endTurn internally
- renderAndCheckWin: single wrapper function handles FINISHED detection for all human action handlers, avoiding scattered if-checks
- Smoke test file uses .ts extension (vitest only picks up tests/**/*.ts)
- useMosjeAbility try/catch: abilities requiring UI input (Binti discard) gracefully return {success:false} rather than throwing

## Phase 12 Progress

### 12-01: Stub Engine Wiring — MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD (COMPLETE)
- Wired three status effects into loseMP() and markMosjeDefeated()
- Fixed effect_ff_haaltje_nemen ReferenceError; corrected 6 zero-value push sites
- 17 new tests added; 681 tests passing

### 12-02: negateNextSearch + STUB-05/07/08 Cleanup (COMPLETE)
- Wired negateNextSearch guard in phaseDrawCard() with isOpponentTriggered parameter
- STUB-05 confirmed implemented (doubleNextPiecie) — comment added
- STUB-07 documented with explicit UI consumption point in main.js handleActivatePiecie()
- STUB-08: dead SNOEIERTJE_COST push removed from effect_snoeiertje
- 3 new tests added; 684 tests passing

### 12-03: Dierenasiel 0-MP Guard + Synergy Chamber Cost Reduction (COMPLETE)
- dierenasielWaiver constant documented at useMosjeAbility engine call site (STUB-09)
- Synergy Chamber cost reduction pre-adjustment wired before fn() dispatch (STUB-10)
- placeEffects.getSynergyChambercostReduction() call established in turnManager.js
- 7 new tests added (Tests 17–23); 691 tests passing

### Decisions
- negateNextSearch guard placed inside if (isOpponentTriggered) — natural turn draws never negated
- STUB-05 needed no code change — doubleNextPiecie block already exists and works
- STUB-07 is entirely UI-side — engine comment enhancement is the complete deliverable for this wave
- SNOEIERTJE_COST push removal confirmed safe (no test relied on it)
- Dierenasiel guard is documentation-only — engine has no cost gate; dierenasielWaiver logs and documents UI responsibility
- Synergy Chamber reduction applied as pre-MP-adjustment (stateForAbility clone with s.mp += 5) rather than changing every individual ability function
- stateForAbility clone only created when synergyDiscount > 0 AND mosjeDef.abilityCost > 0

## Phase 10 Complete (prior)

All 5 balance plans executed and verified (BAL-01 through BAL-05):
- BAL-01: Digital Equipment MP scaling (Keyboard/Mouse/Controller — 15/25/40 MP by Mosje level + DIGITAL subtype)
- BAL-02: Physical Force SUBSTANCE fallback (Grammetje Pieter + Tikker; Tikker fixed flat +40 MP + QUEST_BLOCKED)
- BAL-03: Artistic Rhythm SUBSTANCE fallback (Larry Zegeltje + Grammetje Pieter)
- BAL-04: Quest economy (all successMP +20, all failMP capped at -20 max)
- BAL-05: Deck-out reshuffle rule (empty deck → reshuffle discard, draw 1, skip next turn)

653 tests passing. 0 simulation crashes. 0 timeouts.
