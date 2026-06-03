# Project State

**Last updated:** 2026-06-03
**Current phase:** Phase 22 IN PROGRESS - Call of the Welloes (Plan 01 complete)
**Branch:** plan/phase-22-call-of-welloes

> Note: STATE.md was not maintained during Phases 15–17 (tracked in their phase dirs / ROADMAP only). This header jumps from Phase 14 to Phase 18.

## Phase 22 Progress — Call of the Welloes

### 22-01: returnMosjeToWelloe + endTurn sweep (COMPLETE)
- Engine return-path primitive: `returnMosjeToWelloe` exported from turnManager.js
- Deep-clone helper: pushes archived mosjeSlot (minus summonedByPiecie) to welloe[], nulls activeSlot
- No defeat side-effects: no isDefeated, no discard entry, no checkVictory
- endTurn sweep: after piecieSlots sweep, iterates activeSlots for summonedByPiecie === 'piecie_call_of_welloes'; returns Mosje when anchor Piecie absent, leaves in place when present
- TDD RED-then-GREEN: 5 new tests (e77caf7 RED → ba07463 GREEN)
- 891 tests passing (5 new); simulation 100 games 0 crashes

### Decisions
- Sweep reassigns `state` via `let` (endTurn already declares let state) — no inline mutation needed
- returnMosjeToWelloe uses `delete archived.summonedByPiecie` before push — clean archive

## Phase 21 Progress — Quest Behaviors + Cleanup

### 21-01: Quest behaviors (C) + dead-code/doc cleanup (A) (COMPLETE)
- Bucket C — data-driven quest behaviors via static quest-def fields read by `resolveQuest`:
  - `drawOnSuccess: 2` on quest_artistic_expression + quest_late_night_questing → resolveQuest draws N deck→hand on success (FRESH state, placed after the MP block)
  - `opponentLoseMP: 30` on quest_elimination_challenge → loseMP on opponent's first active Mosje on success, gated on `!baseQuestMpBlocked` (The Void skips it)
  - quest_req_hack_mainframe id fix: Hacker/FPS −1 threshold now checks `cardId` (was the always-undefined `mosjeId`)
- Bucket A — deleted dead `effect_jensen` + `effect_lucky_coin` from snelleEffects.js (no card referenced them); removed their blocks from the unrun `tests/cards/test-snelleEffects.js` (kept the file — it has live-effect tests); refreshed stale card-reference.md rows (Geen Raad + Huisbaas now implemented; dropped DEFERRED notes on the 4 wired quests)
- 11 new tests; 867 total; sim 100 games 0 crashes

### Decisions
- resolveQuest draw/elimination reference the FRESH `state.players[playerId]`, not the stale `player` from the top of the function (gainMP/loseMP reassign `state`)
- Kept test-snelleEffects.js (a `.js` file vitest doesn't run) rather than delete — it holds meaningful live-effect tests; only removed the two dead-stub blocks
- Left FPS West / Ronald Chef (STUB-16) doc status unchanged — their blockers are genuine UI primitives, out of this engine phase's scope

## Phase 20 Progress - Leipe Swap

### 20-01: Leipe Swap temporary MP double-swap (COMPLETE)
- Reworked the old unused swap Piecie into `piecie_leipe_swap`: free, level 1+, booster-only, rarest tier `★★★★` (not a new 5-star category), persists until end of turn.
- Browser/imperative path: activation modal picks one own Mosje and one opponent Mosje; `effect_leipe_swap` swaps only `mp` by direct assignment and stores `_leipeSwap`.
- End-turn path: `endTurn` swaps the two recorded slots' current MP back on the swapper's turn and clears `_leipeSwap`; levels banked mid-turn stay.
- Rarity cap: `RARITY_COPY_LIMITS["★★★★"] === 1` (★★★★ already caps at 1 per deck).
- Declarative registry twin renamed to `leipe-swap.ts` with new identity and no-op effects because the TS executor has no interactive double-swap primitive.
- Old Emergency Swap references removed from `src/`, `tests/`, and `docs`.
- Verification: 856 tests passing; simulation 100 games, 0 crashes / 0 timeouts.

## Phase 19 Progress — UI-Modal Card Completions

### 19-01: FPS West Tactical Analysis — guess game (COMPLETE)
- Reworked into a Geen Raad-style guess: pick an opponent hand card, guess its type; correct +70 MP / wrong −20 MP, routed through gainMP/loseMP (visible/logged)
- Removed the dead `opponentHandPeeked` flag + the old draw; old abilityDescription archived as a comment
- main.js FPS_WEST_TACTICAL_IDS block reuses showOpponentHandCardSelect → showCardTypeSelect → showRevealedCard, stores fpsWestGuessCorrect in _pendingTargets
- 5 new tests; 842 total; sim 100 games 0 crashes; Ronald Kip stacking test passed

### 19-02: Ronald Chef Strategic Insight — hand-card lock (COMPLETE)
- 20 MP (via loseMP) to pick an opponent hand card and lock it (unplayable) until your next turn; 3-turn cooldown (`strategicInsightCooldown`); removed the dead `_ronaldPeek`
- New mechanic: `isHandCardLocked` guard in all 4 play-from-hand functions (playPiecie/playSnellie/playMosje/playPlace); startTurn ticks the cooldown + expires the lock when the locker's turn returns
- main.js RONALD_CHEF_INSIGHT_IDS pick-and-lock block; old abilityDescription archived
- 8 new tests; 850 total; sim 100 games 0 crashes

### Decisions
- FPS West test starting MP set to 25 (not the plan's illustrative 50) so the +70 correct case (→95) stays clear of the auto-level-at-100 edge — gainMP always runs checkLevelUp
- Lock guards return each play function's real failure shape (`{ state: <local clone>, success:false, error }`); lock matched by cardId (duplicates: first copy blocked) — documented v1 limitation
- `isHandCardLocked` is a shared helper (1 def + 4 call sites) per CLAUDE.md "build once, reuse"

## Phase 18 Progress — Dead-Flag Card Fixes

### 18-01: Dead-flag Piecie fixes + persistence (COMPLETE)
- Those Eyelashes: `_snelleBlocked` now stores the blocked opponent's playerId; playSnellie rejects that player's Snelle plays for the turn
- Battle Concert: `_battleConcertActive` redirects Alyssa's quest-failure MP to an opponent's first active Mosje (once), Alyssa untouched; guarded both onFailure and legacy failMP paths with a `failRedirected` local + gated on `!baseQuestMpBlocked` (The Void still nullifies)
- Tweede Kans: `_rerollGranted` consumed into both quest dice flows as +1 skiffaRerolls
- All three cards gained `persistUntilEndOfTurn: true`; startTurn clears all three flags
- 8 new tests; 829 total passing; simulation 100 games 0 crashes/0 timeouts

### 18-02: Dead-flag Mosje ability rewrites (COMPLETE)
- Ronald Master Plan: play a Piecie free from own discard (once per game, `masterPlanUsed`), resolve its effect; persists on field if persistent, else to discard. Added `import * as piecieEffects` + `import { PIECIES }`
- Ming Future Sight: 10 MP, reveal top General Quest, optional send-to-bottom via `_pendingTargets.mingSendToBottom`
- Tuk Perfect Placement: 15 MP, peek top 5, take 2 to hand, bottom 3; abilityDescription face-down clause removed
- All three consume real UI selections via `_pendingTargets` (West/Binti modal pattern in main.js handleUseAbility)
- 8 new tests; 837 total passing; simulation 100 games 0 crashes/0 timeouts; no `_masterPlanPeek`/`_mingPredictorPeek`/`_architectPeek` flags remain

### Decisions
- showCardChoice supports only single picks, so Tuk uses two sequential picks (filter first from second list) — plan's documented fallback
- useMosjeAbility try/catch means UI-gated abilities (Ronald/Ming/Tuk) cleanly return {success:false} for the bot/sim path (no `_pendingTargets`), same as Binti — no crashes
- Ronald rewrite required `import * as piecieEffects` in mosjeAbilities.js; verified one-way (piecieEffects.js does not import mosjeAbilities.js) — no circular import

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
