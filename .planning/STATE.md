# Project State

**Last updated:** 2026-07-15
**Current phase:** Phase 35 — Places Text-vs-Engine Reconciliation (Round 1): EXECUTING (2/8 waves merged)
**Branch:** card/full-game-text-audit

## ▶ RESUME HERE (2026-07-15 handoff)

**Next command:** `/gsd:execute-phase 35` (continue with wave 3: 35-03)

**Wave 2 (35-02: Arcade + De Box) merged this session:** the prior session was interrupted (token exhaustion) mid-wave, with 35-02's implementation already committed to an executor worktree (`worktree-agent-a7c384a9bc2a5c327`) but not yet verified/merged. Resumed cold: re-ran the full verification sequence (`node --check`, `npm test` 626/626, `npm run test:cards` clean aside from the 2 pre-existing unrelated failures, `npm run test:sim` 0 crashes), wrote `35-02-SUMMARY.md`, committed, and merged into `card/full-game-text-audit` (commit `d7e99ea`) — **with explicit user authorization**, since the auto-mode permission classifier gates worktree merges per-request even on a non-main branch. Worktree removed after merge.

**Wave plan:** 35-01 (PLACE-01,02) ✅ → 35-02 (03,04) ✅ → 35-03 (06,07) → 35-04 (08,09) → 35-05 (10) → 35-06 (11, Synergy Chamber, has a `checkpoint:human-verify` gate) → 35-07 (05,12 — Drain Zone/Void dead-code cleanup + hide) → 35-08 (docs + full phase-gate verification). 35-VALIDATION.md sign-off is `approved`.

**Note for future sessions:** merging an execute-phase worktree branch back into the feature branch requires explicit per-request user authorization (auto-mode blocks it otherwise, even outside `main`) — ask before merging each wave, don't assume standing consent from a prior wave's approval.

**Phase 36 status (unchanged, still ready):** context locked (`36-CONTEXT.md`, commit `f24e7ed`) — game-wide MP cost model redesign (every Piecie/Snelle Piecie/Place/Personal Quest defaults to 0 MP; tribute only where card text explicitly demands it). ROADMAP has Phase 36 formally `Depends on: Phase 35`, so Phase 35 executing first is the natural sequencing. Resume with `/gsd:plan-phase 36` after Phase 35 ships. Mosje ability costs (`abilityCost`) remain explicitly out of scope for Phase 36.

<details>
<summary>Prior handoff (2nd update, superseded)</summary>

**Next command:** `/gsd:discuss-phase 36`.

**Why Phase 35 is paused:** mid-research-followup on Phase 35, Gandoe proposed a bigger idea — flip the whole game's cost model so every Piecie/Snelle Piecie/Place/Personal Quest costs 0 MP by default, and only cards whose text explicitly demands "tribute" (from one named Mosje or all Mosjes, decided per-card) actually deduct MP. Cost display stays purely visual (reuse the Mosje's existing on-field MP number — no new cost-UI element). Explicitly chose to PAUSE Phase 35 (10 locked cards, not yet planned) and discuss/design this new phase FIRST, since it's a game-wide redesign, not a Places-only fix.

**Phase 35 status when paused:** research done (`35-RESEARCH.md`, commit `bc218b1`) + 3 post-research scoping decisions locked (commit `6b97aec`): PLACE-06/07 build a scoped self-charge-then-waive for the specific named Piecies (not a game-wide charge); PLACE-05 (Drain Zone) and PLACE-12 (The Void) are DESCOPED — hidden from all player-facing pools instead of implemented, with their untexted dead-code bugs still cleaned up. Nothing planned/executed yet. Resume with `/gsd:plan-phase 35` once Phase 36 is designed (Phase 36 now formally depends on Phase 35 in ROADMAP.md, so finish 35 first, or re-sequence if that dependency direction turns out to be backwards after discussion).

**Phase 36 (NEW, added this session):** ROADMAP entry added (`.planning/ROADMAP.md`), goal/requirements TBD — needs `/gsd:discuss-phase 36` before planning. Core idea: mpCost fields already exist as data (`src/data/piecies.js` etc.) but are never charged anywhere in the engine (confirmed by Phase 35's research — see `35-RESEARCH.md` Critical Finding 1); this phase would build the actual charging mechanism, default it to 0, then go card-by-card to decide which ones require tribute and from whom.

</details>

<details>
<summary>Prior handoff (superseded, kept for history)</summary>

**Next command:** `/gsd:plan-phase 35` (was at the research gate — user deferred the research decision to a fresh chat).

**What shipped to main earlier today:** the 10-ruling ability-text/engine reconciliation (Ming, Jeffrey, Chris ×2, Jisca, Tuk, Coert KasteLuck, FPS Coert, + Kastelein/Drainer hidden). Merged (`0618941`), version bumped to `ability-text-reconciled` (`c80683c`), pushed + deployed live (verified). 613 unit tests green.

**Phase 35 state (on branch `card/full-game-text-audit`):**
- Round 1 = **Places** audit DONE. All 21 audited: 9 clean, **12 flagged and RULED** interactively with Gandoe.
- Ruling record: `.planning/audits/2026-07-14-places-text-audit.md` (per-card divergence + ruling + file:line reuse targets). **Read this first.**
- Context: `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md` (D-01..D-12).
- ROADMAP Phase 35 added (PLACE-01..12).
- Nothing implemented yet — plan-phase → execute-phase next.
- ⚠ 2 novel mechanics need care: **The Void** (only 1 card-activation per turn — new cross-cutting cap, do LAST) and **Synergy Chamber** (once/turn use a synergy ability without its partner).
- Corrected a stale assumption this session: **gsd-sdk IS installed** (v1.42.3) and a Piecie **mpCost system exists** — the Coert's Caravan todo's "no MP-cost concept" claim was false and has been fixed.

**Deferred (not Phase 35):** audit rounds 2+ (Piecies/Snelle/remaining Mosjes), Alyssa↔Jisca synergy design.

---

**(prior)** Phase 34 COMPLETE — Account Starter-Deck Onboarding & Active Deck — branch feature/phase-34-starter-deck-onboarding (merged to main).

> Note: STATE.md was not maintained during Phases 15–17 (tracked in their phase dirs / ROADMAP only). This header jumps from Phase 14 to Phase 18. Phase 33 (deckout recycle notice + deck-pile/board polish, merged via PR #2/#3) and the 5-duo-starter-deck data commit also landed on main without a STATE.md entry — tracked only in ROADMAP.md and their own commit history.

## Accumulated Context

### Pending Todos
- 2026-07-12-alyssa-jisca-synergy-design.md — DUO_JISCA_ALYSSA's headline synergy is declared but has no effect text and no implementation; needs full design session.
- 2026-07-12-ability-text-engine-reconciliation.md — 9 Mosje ability texts diverge from engine behavior; rule text-vs-code per card (AZN Cless precedent). READY TO IMPLEMENT 2026-07-13: all 10 rulings finalized (9 original + Chris DDR), full reuse-pattern map written into the todo file itself, suggested implementation order included. Nothing coded yet — start fresh session with Ming Natural.
- 2026-07-13-coerts-caravan-binti-discount-mismatch.md — Coert's Caravan (Place) text promises a Binti Piecie MP-cost discount the code never implemented; found incidentally during the 9-Mosje reconciliation.
- 2026-07-13-full-game-ability-text-audit.md — systematic text-vs-code pass needed across ALL Piecies/Places/remaining Mosjes, not just the 9 already flagged; triggered by the Caravan find above.
- 2026-06-11-ts-bulldozer-comeback-reconcile.md (pre-existing)

### Roadmap Evolution
- Phase 32 added (2026-06-14): On-field Mosje Info + Quest Dice Modal Redesign — own on-field Mosjes show Level/traits/ability + active-only synergy on card, remove "Active on field" text, full dice-modal redesign. UI-only.
- Phase 32 extended (2026-06-20): win-clarity UX added on the same branch — instant Level-3 win (engine), plain-language win/defeat reason + battle-log recap in the end screen, "How to Win" panel, dice-modal Mosje stats.
- Phase 34 added (2026-07-03): Account Starter-Deck Onboarding & Active Deck — turns the 5 duo starter decks into the backbone of account onboarding: blocking first-login deck picker, exact-multiset card grant, active-deck concept + lobby switcher, duo-only guest dropdown, duo-only bot pool.

## Phase 34 Progress — Account Starter-Deck Onboarding & Active Deck (COMPLETE)

Branch: `feature/phase-34-starter-deck-onboarding` — 3 plans executed sequentially (data → onboarding modal → lobby rewiring), checker-verified before execution, all green after.

### 34-01: Data + storage foundation (COMPLETE)
- `src/data/playerFacingDecks.js` — `getPlayerFacingDecks()`, an explicit whitelist of the 5 duo decks (DUO_COERT_BINTI, DUO_GANDOE_MICHELLE, DUO_CHRIS_YOURI, DUO_JISCA_ALYSSA, DUO_WEST_CLESS). Single shared accessor so onboarding modal, guest dropdown, and bot pool can never drift out of sync; the 3 original decks (PHYSICAL_FORCE/DIGITAL_CONTROL/ARTISTIC_RHYTHM) stay in `STARTER_DECKS` untouched as bot/test fixtures, just never shown to players.
- `src/multiplayer/expandDeckToCardIds.js` — pure multiset expander (mosjes+piecies+snellePiecies+places+quests, duplicates preserved).
- `src/multiplayer/resolveActiveDeck.js` — pure resolver: activeDeckId → matching deck, else first deck, else null (migration-safe default).
- `src/multiplayer/claimStarterDeck.js` — saveDeck + setActiveDeckId + `addCardsToCollection` with the deck's EXACT multiset (never `seedCollection`, which only grants 1-of-each) — a claimed starter deck is fully rebuildable in the deck builder.
- `userStore.js` — added `getActiveDeckId(uid)` / `setActiveDeckId(uid, deckId)` at `users/{uid}/profile/activeDeckId`.
- `accountSetup.js` — removed the stale `DIGITAL_CONTROL_STARTER_CARDS` auto-seed (had drifted to nonexistent card IDs); new accounts get no cards until they pick a starter deck.

### 34-02: Blocking onboarding modal (COMPLETE)
- `src/ui/onboardingDeckPicker.js` — built on the existing generic `modalManager.showOptionSelect` (`allowCancel:false`), not a bespoke modal, per the project's reusable-selection-modal rule.
- Wired into the lobby's auth-gate handler (extracted to `handleLobbyAuthChange`): a signed-in, non-anonymous user with 0 saved decks blocks on the picker before reaching the lobby; picking calls `claimStarterDeck`.
- `?testOnboarding=1` param-gated test hook drives the real modal DOM with a stubbed claim (no Firebase) — the committed Playwright-testing path, not a fallback.

### 34-03: Lobby rewiring (COMPLETE)
- `src/bot/pickBotDeck.js` — pure true-random pick from `getPlayerFacingDecks()` (mirror allowed), extracted to its own file so it's unit-testable (main.js has import side effects).
- `src/ui/activeDeckPanel.js` + lobby wiring — signed-in users: `#deck-select` hidden, active-deck panel shown (deck name + Mosjes) with a "Change deck" button opening a switcher modal (same `showOptionSelect` pattern) that persists via `setActiveDeckId` and re-renders the panel.
- Guest (anonymous) users: `#deck-select` now populated dynamically from `getPlayerFacingDecks()` — exactly 5 duo options, no originals.
- All hardcoded `'DIGITAL_CONTROL'` player-facing fallback defaults removed (main.js ~124, ~397) → default to `getPlayerFacingDecks()[0].id`.
- `?testActiveDeck=1` / `?testGuestDeck=1` param-gated hooks give the switcher and guest dropdown live Playwright coverage (mandatory, not optional — closes the "setActiveDeckId → reflected in UI" proof that a Firebase-mocked unit test can't provide).

### Verification (final, all green)
- `node --check` clean on every touched runtime/UI file.
- `npm test`: 469/469 (up from 464 baseline; +5 new: duo-deck validity, player-facing-list, expander, resolver, claim helper).
- Playwright: 7/7 — `onboarding-starter-deck.spec.js` (3) + `active-deck-lobby.spec.js` (4).
- `tests/ui/cinema/starter-deck-onboarding-cinema.spec.js` — narrated 5s-beat walkthrough of all 4 new screens (regression/demo, not part of the pass/fail gate above but kept in the suite).
- Bot-vs-bot sim (30 games, run for the *separate* bot-safety-margin change but exercising this branch's `pickBotDeck` too): 0 crashes.

### Decisions
- Deck onboarding is one-time: pick exactly one duo deck; more decks only via the deck builder + booster packs. No shop, no claiming multiple starters (explicit user decision).
- Originals (PHYSICAL_FORCE/DIGITAL_CONTROL/ARTISTIC_RHYTHM) are never deleted from data — only filtered out of player-facing surfaces — so the pre-existing test suite (8+ files hardcoding those IDs) needed zero changes.
- Bot deck selection is true-random over the duo pool, mirror matches allowed (explicit user decision, differs from the old "never mirror the human's deck" behavior).

## Phase 32 Progress — On-field Mosje Info + Quest Dice Modal + Win Clarity

### 32-WIN: Instant Level-3 win + legible end screen + win conditions (COMPLETE — commit a3fe3b3)
- resolveQuest now calls checkVictory → reaching Level 3 declares the win in the SAME action (was deferred to end-of-turn, which let Mosjes overshoot to Level 4)
- checkLevelUp caps level at 3 (`while mp>=100 && level<3`): leftover MP is kept and shown (Lv2/90 + 80 → Lv3/70); level can never reach 4
- describeWin(): raw win enum → plain-language sentence with context (e.g. "Knockout — all of Bot's Mosjes were defeated (last to fall: Binti)"); surfaced in the battle log + reward overlay; `data-win-reason` attribute added for tooling/sims
- Reward overlay embeds the colour-coded battle log + Copy Log button (review the match before returning to lobby)
- Deduped the 13 inline raw-enum "Match Finished" popups into one idempotent handleGameOver (gameOverHandled guard)
- "How to Win" top-bar panel listing the 4 win conditions (Reach Level 3, Knockout, Quest Master, Momentum Domination)
- Dice-roll modal shows the attempting Mosje's stats (level, MP, trait stars; the rolled trait highlighted)
- New tests/engine/instant-win-level3.test.ts (failing-first repro); rewrote the mislabeled full-game LEVEL_3 spec into a real instant-win + battle-log guard
- Verification: node --check clean; 430 unit tests; full-game + chain UI specs green

### Decisions
- Only quests can reach Level 3 (non-quest gains pass `allowLevelUp:false`, capped at 100) — so resolveQuest + the Perfect Sync UI gain are the only level-up surfaces to guard
- Leftover MP is kept on a Level-3 win per user ruling; the win modal fires instantly so the value never lingers on the board
- handleGameOver made idempotent (gameOverHandled) so multiple FINISHED-detection paths can't stack two overlays
- Battle log reuses the global `.log-row` styling inside the overlay; Copy Log exports chronological order (oldest→newest)
- Scratch prototypes (_play32.html, _dice-anim-demo.html, _dice-modal-demo.html) deleted after the dice-modal work landed in the real game

## Phase 23 Progress — Graveyard System

### 23-02: UI rename — showGraveyardModal + board label + card descriptions + docs (COMPLETE)
- showGraveyardModal (was showDiscardViewerModal): reads player.graveyard, header "Graveyard"
- boardRenderer: label.textContent='Graveyard'; reads player.graveyard
- main.js toBoardViewModel: graveyard: player.graveyard; calls showGraveyardModal
- piecies.js, snellePiecies.js: "discard pile" -> "Graveyard" in card descriptions
- developer-handoff.md: Graveyard System section added
- 912 tests passing (0 failures)

### 23-01: Graveyard data layer — graveyardUtils + eliminate welloe + fix revival cards (COMPLETE)
- Created graveyardUtils.js: toGraveyardEntry, addToGraveyard, getGraveyardByType (pure functions)
- markMosjeDefeated: single push to player.graveyard with type:MOSJE, source:defeated (no welloe)
- effect_mosje_reborn: reads from getGraveyardByType(player, 'MOSJE') — no player.welloe
- effect_call_of_welloes: reads mosjeEntries from getGraveyardByType — no player.welloe
- confirmCallOfWelloes: splices from player.graveyard by cardId+type='MOSJE'
- effect_klaar_met_jou: fixed silent hand.pop() → splice + addToGraveyard
- effect_those_eyelashes: fixed silent hand.shift() → splice + addToGraveyard per opponent
- player.discard → player.graveyard renamed across all engine/abilities JS files
- TDD RED-then-GREEN: a6cb720 RED → ed7dfc5 GREEN
- 912 tests passing (0 failures)

### Decisions
- player.graveyard is the single destination for all defeated/discarded/destroyed cards
- addToGraveyard returns new state via spread — no mutation (immutable reducer pattern enforced)
- TS declarative registry files (src/engine/reducers/) left unchanged — separate system

## Phase 22 Progress — Call of the Welloes

### 22-05: Bidirectional destroy — gap closure (COMPLETE)
- Replaced D-17 block: piecieSlots[pIdx] nulled + discard.push(slot.cardId) in same markMosjeDefeated call
- Tightened findIndex: match both cardId === 'piecie_call_of_welloes' AND linkedMosjeCardId === mosje.cardId
- Updated test K: accept null slot (slot gone = link cleared)
- Added test L: confirms piecieStillOnField false + piecieInDiscard true
- TDD RED-then-GREEN: eced576 RED → 33bf6eb GREEN
- 896 tests passing (0 failures)

### 22-04: Mechanic revision — gap closure (COMPLETE)
- Removed returnMosjeToWelloe (wrong silent-return function from Wave 1)
- confirmCallOfWelloes: summons at Level 1, 50 MP unconditionally (NOT restored stats)
- endTurn Piecie persistence guard: piecie_call_of_welloes NOT swept while linkedMosjeCardId is live
- endTurn defeat-on-sweep: markMosjeDefeated replaces returnMosjeToWelloe call (isDefeated=true, discard entry, victory check)
- markMosjeDefeated: clears linkedMosjeCardId on Piecie slot after defeat (D-17)
- piecies.js description corrected: "Level 1, 50 MP ... summoned Mosje is also defeated"
- TDD RED-then-GREEN: f091ee6 RED → b872ce1 GREEN
- 895 tests passing (0 failures)

### 22-02: effect_call_of_welloes + confirmCallOfWelloes + description fix (COMPLETE)
- Cancel-guard + pending-flag activation: effect_call_of_welloes (empty-welloe / no-free-slot guards + _callOfWelloesPending)
- Stat-restoring summon executor: confirmCallOfWelloes (mp/level/traits/statusEffects restored from welloe record)
- Dual tracking: summonedByPiecie on activeSlot + linkedMosjeCardId on piecieSlot
- Description fix in piecies.js: "restoring its MP and Level" replaces "Level 1, 0 MP" stub text
- TDD RED-then-GREEN: 5 new tests (778ad4f RED → cab6ac3 GREEN)
- 896 tests passing (5 new); simulation 100 games 0 crashes

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
- confirmCallOfWelloes reads stats directly from welloe record (no savedState wrapper) — consistent with Wave 1 archive design
- No checkVictory in confirmCallOfWelloes — summon is not a victory-affecting event
- Replaced old effect_call_of_welloes stub (Mosje Reborn passthrough) with real implementation

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
