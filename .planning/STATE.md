# Project State

**Last updated:** 2026-05-31
**Current phase:** Phase 14 COMPLETE — 14-01, 14-02, 14-03 all complete
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

### 12-05: Deferred Comments + card-reference.md Full Update (COMPLETE)
- DEFERRED comment in effect_emergency_swap with full implementation path (ability registry dispatch + showOptionSelect modal)
- Huisbaas PARTIAL/DEFERRED comments: Place destruction intact; deck-search-modal named as blocking primitive
- DEFERRED (STUB-16) comments at FPS West opponentHandPeeked and Ronald Chef _ronaldPeek set sites
- docs/card-reference.md: deferred status added to legend; all 16 STUB entries updated; Phase 12 notes section added
- 691 tests passing (no change — comments only)

### 12-04: UI-Gated Piecie Interactions — Bagga of Greed, Welloe Force, MP Adjuster (COMPLETE)
- Bagga of Greed: full-hand discard picker via showCardChoice modal after activation (STUB-11)
- Welloe Force: 3-turn engine-level damage redirect wired in loseMP(); target picker via showOptionSelect; auto-select when 1 target; cancel when 0 targets (STUB-14)
- MP Adjuster: temporary value picker (20/40/60/80/100 MP) via showOptionSelect; reverts at next turn start; _mpAdjusterPending replaces hardcoded mp=50 (STUB-15)
- Post-approval reworks per user: Bagga shows full hand, MP Adjuster is temporary, Welloe Force is engine-level 3-turn redirect with ★★★★ / 40 MP cost
- 691 tests passing (no new tests; browser-DOM interactions verified via Task 3 checkpoint)

### Decisions
- negateNextSearch guard placed inside if (isOpponentTriggered) — natural turn draws never negated
- STUB-05 needed no code change — doubleNextPiecie block already exists and works
- STUB-07 is entirely UI-side — engine comment enhancement is the complete deliverable for this wave
- SNOEIERTJE_COST push removal confirmed safe (no test relied on it)
- Dierenasiel guard is documentation-only — engine has no cost gate; dierenasielWaiver logs and documents UI responsibility
- Synergy Chamber reduction applied as pre-MP-adjustment (stateForAbility clone with s.mp += 5) rather than changing every individual ability function
- stateForAbility clone only created when synergyDiscount > 0 AND mosjeDef.abilityCost > 0
- Bagga of Greed shows full hand (not just 2 drawn cards) — user-requested; more strategic discard choice
- MP Adjuster is temporary: delta reverted at next turn start via startTurn() cleanup — one-turn boost not permanent override
- Welloe Force is engine-level 3-turn redirect in loseMP(); mpCost 40 / ★★★★ rarity; auto-selects single target, cancels if no targets
- main.js flag-check paths (Bagga/Welloe/MP Adjuster) are NOT unit-tested; browser-DOM modal awaits cannot be mocked; Task 3 checkpoint is accepted functional verification substitute
- Emergency Swap DEFERRED: ability registry already exists; blocking primitive is UI modal for opponent Mosje selection
- Huisbaas PARTIAL: Place destruction implemented; deck-search-for-Place requires new searchDeck primitive
- FPS West + Ronald Chef DEFERRED: engine flags set correctly; blocking primitive is opponent hand reveal UI in boardRenderer.js
- card-reference.md deferred status added to legend; Phase 12 Wave 5 is the final audit wave — all stubs now either wired or tagged

## Phase 14 Progress

### 14-01: Physical Equipment Piecies — Dumbbells, Boxing Gloves, Skipping Rope (COMPLETE)
- Created tests/effects/physical-equipment-scaling.test.ts (17 tests, TDD RED-then-GREEN)
- Added PHYSICAL-EQUIPMENT block to src/data/piecies.js (3 card definitions)
- Added effect_dumbbells, effect_boxing_gloves, effect_skipping_rope to src/abilities/piecieEffects.js
- Dumbbells: flat 20 MP to FIGHTING Mosje; 5 MP base to others; draw 1 at FIGHTING level 3 only
- Boxing Gloves: requires physical >= 2 trait; 25 MP standard; GANDOE tag → 40 MP + MP_LOSS_HALVED turnsLeft:1
- Skipping Rope: questPrepBonus +1 if FIGHTING Mosje + draw 1; draw 1 only for non-FIGHTING
- 708 tests passing (17 new tests; no regressions)

### 14-02: Protein Shake + Boxing Ring (COMPLETE)
- Added piecie_protein_shake to src/data/piecies.js (PHYSICAL-EQUIPMENT, FOOD tags, rarity ★★)
- Added effect_protein_shake to src/abilities/piecieEffects.js (+25 MP to FIGHTING; +35 MP when Boxing Ring active)
- Added place_boxing_ring to src/data/places.js (trigger ON_QUEST, goodFor FIGHTING, badFor DIGITAL/ARTISTIC)
- Added effect_boxing_ring to src/abilities/placeEffects.js (ON_QUEST: +15 MP / GANDOE +25; END_PHASE: FIGHTING +10 / non-FIGHTING -5)
- Boxing Ring bypass added to resolvePlaceEffect before trigger guard (handles both triggers via questCard discriminator)
- 718 tests passing (10 new tests; no regressions)

### 14-03: The Gym CLESS Patch + Card Reference Docs (COMPLETE)
- Patched effect_the_gym with isCless branch: CLESS Mosjes (physical < 2) gain +20 MP instead of -10
- Priority chain: physical >= 3 > physical >= 2 > isCless > default applyDamage(-10)
- Updated The Gym description in places.js to mention CLESS-tagged Mosjes bonus
- Documented all 6 Phase 14 cards in docs/card-reference.md (counts: Piecie 64→68, Place 16→17)
- 721 tests passing (3 new CLESS tests; no regressions)

### Decisions
- Dumbbells flat 20 MP (not level-scaled) — PLAN.md truths take precedence over PATTERNS.md getPhysicalMP helper
- GANDOE check: cardId.toLowerCase().includes('gandoe') — matches existing Coert's Caravan pattern
- MP_LOSS_HALVED turnsLeft:1 for Boxing Gloves (not 2 like Bowie & Stormey) — 1-turn only per plan spec
- Boxing Ring bypass before trigger guard: handles dual ON_QUEST/END_PHASE triggers without switch case
- effect_boxing_ring questCard discriminator: questCard !== undefined = ON_QUEST path; else END_PHASE path
- CLESS branch placed as else-if after physical >= 2 — physical trait bonus takes priority for CLESS Mosjes with physical >= 2
- isCless uses cardId.includes('cless') — consistent with effect_coerts_caravan id.includes('coert') pattern

## Phase 10 Complete (prior)

All 5 balance plans executed and verified (BAL-01 through BAL-05):
- BAL-01: Digital Equipment MP scaling (Keyboard/Mouse/Controller — 15/25/40 MP by Mosje level + DIGITAL subtype)
- BAL-02: Physical Force SUBSTANCE fallback (Grammetje Pieter + Tikker; Tikker fixed flat +40 MP + QUEST_BLOCKED)
- BAL-03: Artistic Rhythm SUBSTANCE fallback (Larry Zegeltje + Grammetje Pieter)
- BAL-04: Quest economy (all successMP +20, all failMP capped at -20 max)
- BAL-05: Deck-out reshuffle rule (empty deck → reshuffle discard, draw 1, skip next turn)

653 tests passing. 0 simulation crashes. 0 timeouts.
