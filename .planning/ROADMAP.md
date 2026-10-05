# Card Implementation Roadmap

**22 phases** | **~43 unique cards + multiplayer features + deck reworks** | **Sequential execution**

---

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Implement Mosje Abilities | All 4 Mosjes have working abilities | IMPL-PF-M1, M2, AR-M1, M2 | 4 abilities working |
| 2 | Implement Piecies | All 26 unique Piecies functional | IMPL-PF-P1:12, AR-P1:13 | 26 Piecies resolve effects |
| 3 | Implement Snelle Piecies | All 6 unique instant cards functional | IMPL-PF-S1:4, AR-S1:4 | 6 instant effects work |
| 4 | Implement Places | All 5 unique Places functional | IMPL-PF-PL1:3, AR-PL1:3 | 5 places resolve correctly |
| 5 | Implement Quests | All 14 unique Quests functional | IMPL-PF-Q1:7, AR-Q1:5 | 14 quests work (rolls, rewards) |
| 6 | Integration & Launch | Testing, lobby, deployment | IMPL-TEST, LOBBY, SIM, REG | Both decks playable in lobby |
| 7 | Leaderboard | Global player leaderboard with win/loss/streak stats | LB-STATS, LB-PAGE, LB-NAV, LB-PROFILE, LB-DISCONNECT | Leaderboard page live, stats update after every match |
| 8 | Complete Partial Cards | Every card marked partial/deferred in card-reference.md fully working in the browser game | CARD-COMP-1 through CARD-COMP-N | All partial cards resolve correctly, no stubs remaining |
| 9 | UI & Engine Bug Fixes | Fix 5 playtesting bugs: quest roll threshold, Dubbele Dosis lifecycle, Senor West MP floor, Lucky Coin activation order, DJ Lucky Mixer turn modifier | BUG-01 through BUG-05 | All 5 bugs fixed, tests pass, no regressions |
| 10 | Deck Balance | Fix game stalling � insufficient MP generation across all 3 decks causes games to end in deck-out or stalemate instead of someone reaching Level 3 | BAL-01 through BAL-N | All 3 decks can reliably progress to Level 3; deck-out eliminated; game length reduced to target range |
| 11 | Bot Opponent | Add a basic AI opponent for offline single-player matches. Bot plays Piecie cards, activates Places, attempts Quests, levels its Mosje, and uses Mosje abilities. Players opt in via "Play Offline" checkbox in room creation. | BOT-01 through BOT-05 | Player can start and complete a full game against the bot; bot makes valid moves every turn; no Firebase required for offline mode |
| 16 | Eendjes Voeren Place | Transform Eendjes Voeren from a Piecie into a Place: resilience aura (all resilient traits max ??? while active) + Michelle +10 MP each End Phase. | EEV-01 through EEV-05 | place_eendjes_voeren in places.js; getMosjeTrait maxes resilient; Physical Force deck updated; piecie retired to booster-only |
| 17 | Place Recovery Mechanics ? | Unified per-player graveyard (Places + Mosjes + Piecies all go to owner's discard). Rework Slecht Gezet (ownership-aware: return own / destroy opponent's), rework Huisbaas (return Place from own discard), add new snelle Chillingsvoorbij! | PLACE-REC-01/02/03 + ENGINE-01/02/03 | DONE � 821 tests pass, 0 sim crashes. Engine unified, 3 recovery cards live |
| 18 | Dead-Flag Card Fixes ? | Wire 6 cards whose effect flags were set but never consumed. Wave 1 (engine + persistence): Tweede Kans reroll, Battle Concert redirect, Those Eyelashes Snelle-block � all persist on field. Wave 2 (UI-pick): Ronald Master Plan (play Piecie from discard), Ming Future Sight (quest peek/bottom), Tuk Perfect Placement (peek 5 take 2, face-down removed). | DEADFLAG-01 through 06 | DONE � 837 tests pass, 0 sim crashes. All 6 cards match their descriptions; no dead flags remain |
| 19 | UI-Modal Card Completions ? | Wire the 2 remaining "deferred � needs UI" Mosje abilities to existing modals (the reveal flags `opponentHandPeeked` + `_ronaldPeek` were dead). Plan 01 � **FPS West**: Geen Raad-style guess-a-card-type-in-opponent's-hand game, correct +70 MP / wrong -20 MP (old text archived). Plan 02 � **Ronald Chef**: pay 20 MP to pick an opponent hand card and LOCK it (unplayable) until your next turn, 3-turn cooldown. (Geen Raad was already implemented � card-reference was stale. Emergency Swap ? reworked into Leipe Swap, Phase 20.) | UICARD-01/02 | DONE � 850 tests pass, 0 sim crashes. FPS West guess game (+70/-20) live; Ronald hand-card lock + 3-turn cooldown enforced across all 4 play paths; both dead flags gone |
| 20 | Leipe Swap (temporary MP swap) ? | Rework the unused Emergency Swap into **Leipe Swap** (*leip* = Dutch slang for sick/crazy; rarest tier ???? = 1 per deck; no MP cost; stays on field 1 turn). On your turn, pick one of your Mosjes + an opponent Mosje and swap their MP; at the END of your turn swap the *current* MP back. Levels banked off the borrowed progress stick; leftover MP is handed to the other Mosje (double-swap). Imperative engine: effect + endTurn revert + target modals; rename old emergency_swap refs across both card systems + docs. | LEIPE-01 | DONE � 856 tests pass, 0 sim crashes. Leipe Swap swaps/reverts MP, banked levels persist, max-rarity deck cap set, old refs renamed |
| 21 | Quest Behaviors + Cleanup ? | **Bucket C** � wire 3 engine-doable quest behaviors via static quest-def fields read by `resolveQuest`: draw-on-success (Artistic Expression + Late Night Questing draw 2), Elimination Challenge (opponent -30 MP on success), Hack Mainframe Hacker/FPS -1 threshold id fix. **Bucket A** � delete dead `effect_jensen`/`effect_lucky_coin` stubs + tidy the unrun `.js` test, refresh stale `card-reference.md` rows (Geen Raad, Huisbaas, the 4 wired quests). (Bucket D � 3-way outcomes + turn-action gates � deferred.) | QUEST-01/02/03 + CLEAN-01 | DONE � 867 tests pass, 0 sim crashes. Draw-on-success + Elimination -30 MP + Hack FPS bonus wired; dead stubs removed; card-reference rows corrected |
| 22 | Call of the Welloes | Implement the full Call of the Welloes Piecie effect: summon a Mosje from the Welloe pile into a free active slot (level+MP restored from welloe record); Piecie stays on field as the anchor � if the Piecie leaves play the summoned Mosje immediately returns to the Welloe pile. Requires: UI pick (showOptionSelect), new `returnMosjeToWelloe` engine helper, end-of-turn sweep check, `linkedMosjeCardId` field on piecieSlot, `summonedByPiecie` field on mosjeSlot. No free slot ? effect silently cancelled. Welloe pile empty ? effect silently cancelled. | CALLW-01 through CALLW-04 | effect_call_of_welloes functional; summon + return lifecycle correct; 0 sim crashes; all tests pass |
| 26 | Debug Logging System | Add structured in-game event logging so MP changes, level-ups, and quest resolutions are clearly visible during play. Every MP gain/loss shows its source (card/effect), every level-up logs before/after state, quest rolls log threshold vs result. Output appears in the existing game log panel. Pure observability layer — no engine changes. | DBLOG-01 through DBLOG-03 | MP changes show source in log; level-ups show before/after; quest rolls show threshold vs result; log panel displays all events during a real game |
| 28 | Visual UI Tests | 10 Playwright tests covering the most historically buggy and mechanically complex areas: Dubbele Dosis lifecycle, Leipe Swap revert, quest MP floor, quest threshold display, Youri ability (single-piecie + 3-use cap), Not Today! interrupt, Laat me chillen! lifecycle, quest 2/2 cap. Every test asserts MP before/during/after. | VIS-01 through VIS-10 | All 10 tests pass headed; MP assertions cover every effect; log assertions confirm every action; no existing tests broken |
| 25.1 | Animation Overflow Fix | Animations (quest success flash, fail shake, level-up celebration) get clipped by overflow:hidden on .card and inner containers. Fix: apply animation classes to the slot wrapper (.mosje-slot) instead of the card element — slot wrappers have no overflow clip so glows and bursts render freely. ~5 lines JS + CSS selector update. | ANIMFIX-01 | All card animations visible outside card boundaries; no clipping on any slot type; node --check clean; 920+ tests pass |
| 25 | UI Polish & Feel | (E1) Quest result animations — distinct visual feedback for quest success (green flash + MP float), fail (red shake), and level-up (celebratory event); (E2) Deck archetype identities — one-line identity label per starter deck shown on deck select screen; (E3) End-game stats screen — after game ends, show quests attempted/succeeded, peak MP, biggest single gain, Mosjes lost. Pure UI/UX, no engine changes. | UIPOL-01 through UIPOL-03 | Quest results have distinct animations; deck select shows archetype identity; end-game stats screen renders correctly after win/loss |
| 24 | Interrupt Modal System | Add a "Damage Interrupt" modal so the human player can react when the bot would damage or eliminate their Mosje. Three cards hook in: (1) Not Today! — negateNextElimination flag triggers an interrupt prompt before bot elimination resolves; (2) Emergency Healings — playable as interrupt when opponent/bot deals damage; (3) Laat me chillen! — fix MP_LOSS_REDUCTION consumption from quest/card damage + fix lifecycle (stay on board until end of turn). Also fix stale "welloe pile" reference in Not Today! card text. | INT-01 through INT-05 | Interrupt modal fires when bot would eliminate or damage human Mosje; Not Today! / Emergency Healings / Laat me chillen! all trigger correctly; Laat me chillen! stays on field for its full turn; tests pass; 0 sim crashes |
| 34 | Account Starter-Deck Onboarding & Active Deck ✓ | New signed-in player with 0 decks hits a BLOCKING "choose your starter deck" modal (5 duo decks only) → deck saved, set active (profile.activeDeckId), and its exact card multiset granted to collection. Lobby: signed-in users get an active-deck panel + "Change deck" switcher modal; guests keep a dropdown listing only the 5 duo decks. Bot picks a true-random duo deck. Removes the stale DIGITAL_CONTROL auto-seed. 3 originals stay in STARTER_DECKS as bot/test fixtures (data unchanged). | ONBOARD-01 through ONBOARD-06 | DONE — 469 tests pass (+5 new), 7/7 Playwright specs green (onboarding modal + active-deck lobby + duo-only guest dropdown), 30-game bot-vs-bot sim clean. Blocking picker on first login; pick grants deck + exact-count cards + active deck; signed-in lobby shows active deck + switcher; guest dropdown = 5 duo only; bot uses duo decks; all 5 duo decks' card IDs validate |

---

## Phase Details

### Phase 1: Implement Mosje Abilities

**Goal:** Get all 4 Mosje abilities working (Physical Force: Alyssa + Jeffrey, Artistic Rhythm: DJ 80/20 + Jisca)

**Requirements:**

- IMPL-PF-M1: Alyssa the Bulldozer ability
- IMPL-PF-M2: Jeffrey the Strongman ability
- IMPL-AR-M1: DJ 80/20 ability
- IMPL-AR-M2: Jisca the Maestro ability

**Approach:**

- Read card-spec.md for each Mosje's ability description
- Implement ability function in `/src/cards/mosjes/[type]/[mosje-name].ts`
- Use existing effect primitives (gainMP, drawCards, applyBuff, etc.)
- Add unit tests for each ability
- Verify no existing tests break

**Success Criteria:**

1. All 4 abilities defined and exported
2. Each ability resolves without errors
3. Effect primitives called correctly
4. Unit tests pass

**Timeline:** ~2 hours

---

### Phase 2: Implement Piecies

**Goal:** Implement all 26 unique Piecies across both decks

**Requirements:**

- IMPL-PF-P1 through IMPL-PF-P12 (Physical Force Piecies)
- IMPL-AR-P1 through IMPL-AR-P13 (Artistic Rhythm Piecies)

**Approach:**

- Group Piecies by effect type (momentum-gaining, attack, utility, substance, etc.)
- Implement each Piecie in `/src/cards/piecies/[type]/[piecie-name].ts`
- Use existing effect primitives
- Add unit tests for each
- Verify registry properly exports all

**Success Criteria:**

1. All 26 Piecies defined and callable
2. Each effect resolves correctly
3. No card ID conflicts
4. Tests pass

**Timeline:** ~4 hours (bulk of work)

---

### Phase 3: Implement Snelle Piecies

**Goal:** Implement all 6 unique instant response cards

**Requirements:**

- IMPL-PF-S1 through IMPL-PF-S4 (Physical Force Snelle)
- IMPL-AR-S1 through IMPL-AR-S4 (Artistic Rhythm Snelle)

**Approach:**

- Implement in `/src/cards/snelle-piecies/[snelle-name].ts`
- Ensure instant timing (no async delays)
- Use existing effect primitives
- Add unit tests

**Success Criteria:**

1. All 6 Snelle Piecies defined
2. Instant execution (no timing delays)
3. Tests pass

**Timeline:** ~1.5 hours

---

### Phase 4: Implement Places

**Goal:** Implement all 5 unique Place cards

**Requirements:**

- IMPL-PF-PL1 through IMPL-PF-PL3 (Physical Force Places)
- IMPL-AR-PL1 through IMPL-AR-PL3 (Artistic Rhythm Places)

**Approach:**

- Implement in `/src/cards/places/[place-name].ts`
- Handle passive effects and turn-end triggers
- Add unit tests

**Success Criteria:**

1. All 5 Places defined
2. Passive effects trigger correctly
3. Tests pass

**Timeline:** ~1.5 hours

---

### Phase 5: Implement Quests

**Goal:** Implement all 14 unique Quest cards with roll mechanics and rewards

**Requirements:**

- IMPL-PF-Q1 through IMPL-PF-Q7 (Physical Force Quests)
- IMPL-AR-Q1 through IMPL-AR-Q5 (Artistic Rhythm Quests)

**Approach:**

- Implement in `/src/cards/quests/general/[quest-name].ts` or `/personal/` as needed
- Handle roll conditions (trait requirements, success thresholds)
- Calculate rewards based on success/failure
- Add unit tests for each quest's logic

**Success Criteria:**

1. All 14 Quests defined
2. Roll mechanics work correctly
3. Trait bonuses applied
4. Reward logic executes
5. Tests pass

**Timeline:** ~2.5 hours

---

### Phase 6: Integration & Launch

**Goal:** Wire everything together, run full tests, enable in lobby

**Requirements:**

- IMPL-TEST: Full test suite passes (536+ tests)
- IMPL-LOBBY: Both decks selectable in lobby
- IMPL-SIM: Simulation runs without crashes
- IMPL-REG: All cards properly registered

**Approach:**

- Add deck selector options to index.html (Physical Force, Artistic Rhythm)
- Run full test suite
- Run simulation (100 games each deck)
- Fix any remaining issues
- Create commit with integration

**Success Criteria:**

1. All tests pass
2. Both decks appear in lobby dropdown
3. Simulation completes without crashes
4. No regressions in existing functionality

**Timeline:** ~1.5 hours

---

### Phase 7: Leaderboard

**Goal:** Global player leaderboard showing ranked win/loss/streak stats, accessible from the lobby.

**Requirements:**

- LB-STATS: Track wins, losses, currentStreak, bestStreak per player in RTDB at users/{uid}/stats
- LB-PAGE: Leaderboard HTML page showing ranked table (rank, name, wins, losses, win rate %, current streak)
- LB-NAV: Nav button on index.html below Deck Builder / Store links
- LB-PROFILE: Store displayName in RTDB at users/{uid}/profile/displayName on login
- LB-DISCONNECT: Disconnect = loss for the leaving player via RTDB onDisconnect hook

**Plans:** 3 plans

Plans:

- [ ] 07-01-PLAN.md � Stats data layer: statsStore.js, leaderboardStore.js, matchRewards.js stats hook, accountSetup.js profile seeding, RTDB rules
- [ ] 07-02-PLAN.md � Leaderboard UI: leaderboard.html, leaderboard.css, leaderboard.js, index.html nav button
- [ ] 07-03-PLAN.md � Disconnect loss hook: registerDisconnectLoss + cancelDisconnectHooks in syncManager.js

**Success Criteria:**

1. Leaderboard page accessible from lobby nav
2. Stats update after every completed match (win/loss/streak)
3. Disconnect records a loss for the leaving player
4. Anonymous players excluded from leaderboard
5. No regressions in existing tests

---

### Phase 8: Complete Partial Cards

**Goal:** Every card marked `partial` or with deferred behaviour in `docs/card-reference.md` is fully working in the live browser game (`src/abilities/piecieEffects.js`, `src/abilities/snelleEffects.js`, `src/abilities/mosjeAbilities.js`, `src/data/quests.js`).

**Requirements:**

- CARD-COMP-MOSJE: All partial Mosje abilities implemented (Binti, Cless, Coert, Martin, Tuk, Ronald, Chris variants, etc.)
- CARD-COMP-SNELLE: All partial Snelle Piecies with deferred behaviours completed (blensen, counter-strikka, drain-reversal, frenssen, jammertje-gepakt, jantje-jantje, jensen, jeweetniet, perfect-dodge)
- CARD-COMP-PIECIE: All partial Piecies with simplified/deferred logic completed (zie-je-die-dingetjes, call-of-the-welloes, dingetje-toch, double-trigger)
- CARD-COMP-QUEST: All partial Quests audited � functional quests upgraded to `implemented`; OR-condition / interactive-pick quests documented with specific deferred reasons naming the blocking primitive (UI selection primitive does not exist yet � deferred to UI phase per Phase 5 decision)
- CARD-COMP-PLACE: place_synergy_chamber duration extension and ability-cost reduction

**Plans:** 6 plans

Plans:

- [ ] 08-01-PLAN.md � Mosje ability fixes: Tuk Architect deck reorder, Ronald Mastermind sort-to-top, Jeffrey quest-bonus fix, Ronald Chef/FPS West peek flags (src/abilities/mosjeAbilities.js)
- [ ] 08-02-PLAN.md � Snelle bug fixes: Jantje�3 const/let crash, Blensen free-cost flag (src/abilities/snelleEffects.js)
- [ ] 08-03-PLAN.md � Piecie stub completions: Zie Je Die Dingetjes two-call keep pattern, Dingetje Toch flag documentation (src/abilities/piecieEffects.js, src/engine/turnManager.js)
- [ ] 08-04-PLAN.md � Snelle flag enforcement in loseMP: drainReversal, negateNextAttack, negateNextPiecie, dierenasiel; Synergy Chamber JSDoc (src/engine/mpManager.js, src/abilities/placeEffects.js)
- [ ] 08-05-PLAN.md � Verification: npm test, simulation run, card-reference.md status updates (docs/card-reference.md)
- [ ] 08-06-PLAN.md � Quest audit: classify all partial quests as implemented or deferred-with-reason; add DEFERRED comments in quests.js (src/data/quests.js, docs/card-reference.md)

**Success Criteria:**

1. No card function in any ability file returns early with a "pending UI" or "deferred" stub comment
2. All cards in card-reference.md with status `partial` are updated to `implemented` or `advanced`
3. Existing 588+ tests still pass
4. Simulation runs without new crashes

---

### Phase 9: UI & Engine Bug Fixes

**Goal:** Fix 5 playtesting bugs found in the live browser game: quest roll threshold display, Dubbele Dosis Piecie card lifecycle, Senor West MP floor + level-degrade fallback, Lucky Coin activation guard, DJ Lucky Mixer turn modifier redesign.

**Requirements:**

- BUG-01: Quest roll threshold displays wrong tier � Strategy Puzzle shows 3+ instead of 2+ when player has Mental ??? (stat level 3)
- BUG-02: Dubbele Dosis Piecie discards immediately after activation instead of persisting until end of turn
- BUG-03: Senor West wrong-guess penalty drives MP to -10 when player is at 0 MP (floor not respected); should degrade level -1 or block activation if already at minimum level
- BUG-04: Lucky Coin coin flip resolves before checking Piecie slot availability � player can flip risk-free with full slots; slot check must run first and block activation if no slots free
- BUG-05: DJ Lucky Mixer reroll effect does nothing on Quest dice rolls; redesign to a +2 turn-scoped Quest dice modifier using same end-of-turn lifecycle as BUG-02 fix

**Plans:** 5/5 complete - 2026-05-25

Plans:

- [x] 09-01-PLAN.md -- BUG-03: Senor West MP floor fix + activation guard
- [x] 09-02-PLAN.md -- BUG-04: Lucky Coin pre-flip slot guard
- [x] 09-03-PLAN.md -- BUG-02 + BUG-05: Dubbele Dosis lifecycle + DJ Lucky Mixer quest modifier
- [x] 09-04-PLAN.md -- BUG-01: Quest threshold verification
- [x] 09-05-PLAN.md -- Verification: full test suite, simulation, card-reference.md updates

**Success Criteria:**

1. Quest roll modal shows the correct threshold tier for the player's stat level
2. Dubbele Dosis Piecie stays in play until end of turn, then moves to discard
3. Senor West cannot drive MP below 0; wrong-guess at 0 MP degrades level instead (or blocks if already min level)
4. Lucky Coin activation is blocked when all Piecie slots are full; flip never triggers
5. DJ Lucky Mixer adds +2 to all Quest dice results for the duration of the current turn
6. All existing tests still pass; no regressions

---

### Phase 10: Deck Balance

**Goal:** Fix game stalling � insufficient MP generation across all 3 starter decks causes games to end in deck-out or stalemate before anyone reaches Level 3. Fix by reworking underused cards, adjusting deck compositions, and/or tweaking rules. Prefer reworking existing cards over adding new ones.

**Requirements:**

- BAL-01: Digital Control stalling � too many draw-only cards, not enough reliable MP gain; Coert's draw ability bleeds MP
- BAL-02: Physical Force � adequate direct MP but lacks fallback when quests fail; emergency_healings only delays stalls
- BAL-03: Artistic Rhythm � post-bug-fix state unknown; verify balance after Phase 8 fixes
- BAL-04: Quest cost vs reward economy � quests require MP upfront; if failing quests, net negative
- BAL-05: Deck-out vulnerability � 15-17 card decks run dry before game ends

**Success Criteria:**

1. Digital Control can reliably reach Level 3 without deck-out
2. All 3 decks have at least 2 clear paths to MP generation per game
3. Games end with a winner (Level 3) rather than stalemate/deck-out
4. Quest economy feels fair � attempting quests is never a pure drain
5. Changes are backwards-compatible with existing card implementations

**Plans:** 5 plans

Plans:

- [x] 10-01-PLAN.md � Prerequisite: add subtype to Mosje slots (turnManager.js) + test scaffolds
- [x] 10-02-PLAN.md � Quest economy: all successMP +20, failMP capped at -20 (quests.js)
- [x] 10-03-PLAN.md � Equipment effect scaling + Tikker bug fix (piecieEffects.js)
- [x] 10-04-PLAN.md � Deck-out engine rule: reshuffle + skipNextTurn (turnManager.js)
- [x] 10-05-PLAN.md � Deck compositions + docs + full verification

---

### Phase 11: Bot Opponent

**Goal:** Add a basic AI opponent so players can practice or play offline without needing a second human. The bot uses simple heuristics (no ML, no tree search) and drives the same engine action functions a human player calls.

**Requirements:**

- BOT-01: Bot decision loop � on bot's turn, pick and execute actions using heuristics (play Piecies, activate Places, attempt Quests, use Mosje ability)
- BOT-02: Offline room mode � "Play Offline" checkbox on the lobby form bypasses Firebase room creation and starts a local-only game immediately
- BOT-03: Bot identity � bot gets a name, a starter deck selection, and a player slot (player_2) in the engine state
- BOT-04: Bot turn driver � after the human ends their turn, automatically drive the bot's turn without any UI input (with a short delay so moves are readable)
- BOT-05: Full game loop � offline game runs through win conditions (Level 3 / knockout) and shows the result screen

**Success Criteria:**

1. "Play Offline" checkbox appears in the lobby and starts a game without Firebase
2. Bot takes valid turns (no engine errors, no infinite loops)
3. Bot plays at least one Piecie, attempts at least one Quest, and uses its Mosje ability over the course of a game
4. Game ends with a proper win/loss screen
5. Existing online multiplayer is completely unaffected

**Plans:** 5 plans

Plans:

- [x] 11-01-PLAN.md -- botDriver.js: pure driveBotTurn function + unit tests
- [x] 11-02-PLAN.md -- Offline lobby: Play Offline vs Bot checkbox + session storage
- [x] 11-03-PLAN.md -- Offline game init: detect ?offline=true, skip Firebase, start game immediately
- [x] 11-04-PLAN.md -- Bot turn driver: wire driveBotTurn into End Turn handler with 600ms delay
- [x] 11-05-PLAN.md -- Win condition + result screen: offline FINISHED detection + smoke tests

---

### Phase 12: Implement Unfinished Mechanics & Stubs

**Goal:** Eliminate all silent no-ops in the engine � status effects that are pushed but never read, stub functions that return early, snelle flags set but never consumed, and partial card mechanics deferred to UI. Every card that claims to protect, halve, or modify MP must actually do so.

**Requirements:**

- STUB-01: MP_LOSS_HALVED � wire into loseMP() in mpManager.js (5 cards: Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes)
- STUB-02: MP_LOSS_REDUCTION � wire into loseMP() (3 consumers: Laat me chillen, FF Haaltje Nemen, The Protector snelle flag)
- STUB-03: WELLOE_SHIELD � implement no-knockout protection check in victoryChecker.js (1 card: Mosje Shield)
- STUB-04: negateNextSearch � wire into deck draw logic in turnManager.js (1 card: Jammertje Gepakt)
- STUB-05: doubleNextPiecie � implement double-activation executor logic (1 card: Double Trigger)
- STUB-06: FF Haaltje Nemen undefined variable � fix console.log referencing undefined `reduction`
- STUB-07: Dingetje Toch � wire _dingetjeTochActive flag consumption in piecie requirement checker
- STUB-08: SNOEIERTJE_COST � cleanup: push is never consumed (questBonusMP handles the real logic); remove the dead push or document clearly
- STUB-09: Dierenasiel cost-waiver � move 0-MP PET ability cost-waiver from UI-only to engine guard
- STUB-10: Synergy Chamber cost/duration reduction � integrate into ability activation caller
- STUB-11: Bagga of Greed discard-one-of-two � wire the `_baggaDiscard = true` flag into UI selection handler (draw 2, discard 1 is currently only flagged, not enforced)
- STUB-12: Emergency Swap � implement ability-copy selection or document as deferred with explicit reason
- STUB-13: Huisbaas � implement Place search from deck or document as deferred with explicit reason
- STUB-14: Welloe Force redirect � implement damage redirect or document as deferred with explicit reason
- STUB-15: MP Adjuster hardcoded 50 � wire UI exact-value selection or document as deferred
- STUB-16: FPS West + Ronald Chef hand reveal � wire opponentHandPeeked flag to actual UI hand reveal

**Success Criteria:**

1. Every status effect type that is pushed to statusEffects is either checked in loseMP/turnManager/victoryChecker OR explicitly documented as deferred with a named blocking primitive
2. No function in any ability file returns early with a silent no-op where real behaviour was intended � all are either implemented or tagged `// DEFERRED: <reason>`
3. All snelle flags that are set have corresponding read-points in the engine
4. 664+ tests pass, 0 simulation crashes
5. card-reference.md updated: all items that are now implemented changed to `implemented`; all remaining deferred items given a specific reason naming the missing primitive

**Plans:** 5 plans

Plans:

- [x] 12-01-PLAN.md � Engine wiring: MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD checks wired into loseMP() and markMosjeDefeated(); fix FF Haaltje Nemen ReferenceError; restore push site values
- [x] 12-02-PLAN.md � Flag wiring: negateNextSearch in phaseDrawCard, STUB-05 verification, dingetjeToch documentation, SNOEIERTJE_COST dead push removal
- [x] 12-03-PLAN.md � Place mechanics: Dierenasiel 0-MP guard and Synergy Chamber cost reduction in useMosjeAbility
- [x] 12-04-PLAN.md � UI-gated interactions: Bagga of Greed discard picker, Welloe Force redirect target, MP Adjuster value picker (via existing modal functions)
- [x] 12-05-PLAN.md � Deferred docs: Emergency Swap and Huisbaas DEFERRED comments, FPS West/Ronald Chef flag comments, card-reference.md full update

---

### Phase 13: Action Animation Feedback

**Goal:** Add visual animation feedback to game actions so players can clearly see what happened � MP gains, MP losses, attacks, quest results � without reading the log.

**Status:** COMPLETE (implemented by gvandyck, 2026-05-31)

**Plans:** 1 plan
Plans:

- [x] 13-01-PLAN.md � Action animation system: actionAnimations.js module, boardRenderer wiring, CSS animations for MP gain/loss/attack/quest events

---

### Phase 14: Physical Equipment Cards & Boxing Ring

**Goal:** Add a Physical equipment Piecie suite (mirroring the Digital Keyboard/Mouse/Controller set), a new Boxing Ring place, and update The Gym to give CLESS-tagged Mosjes a bonus � giving Fighting/Physical decks a proper item identity and making Gandoe + Cless cards meaningfully stronger in themed setups.

**Requirements:**

- PHYS-01: Dumbbells (?, PHYSICAL-EQUIPMENT) � Physical Mosje on field: +20 MP; Physical ???: also draw 1 card
- PHYS-02: Boxing Gloves (??, PHYSICAL-EQUIPMENT) � Physical ??+ Mosje: +25 MP; GANDOE tag: +40 MP + apply MP_LOSS_HALVED 1 turn
- PHYS-03: Skipping Rope (?, PHYSICAL-EQUIPMENT) � Physical Mosje: +1 next Quest roll + draw 1 card; no Physical Mosje: draw 1 only
- PHYS-04: Protein Shake (??, PHYSICAL-EQUIPMENT + FOOD) � +25 MP to active Physical Mosje; +35 MP if Boxing Ring is active place
- PHYS-05: Boxing Ring (???, Place) � ON_QUEST: Physical Mosjes +15 MP any outcome; GANDOE tag: +25 MP instead; END_PHASE: FIGHTING type +10 MP, non-FIGHTING -5 MP
- PHYS-06: Gym update � Add CLESS-tag bonus: +20 MP at END_PHASE when any CLESS Mosje is on field (regardless of physical trait level)

**Success Criteria:**

1. All 4 PHYSICAL-EQUIPMENT Piecies have card definitions, effect functions, and tests
2. Boxing Ring place has definition, effect function triggered at ON_QUEST and END_PHASE, and tests
3. The Gym updated: CLESS-tagged Mosjes gain +20 MP at END_PHASE
4. Boxing Gloves correctly applies MP_LOSS_HALVED for GANDOE-tagged Mosjes
5. Protein Shake checks activePlace === 'place_boxing_ring' for the bonus tier
6. All existing tests still pass; new cards have at least 2 tests each
7. card-reference.md updated for all new and modified cards

**Plans:** 3 plans

Plans:

- [x] 14-01-PLAN.md � Physical Equipment Piecies: Dumbbells, Boxing Gloves, Skipping Rope (data + effects + tests)
- [x] 14-02-PLAN.md � Protein Shake + Boxing Ring place (data + effects + tests)
- [x] 14-03-PLAN.md � Gym patch (CLESS bonus) + card-reference.md update + simulation check

---

### Phase 15: Starter Deck Reworks

**Goal:** Redesign all three starter decks around real-life relationships and thematic identities. Add 4 new IRL-themed cards (Toennoe place, Tesla place, Kickboxing Bootcamp quest, Tijd voor Winston Jaaa quest) with dedicated engine wiring. Every card in every deck earns its slot.

**Final deck compositions:**

Physical Force � Gandoe Destroyer + Michelle Iron Tuk (couple IRL, boxing theme):
Piecies: Boxing Gloves, Bowie & Stormey, Eendjes Voeren, Laat me Chillen, Kannetje Melk, Protein Shake, Affoe �2, Dubbele Dosis, Tikker
Snelle: Not Today!, Emergency Healings, Jensen!, Lucky Coin
Places: Boxing Ring, Toennoe (NEW)
Quest: Kickboxing Bootcamp (NEW personal quest)

Digital Control � Coert Tech + Binti Sharp Tongue (couple IRL, food-double synergy + Tesla loop):
Piecies: Kannetje Melk �3, Varkenspootjes, Pot of Weed, Dubbele Dosis �2, Bong Hit Demolition, Redbull, Keyboard, Controller
Snelle: Jensen! �2, Lucky Coin, Counter Strikka
Places: Tesla (NEW), Bank Chilling
Quest: Tijd voor Winston Jaaa (NEW personal quest)

Artistic Rhythm � Youri Speedrunner + Chris DDR (gaming + dancing, wired synergy):
Piecies: Kannetje Melk �2, Affoe �2, Pot of Weed, Dubbele Dosis �2, Controller, Synergy Field, Grammetje Pieter
Snelle: Lucky Coin �2, Jensen!, Ff Haaltje Nemen
Places: Quest Haven, Bank Chilling
Quest: quest_improvise

**New cards (4):**

- DECK-NEW-01: place_toennoe � END_PHASE: GANDOE Mosje +20 MP, MICHELLE/TUK Mosje +15 MP, both active: +10 bonus each. New effect function in placeEffects.js.
- DECK-NEW-02: quest_personal_kickboxing_bootcamp � requiredMosjeId: mosje_michelle. Physical roll 4+ alone, 2+ with Gandoe on field. If Gandoe active: questLogic adds +2 diceBonus. Success: +80 MP. Fail: -20 MP.
- DECK-NEW-03: place_tesla � Requires Coert active to play (activation guard in main.js). TURN_START: COERT +20 MP, BINTI +20 MP, both active: +10 each. Coert defeated: Tesla destroyed ? sent to player discard (hook in victoryChecker.js).
- DECK-NEW-04: quest_personal_winston_tijd � requiredMosjeId: mosje_binti. Requires place_tesla active. Tesla returns to player hand. Auto-succeed: +100 MP. Recover piecie_varkenspootjes from player discard if present. Logic in questLogic.js.

**Requirements:**

- DECK-01: Physical Force mosjes ? mosje_gandoe_destroyer + mosje_michelle
- DECK-02: Physical Force piecies � full list as above (Boxing Gloves, Bowie & Stormey, etc.)
- DECK-03: Physical Force places ? Boxing Ring + Toennoe (NEW)
- DECK-04: Physical Force quest ? quest_personal_kickboxing_bootcamp (NEW)
- DECK-05: Digital Control mosjes ? mosje_coert_tech + mosje_binti
- DECK-06: Digital Control piecies � full list as above (Kannetje Melk �3, Varkenspootjes, etc.)
- DECK-07: Digital Control places ? Tesla (NEW) + Bank Chilling
- DECK-08: Digital Control quest ? quest_personal_winston_tijd (NEW)
- DECK-09: Artistic Rhythm mosjes ? mosje_youri + mosje_chris_ddr
- DECK-10: Artistic Rhythm piecies � full list as above (Controller replaces F1 Telemetry)
- DECK-11: Artistic Rhythm quest ? quest_improvise (replacing quest_personal_lucky_crescendo)
- DECK-12: Engine � Tesla activation guard in main.js (Coert required to play card)
- DECK-13: Engine � victoryChecker.js: Coert defeated ? Tesla destroyed, sent to discard
- DECK-14: Engine � questLogic.js: Kickboxing Bootcamp +2 diceBonus when Gandoe active
- DECK-15: Engine � questLogic.js: Winston quest auto-succeed, Tesla to hand, recover Varkenspootjes
- DECK-16: placeEffects.js: effect_toennoe (GANDOE/MICHELLE/TUK tag checks)
- DECK-17: placeEffects.js: effect_tesla (COERT/BINTI tag checks, Coert guard)
- DECK-18: mosjes.js: mosje_dj_8020.synergyWith ? add mosje_chris_ddr; mosje_youri.synergyWith ? add mosje_chris_ddr; mosje_gandoe_destroyer.synergyWith ? add mosje_michelle; mosje_michelle.synergyWith ? add mosje_gandoe_destroyer
- DECK-19: quests.js: fix isBoosterOnly: false on all personal quests in starter decks
- DECK-20: simulation/starter-decks.ts: align all three simulation decks with final compositions

**Success Criteria:**

1. All three starterDecks.js deck objects match the final compositions exactly
2. place_toennoe and place_tesla exist in places.js with correct fields; effects implemented in placeEffects.js
3. quest_personal_kickboxing_bootcamp and quest_personal_winston_tijd exist in quests.js; engine logic in questLogic.js
4. Tesla activation blocked in main.js when Coert not on field
5. Tesla destroyed and sent to discard when Coert is defeated (victoryChecker.js)
6. Kickboxing Bootcamp gives +2 diceBonus when Gandoe is on field
7. Winston quest auto-succeeds with Tesla active; Tesla returns to hand; Varkenspootjes recovered from discard
8. All Mosje pairs in starter decks have mutual synergyWith entries
9. All existing 721 tests still pass; new cards have tests

**Plans:** 3 plans

Plans:

- [ ] 15-01-PLAN.md � Physical Force rework: Gandoe+Michelle pair, deck composition, Toennoe place, Kickboxing quest + questLogic
- [ ] 15-02-PLAN.md � Digital Control rework: Coert+Binti pair, deck composition, Tesla place + engine hooks, Winston quest + questLogic
- [ ] 15-03-PLAN.md � Artistic Rhythm rework: Youri+Chris DDR pair, deck composition, synergyWith updates, isBoosterOnly fixes, simulation alignment, docs

---

---

### Phase 22: Call of the Welloes

**Goal:** Implement the full Call of the Welloes Piecie effect � summon a Mosje from the owner�s Welloe pile into a free active slot at restored MP/Level; the Piecie is the anchor, and when it leaves play the summoned Mosje returns to the Welloe pile. Two new tracking fields only (`piecieSlots[i].linkedMosjeCardId`, `activeSlots[i].summonedByPiecie`).

**Requirements:**

- CALLW-01: effect_call_of_welloes � silent cancel guards + welloe-pick pending flag
- CALLW-02: returnMosjeToWelloe engine helper � push to welloe[] + null slot, no defeat side-effects
- CALLW-03: End-of-turn sweep � return summoned Mosjes whose anchor Piecie has left play
- CALLW-04: confirmCallOfWelloes summon executor + main.js showOptionSelect UI flow

**Plans:** 3 plans

Plans:

- [x] 22-01-PLAN.md � Engine return path: returnMosjeToWelloe helper + endTurn sweep hook (TDD)
- [x] 22-02-PLAN.md � Summon path: effect_call_of_welloes + confirmCallOfWelloes + description fix (TDD)
- [x] 22-03-PLAN.md � UI wiring: main.js _callOfWelloesPending modal branch + card-reference.md (human-verify)
- [x] 22-04-PLAN.md � Gap closure: mechanic revision (Level 1/50 MP, defeat-on-sweep, persistence guard) (TDD)
- [x] 22-05-PLAN.md � Gap closure: bidirectional destroy � Piecie discarded immediately when linked Mosje defeated (TDD)

**Success Criteria:**

1. effect_call_of_welloes functional; summon + return lifecycle correct
2. Summoned Mosje restores welloe-recorded MP/Level (not Level 1 / 0 MP)
3. Empty Welloe pile or no free slot ? effect silently cancelled (no UI, no error)
4. All tests pass; 0 simulation crashes

---

### Phase 23: Graveyard System

**Goal:** Normalize the graveyard (discard pile) into a clean, modular system ready for graveyard-themed card mechanics. Fix silent-removal bugs in Klaar met Jou and Those Eyelashes. Standardize all entries as typed objects. Rename "discard pile" ? "Graveyard" in all UI labels and card descriptions.

**Requirements:**

- GRAV-01: Fix Klaar met Jou � discarded hand card must go to opponent's graveyard
- GRAV-02: Fix Those Eyelashes � discarded hand cards must go to owner's graveyard
- GRAV-03: Normalize graveyard entry format � all entries as `{ cardId, name, type, ...meta }` objects (no bare strings)
- GRAV-04: Rename `player.discard` ? `player.graveyard` across engine, UI, and tests
- GRAV-05: Rename "Graveyard" in all UI labels, card descriptions, and docs (discard pile ? Graveyard)
- GRAV-06: Graveyard viewer shows card names, types, and counts clearly; ready for future filtering

**Plans:** 2 plans

Plans:

- [x] 23-01-PLAN.md — graveyardUtils.js + player.discard rename + Klaar met Jou + Those Eyelashes fixes (TDD) — COMPLETE: 912 tests pass
- [x] 23-02-PLAN.md — UI rename (Graveyard label + modal) + card descriptions + docs — COMPLETE: 912 tests pass

**Success Criteria:**

1. No card removal bypasses the graveyard � every destroyed/discarded card is visible
2. All graveyard entries are typed objects with at minimum `{ cardId, name, type }`
3. UI label reads "Graveyard" everywhere; card descriptions updated
4. All existing tests pass; 0 regressions

---

### Phase 25: UI Polish & Feel

**Goal:** Make the game look and feel polished through three independent UI improvements that add no engine complexity.

**Requirement IDs:** UIPOL-01, UIPOL-02, UIPOL-03

- UIPOL-01: Quest result animations — green flash + MP float on success; red shake on fail; celebratory level-up event distinct from normal MP gain
- UIPOL-02: Deck archetype identities — each starter deck gets a one-line identity shown on deck select screen (e.g. "High risk, high reward questing")
- UIPOL-03: End-game stats screen — after game ends, render: quests attempted, quests succeeded, peak MP reached, biggest single MP gain, Mosjes lost

**Plans:** 3 plans\n\nPlans:\n- [ ] 25-01-PLAN.md � Quest result animations (CSS + boardRenderer + actionAnimations wiring)\n- [ ] 25-02-PLAN.md � Deck archetype identities (tagline field + lobby tagline div + change listener)\n- [ ] 25-03-PLAN.md � End-game stats screen (gameStats accumulator + rewardOverlay extension)

**Success Criteria:**

1. Quest success shows a green animated flash + floating MP number
2. Quest fail shows a red shake animation
3. Level-up has a visually distinct celebratory moment
4. Deck select screen shows a one-line archetype identity per deck
5. End-game stats screen appears after win/loss with all 5 stat categories
6. All 920+ tests pass; 0 sim crashes; node --check clean

---

### Phase 24: Interrupt Modal System

**Goal:** Add a "Damage Interrupt" modal so the human player can react when the bot would damage or eliminate their Mosje. Three cards hook in: Not Today! (negateNextElimination reactive use), Emergency Healings (proactive interrupt heal), and Laat me chillen! (lifecycle fix + MP_LOSS_REDUCTION coverage). Also fix stale "Welloe pile" text in Not Today! description.

**Requirements:**

- INT-01: Interrupt modal fires before bot steps that eliminate or deal >= 30 MP damage to human Mosje
- INT-02: After human plays a Snelle Piecie in the interrupt window, bot steps are re-computed from modified state
- INT-03: Laat me chillen! stays on field (persistUntilEndOfTurn: true) until end of turn
- INT-04: Not Today! description text fixed: "Welloe pile" -> "graveyard"
- INT-05: effect_snelle_emergency_healings heals unconditionally (remove mp <= 0 guard)

**Plans:** 2 plans

Plans:

- [ ] 24-01-PLAN.md -- Data fixes: persistUntilEndOfTurn, Not Today! text, Emergency Healings guard (TDD)
- [ ] 24-02-PLAN.md -- Interrupt modal system: async playBotSteps, humanTakesDamageOrElimination, showDamageInterruptModal (human-verify)

**Success Criteria:**

1. Interrupt modal fires when bot would eliminate or deal >= 30 MP damage to human Mosje (offline mode)
2. Not Today! and Emergency Healings are offered as options in the interrupt modal
3. Playing Not Today! during interrupt prevents Mosje elimination
4. Laat me chillen! stays on field until end of turn after activation
5. All 912+ tests pass; 0 simulation crashes

---

## Build Order Rationale

1. **Mosje abilities first** � Foundation for deck synergies and playstyles
2. **Piecies second** � Most of a deck, bulk of effects
3. **Snelle Piecies third** � Instant responses, fewer interdependencies
4. **Places fourth** � Environmental effects, moderate complexity
5. **Quests fifth** � Most complex (roll mechanics), depends on other systems
6. **Integration last** � After all cards work individually

---

## Code Organization

**One file per card, pure functions:**

```
src/cards/mosjes/fighting/alyssa-the-bulldozer.ts
src/cards/piecies/attack/te-hard-gaan.ts
src/cards/snelle-piecies/snelle-jensen.ts
src/cards/places/place-the-gym.ts
src/cards/quests/general/quest-endurance-test.ts
```

**Each file exports:**

- Card definition (metadata)
- Ability/effect function (pure, no mutations)
- Tests in `[card].test.ts`

---

*Last updated: 2026-06-06*

---

### Phase 27: Youri Ability + Chris Synergy Fix

**Goal:** Fix Youri Speed Activate to match its card description (20 MP cost → activate a face-down piecie on field → draw 1 card, max 3 uses per game), and implement the Chris+Youri passive synergy (both on field = piecies played from hand go directly to active state, no waiting turn).

**Requirements:** YCS-01, YCS-02, YCS-03

**Plans:** 3 plans\n\nPlans:\n- [ ] 27-01-PLAN.md � Fix ability_youri_speed_activate engine logic + youriAbilityUses counter\n- [ ] 27-02-PLAN.md � Wire Youri ability UI in main.js: slot selector modal + activatePiecie + card draw\n- [ ] 27-03-PLAN.md � Chris+Youri passive synergy in playPiecie + test suite

**Success Criteria:**

1. Youri ability costs 20 MP, activates a face-down piecie on field, then draws 1 card
2. Youri ability is blocked if player has < 20 MP or no face-down piecies on field
3. Youri ability use-count is tracked and capped at 3 per game
4. When both Chris and Youri are on the field, playing any piecie from hand skips the face-down waiting turn and activates immediately
5. node --check clean, npm test passes

---

### Phase 26: Debug Logging System

**Goal:** Pure observability layer — every MP change shows its source, every level-up shows before/after, every quest roll shows threshold vs result. No engine changes.

**Requirements:** DBLOG-01, DBLOG-02, DBLOG-03

**Plans:** 3 plans

Plans:

- [ ] 26-01-PLAN.md — MP source logging: add source-attributed log.add calls at quest cost and resolution sites in main.js
- [ ] 26-02-PLAN.md — Level-up log type: patch logStateOutcome to emit 'level' type for level-change lines
- [ ] 26-03-PLAN.md — Quest roll logging: extend showDiceRoll callback to pass roll+threshold, wire log entries at both call sites

**Success Criteria:**

1. MP changes show source in log panel (quest name, ability name)
2. Level-ups display with ⬆️ icon and before/after level numbers
3. Quest rolls display "rolled N, needed M+ → Success/Failed"
4. node --check clean, npm test passes

---

### Phase 28: Visual UI Tests

**Goal:** 10 Playwright tests covering the most historically buggy and mechanically complex areas of the game. Every test asserts MP before, during, and after an effect/ability/quest resolves, making regressions immediately visible in a real browser.

**Requirements:**

- VIS-01: Dubbele Dosis stays on field until end of turn, then moves to graveyard (+20 MP during, retained after)
- VIS-02: Leipe Swap reverts MP at end of turn (own + opponent MP swap back; banked levels stick)
- VIS-03: Quest success grants correct MP; log shows "rolled N, needed M+"
- VIS-04: Quest fail MP never goes below 0 (floor enforced by loseMP)
- VIS-05: Youri ability — single face-down piecie auto-activates, no modal, Youri MP -20, hand +1
- VIS-06: Youri ability — 3-use cap blocks 4th use, no MP deducted on blocked attempt
- VIS-07: Not Today! interrupt modal fires when bot would eliminate human Mosje; Mosje survives at 5 MP
- VIS-08: Laat me chillen! stays on field for full turn; MP_LOSS_REDUCTION active during bot turn
- VIS-09: Quest 2/2 cap — third general quest attempt blocked, MP unchanged
- VIS-10: Helpers extracted — smoke.spec.js imports from helpers.js, all 6 smoke tests still pass

**Plans:** 1 plan

Plans:

- [ ] 28-01-PLAN.md — All 10 tests + helpers extraction

**Success Criteria:**

1. `tests/ui/helpers.js` contains all shared test utilities
2. `tests/ui/mechanics.spec.js` contains 9 named tests (VIS-01 through VIS-09)
3. Every test asserts MP before, during, and after the effect resolves
4. Every test has at least one log assertion confirming the action appeared in-game
5. `npm run test:ui:headed` passes all 15 tests (6 smoke + 9 mechanics)
6. `npm test` still passes (no unit test regressions)

---

### Phase 30: Defeat at 0 MP

**Goal:** Implement the canonical ruling (phase0-rulings.md:118) that a Mosje dies when a damaging effect reduces its MP below 0 at Level 0. Currently the engine floors MP at 0 and Mosjes are effectively immortal. A Mosje never holds negative MP: Level>0 regresses a level (overflow carry), Level 0 is killed → discard/Welloe. Summoned-at-0 Mosjes and MP-cost payments are never lethal.

**Requirements:**

- DZ-01: loseMP + all 3 applyDamage copies flag `_pendingDefeat` on Lv0-below-0
- DZ-02: `applyPendingDefeats` sweep in checkVictory routes flagged Mosjes via markMosjeDefeated
- DZ-03: Summoned/placed-at-0 Mosjes survive (no reduction path = no flag)
- DZ-04: MP-cost payments stay gated/non-lethal
- DZ-05: ~30 tests migrated; Ronald Kip stacking test re-run
- DZ-06: TS declarative engine reconciled (in_welloe semantics match)
- DZ-07: Simulation crash-free + bot-vs-bot KNOCKOUT re-baseline

**Plans:** 1 plan

Plans:

- [ ] 30-01-PLAN.md — Defeat-at-0 sweep + 4 reduction-site flags + test migration + sim

**Success Criteria:**

1. Lv0 Mosje reduced below 0 by any damaging effect → graveyard/Welloe via markMosjeDefeated; KNOCKOUT fires if last Mosje
2. No Mosje ever holds negative MP; Lv>0 regression unchanged
3. Mosjes summoned/placed at 0 MP are not killed on placement
4. MP-cost payments never kill the paying Mosje
5. npm test green (incl. Ronald Kip); typecheck:source green
6. Simulation crash-free, timeout <25%; bot-vs-bot 30 games pass, no negative-MP anomalies

---

### Phase 31: MP 0–100 Cap Invariant

**Goal:** Enforce that a Mosje's MP is always 0–100 (never exceeds 100). Only Quests permanently level up; piecies/places/abilities/snelles cap at 100 (some abilities/piecies may temporarily level — out of scope). Lower bound (defeat below 0) already done in Phase 30; this is the upper bound + quest-only-leveling.

**Requirements:**

- MPCAP-01: clampMosjeMp sweep in checkVictory caps every active Mosje at 100
- MPCAP-02: applyMPGain caps at source (Math.min(100, ...))
- MPCAP-03: audit gainMP callers — only Quests level; non-quest callers cap
- MPCAP-04: flip card-chains "piecie MP gain caps at 100" expected-failure to passing; add mp-cap unit tests
- MPCAP-05: Ronald Kip stacking test + full sim + bot-vs-bot (no MP > 100)

**Plans:** 1 plan

Plans:

- [ ] 31-01-PLAN.md — central clamp sweep + source cap + leveling audit + tests + sim

**Success Criteria:**

1. No Mosje ever holds MP > 100 (or < 0) after any action
2. Only Quests permanently level up; non-quest gains cap at 100
3. Quest rewards still level correctly (≥100 → Level+1, MP resets)
4. card-chains cap test passes; mp-cap unit tests pass
5. npm test + test:cards green; Ronald Kip green
6. Simulation crash-free; bot-vs-bot shows no MP > 100

---

### Phase 32: On-field Mosje Info + Quest Dice Modal Redesign

**Goal:** Surface the meta info players need at a glance on their own on-field Mosjes (Level, traits, ability, active-only synergy) and fully redesign the Quest dice-roll/result modal for better UX. Pure UI/UX — no engine, MP, or quest-logic changes.

**Requirements:**

- ONFIELD-01: Own on-field Mosje cards show a compact info layer directly on the board card — Level badge, trait star-pips, and a short ability snippet — with full detail still available on click (detail modal).
- ONFIELD-02: Synergy is displayed on a Mosje only when the synergy is currently ACTIVE (partner on field); hidden otherwise.
- ONFIELD-03: Remove the useless "Active on field" description text from on-field Mosje cards (main.js toMosjeCards).
- ONFIELD-04: Opponent on-field Mosjes stay minimal (no enriched layer); still clickable for the detail modal.
- ONFIELD-05: Add Level to the click detail modal (showCardPreview) for Mosjes.
- DICE-01: Full visual redesign of showDiceRoll — animated die face, staged requirement→rolling→result flow, themed colors, prominent success/fail reveal with MP delta. Preserve all logic: diceBonus, forceReroll (Je Weet Niet), skiffaRerolls, window.__forceDiceRoll test override, onResolved contract.

**Plans:** 2 plans

Plans:

- [ ] 32-01-PLAN.md — on-field own-Mosje meta layer (Level/traits/ability/active-only synergy) + remove "Active on field" + detail-modal Level chip
- [ ] 32-02-PLAN.md — full Quest dice-modal redesign (animated pip die, staged flow, themed success/fail + MP delta)

**Success Criteria:**

1. Own on-field Mosjes show Level + trait pips + ability snippet on the card; opponent Mosjes unchanged
2. Synergy shows only when active; never shown inactive
3. "Active on field" text no longer appears anywhere on-field
4. Detail modal shows Level for Mosjes
5. Dice modal redesigned; all existing reroll/bonus/test-override behavior preserved
6. node --check clean on touched UI files; npm test + test:cards green; quest dice visual tests pass (no regressions)

**Win-clarity UX (added on this branch, 2026-06-20 — beyond the original UI-only scope; commit a3fe3b3):**

- WIN-01: Reaching Level 3 declares the win instantly (resolveQuest → checkVictory); checkLevelUp caps level at 3 so Mosjes never overshoot to Level 4. *(Engine change — the one exception to "UI-only".)*
- WIN-02: Plain-language win/defeat reason (describeWin) replaces the raw enum in the battle log and reward overlay; `data-win-reason` attribute for tooling.
- WIN-03: The win/defeat modal embeds the colour-coded battle log + a Copy Log button so the match can be reviewed before leaving.
- WIN-04: 13 inline raw-enum "Match Finished" popups deduped into one idempotent handleGameOver.
- WIN-05: "How to Win" top-bar panel listing the 4 win conditions.
- WIN-06: Dice-roll modal shows the attempting Mosje's stats (level/MP/trait stars, rolled trait highlighted).
- Repro/guard tests: tests/engine/instant-win-level3.test.ts; full-game LEVEL_3 spec rewritten as a real instant-win + battle-log guard.

### Phase 35: Places Text-vs-Engine Reconciliation (Round 1) — COMPLETE

**Goal:** Reconcile all 21 Place cards so each card's text matches engine behavior. Round 1 of the full-game ability-text audit (Places first). Audit complete: 9 clean, 12 flagged and ruled interactively with Gandoe (5 bug fixes + 7 design reworks). This phase implements the 12 rulings, one card at a time (TDD), MP-touching cards re-run Ronald Kip + sim. **Post-research scope amendment (2026-07-14):** Drain Zone and The Void are not ready for gameplay this round — both are hidden from all player-facing pools instead of having their new mechanics implemented; see `35-CONTEXT.md` Plan-Phase Scope Amendments.

**Requirements:**

- PLACE-01 (Bank Chilling): loop all active slots — every Social ★★+ Mosje +15 at turn start (was first-slot only); also fix the `trigger: "TURN_START"` → `"START_PHASE"` dispatch bug (card never fired at all in live play — found in research).
- PLACE-02 (Obby #1): loop all active slots — every Physical/Resilient ★★+ Mosje +20 success / −10 fail.
- PLACE-03 (Arcade): loop all active slots — every Technical ★★+ Mosje +15 on success.
- PLACE-04 (De Box): +15 to any Michelle/Tuk Mosje (id includes 'michelle' or 'tuk'); extend both-together +10; fix "Toennoe" logs.
- PLACE-05 (Drain Zone): **DESCOPED — hide from player-facing pools** (deck-building, boosters, starter decks) instead of implementing "ATTACK Piecies deal +10 damage" (requires editing ~11 separate Piecie effect functions, out of scope for a Places-only phase). Still remove the untexted +5-to-all-gains bug (mpManager.js:38) since it's dead-code cleanup independent of the hide decision. Card data/effect code stays in the codebase for a future round to finish.
- PLACE-06 (Delluft): **mpCost clause moved to Phase 36** (folded into the game-wide MP cost model redesign — see `.planning/phases/36-.../36-CONTEXT.md` D-09). This phase only keeps draw-1 (already correct, untouched).
- PLACE-07 (Dierenasiel): **mpCost clause moved to Phase 36** (same fold as PLACE-06, D-09). This phase only drops the +25% protection clause + its typo'd inert code (`dienasielActive`/`dierenasielActive` mismatch).
- PLACE-08 (Coert's Caravan): trigger → END_PHASE; all Mosjes −10 at end of turn except Coert variants; drop +15 buff + inert free-activation flag.
- PLACE-09 (Digital Gaming Stop): DIGITAL-EQUIPMENT Piecies +10 MP while active; drop auto-succeed + dead questAutoSuccess.
- PLACE-10 (Skiffa): trigger → ON_QUEST; Social quests +2 dice roll for all players; drop SUBSTANCE/discard theme; also remove the undocumented `getSkiffaRerolls` mechanic (main.js) found in research — unrelated to the new design, would silently stack with it.
- PLACE-11 (Synergy Chamber): once/turn activate a synergy ability without its partner; drop the 3 undocumented bonuses + consumers.
- PLACE-12 (The Void): **DESCOPED — hide from player-facing pools** instead of implementing the "one card activation per turn" cap (ambiguous which of 9 play/activate functions it should gate — not resolvable without a full design pass). Still remove the untexted quest-MP-nullify (questLogic.js:338) since it's dead-code cleanup independent of the hide decision. Card data/effect code stays in the codebase for a future round to finish.

**Success Criteria:**

1. Each of the 10 implemented cards' text matches its engine behavior; the 9 clean Places untouched; Drain Zone and The Void are unreachable from any player-facing deck/booster/starter pool.
2. Per-card tests added (card-test-library and/or engine unit tests); npm test + test:cards green.
3. node --check clean on any touched UI/main files.
4. MP-touching changes: Ronald Kip stacking test green; simulation crash-free, timeout < 25%.
5. PLACE-01/08/10 trigger-dispatch fixes proven through `resolvePlaceEffect`/`startTurn`/`endTurn`, not just the raw effect function (guards against the "TURN_START never fires" class of bug).

**Plans:** 8/8 plans executed

Plans:

- [x] 35-01-PLAN.md — Bank Chilling (loop-all + trigger fix) + Obby #1 (loop-all)
- [x] 35-02-PLAN.md — Arcade (loop-all) + De Box (Tuk widen + log fix)
- [x] 35-03-PLAN.md — Delluft (regression test only) + Dierenasiel (drop +25% clause + typo cleanup)
- [x] 35-04-PLAN.md — Coert's Caravan (replace + trigger fix) + Digital Gaming Stop (rework)
- [x] 35-05-PLAN.md — Skiffa (rework: Social +2 dice bonus, remove getSkiffaRerolls)
- [x] 35-06-PLAN.md — Synergy Chamber (remove 3 dead bonuses, add once/turn partner waiver + UI) — human-verify checkpoint APPROVED
- [x] 35-07-PLAN.md — Drain Zone + The Void dead-code cleanup + hide both from player-facing pools
- [x] 35-08-PLAN.md — docs/card-reference.md update + full-suite phase-gate verification

**Context:** `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md`
**Ruling record:** `.planning/audits/2026-07-14-places-text-audit.md`

### Phase 37: General Quest attempt affordability gate — block attempting a General Quest when the chosen Mosje cannot afford the 20 MP attempt fee (mirror Phase 36's Welloe Force affordability gate). Prevents a Mosje self-destructing by attempting a quest it can't pay for. Reproduce-in-browser first per project rules.

**Goal:** A player can no longer START a General or Personal Quest attempt with a Mosje that cannot afford the flat 20 MP attempt fee — the attempt control is a disabled/greyed picker option (mp < 20), so no Mosje self-destructs from an unaffordable attempt. The single-Mosje General-Quest path (which bypassed the affordability-gating picker) is routed through `showMosjeSelect` like the multi-Mosje path already is. The 20 MP fee and its below-0 lethality stay canonical (phase0-rulings.md:126) — only the pre-attempt gate is added. Reproduced-in-browser-first per CLAUDE.md.
**Requirements**: GATE-01 (General single-Mosje attempt affordability gate, mp >= 20, disabled control — D-02/D-03/D-06), GATE-02 (Personal-Quest gate verified + regression-tested, not regressed — D-01/D-05), GATE-03 (failing-first browser repro spec of the single-Mosje self-destruct — CLAUDE.md reproduce-first), GATE-04 (MP-gate phase verification — Ronald Kip stacking + full sim). Multi-Mosje General picker not regressed — D-04.
**Depends on:** Phase 36
**Plans:** 2/2 plans complete

Plans:
**Wave 1**

- [x] 37-01-PLAN.md — Repro-first fix: failing browser spec -> route single-Mosje General-Quest path through showMosjeSelect -> make spec pass -> Personal-Quest regression test (GATE-01/02/03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 37-02-PLAN.md — MP-gate phase verification: node --check, npm test, Ronald Kip stacking, repro spec, full sim, docs sync (GATE-04)

---

## ▶ DECK COMPLETION TRACK (2026-07-18 — reprioritization)

Driven by the five-deck functional audit (`.planning/audits/2026-07-18-five-deck-functional-audit.md`).
**Goal: make all 5 player-facing duo decks demonstrably functional first.** The audit found the
deck-relevant gaps are a small subset of phases 38–43, and that most of Phase 39's original scope
(Cless Teacher, FPS Coert/West, Chris DDR+DJ 8020, Synergy Chamber waiver) touches cards in **no**
player-facing deck. So the mechanism-phases are re-sequenced into a deck-first queue; non-deck items
are deferred.

**Ordered deck-completion queue (do in this order):**

1. **Phase 38** — Alyssa↔Jisca synergy (Jisca & Alyssa deck). *In verification.*
2. **Phase 39** — Gandoe↔Michelle synergy (The Box deck). *Narrowed to this one deck item.*
3. **Phase 40 (deck slice)** — Chris, Jisca, Coert KasteLuck abilities (3 of the 9). *Complete.*
4. **Phase 41** — Coert's Caravan passive Quest-damage shield (Winston's Kitchen deck).
5. **Phase 43** — Dierenasiel real mechanic (Jisca & Alyssa deck's dead Place).

**Deferred (no player-facing deck — do after the decks ship):** Phase 39 remainder (Cless Teacher,
FPS Coert/West, Chris DDR+DJ 8020, Synergy Chamber waiver); Phase 40 remainder (Ming Natural,
Jeffrey Gambler, Tuk Healer, Coert Kastelein, FPS Coert). **Remaining unknown:** behavior-vs-text
correctness of the 32 wired deck Piecies + 4 Quests — a deep behavioral pass, deferred until the
known gaps above are closed.

---

### Phase 38: Alyssa-Jisca synergy design and implementation — design + wire the DUO_JISCA_ALYSSA starter deck headline synergy (currently declared but null on all three cards). Interactive design session required. Add pair to synergy-text-clarity test table.

**Goal:** The DUO_JISCA_ALYSSA starter deck's headline "party amplifier" synergy is live on-card and engine-wired: while Jisca is on your field each Alyssa (bulldozer + fissa) gains +10 MP at the start of each of your turns, and while an Alyssa is on your field Jisca's first Piecie played each turn gives +10 MP (once per turn). Convention-compliant card text, bot-aware, sim-verified.
**Requirements**: D-01 (party-amplifier fantasy), D-02 (Alyssa +10/turn), D-03 (Jisca first-Piecie +10, once/turn), D-04 (play-reward NOT cost-discount), D-05 (~+15 in-line power)
**Depends on:** None (independent - self-contained synergy design)
**Plans:** 2/2 plans executed — COMPLETE

Plans:

- [x] 38-01-PLAN.md - Repro-first RED card-test + synergyEffect text on 3 cards + hasAlyssaJiscaSynergy detection helper (wave 1)
- [x] 38-02-PLAN.md - Engine wiring: Alyssa start-of-turn +10 + Jisca first-Piecie +10 once/turn (turnManager) + full MP-gate verification (wave 2). Repro spec GREEN; sim 153/160, 0 crashes.

### Phase 39: Gandoe↔Michelle synergy (The Box deck) — wire the DUO_GANDOE_MICHELLE headline synergy, dead in BOTH directions. Deck-completion track item.

**Goal:** The Box deck's two-way Mosje synergy is live: while Gandoe the Destroyer is on your field, Michelle's Tough Gamble rolls that hit the synergy threshold also grant Gandoe +10 MP; while Michelle is on your field, Gandoe's Physical Quests give +15 bonus MP (wire into `PARTNER_QUEST_SYNERGIES`, mirroring West+AZN Cless). Resolve the card-text 5-6 vs engine 4-6 Tough-Gamble threshold mismatch as part of the ruling. Repro-first per CLAUDE.md, sim-verified.
**Requirements**: TBD (interactive ruling — carry the 4-6/5-6 threshold decision)
**Depends on:** None (independent)
**Plans:** 2/2 plans executed - COMPLETE

**Scope note (2026-07-18):** narrowed from the original "all remaining unwired synergy pairs" to the single deck-relevant pair. The non-deck remainder — Cless Teacher/AZN Cless shared-effect, FPS Coert/FPS West stale synergy, Chris DDR+DJ 8020 & Chris+Youri Synergy-Chamber-waiver reach — is **deferred to a later booster-card synergy-fidelity phase** (see Deck Completion Track above). Source inventory: `.planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md`.

Plans:
**Wave 1**

- [x] 39-01-PLAN.md — Repro-first RED: browser card-test + engine unit test proving both synergy directions are dead today (wave 1). Browser spec RED as expected (2 failed, 2 passed); engine spec RED as expected (3 failed, 2 passed).

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 39-02-PLAN.md — Wire both directions in questLogic.js (D-05 PARTNER_QUEST_SYNERGIES row + D-01..D-04 Tough Gamble +10 Gandoe kicker). 39-01 specs GREEN; full MP-gate verification complete; docs synced. Sim 154/160, 0 crashes, 3.75% timeout/click-overlay failures.

### Phase 40: 9-Mosje ability-text to engine reconciliation — resolve the 9 Mosjes (Ming Natural, Jeffrey Gambler, Chris All-Rounder, Jisca, etc.) whose card text describes a different effect than the engine performs. Per-card ruling with Gandoe (code wins / text wins / third design). No batch-fixing.

**Goal:** Verify and close the 3 player-facing deck Mosje reconciliations already landed in the live JS engine: Chris All-Rounder Perfect Setup, Jisca Perfect Combo, and Coert KasteLuck Morning Luck. Keep the non-deck remainder deferred.
**Requirements**: D-01 (Chris gated free activation), D-02 (Jisca 5-6 free field activation), D-03 (KasteLuck turn-start same-turn allowance), D-04 (live-browser proof), D-05 (docs and GSD closeout)
**Depends on:** None (independent)
**Plans:** 1/1 plans executed - COMPLETE

**Deck-completion ordering (2026-07-18):** do the **3 deck-Mosje abilities FIRST** — Chris All-Rounder "Perfect Setup" (dead flag `instantPiecieThisTurn` nothing reads → DUO_CHRIS_YOURI), Jisca "Perfect Combo" (divergent stub, redesign → DUO_JISCA_ALYSSA), Coert KasteLuck "Morning Luck" (text≠engine → DUO_COERT_BINTI). The other 6 (Ming Natural, Jeffrey Gambler, Tuk Healer, Coert Kastelein, FPS Coert + the Chris DDR note) are non-deck and deferred. All rulings + reuse-pattern map already captured in `.planning/todos/pending/2026-07-12-ability-text-engine-reconciliation.md`.

Plans:

- [x] 40-01-PLAN.md - Audited the already-landed implementation commits; focused engine/browser coverage and full validation are green; docs synced. The completed Phase 39 sim remains the broad baseline for the same runtime (154/160, 0 crashes).

### Phase 41: Coert's Caravan passive Quest-damage shield — standalone redesign for the Place-card divergence found by accident during the 2026-07-13 audit. The stale Binti discount is intentionally not restored.

**Goal:** Rework Coert's Caravan into a passive Coert-family Quest-damage shield. The stale Binti discount does not return.
**Requirements**: D-01 (passive place), D-02 (Coert-only shield), D-03 (prevent up to 40 MP Quest damage per Coert Mosje per turn), D-04 (Quest costs still paid), D-05 (non-Quest MP loss not prevented), D-06 (data/docs synced)
**Depends on:** None (independent — already diagnosed, ship anytime)
**Plans:** 1/1 plans executed - COMPLETE

Plans:

- [x] 41-01-PLAN.md - Reworked Coert's Caravan from end-phase drain to passive Quest-damage shield; focused and full validation are green.

### Phase 42: Full-game ability-text vs engine audit — systematic pass over EVERY card's text vs actual effect across mosjes.js, piecies.js, snellePiecies.js, places.js. Per-card interactive rulings, reuse-pattern research first. DEPENDS ON Phase 40 (9-Mosje reconciliation) shipping first.

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 40 (9-Mosje reconciliation must ship first — this is the systematic sweep it seeds)
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 42 to break down)

### Phase 43: Dierenasiel real mechanic ruling — place_dierenasiel is a confirmed full no-op (text honestly reads 'no mechanical effect'). Decide + implement a real passive mechanic for it. Interactive design decision required.

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** None (independent design ruling)
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 43 to break down)

### Phase 44: The Void real implementation ruling — decide + implement the intended mechanic for The Void (per its pending todo). Interactive design decision required.

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** None (independent design ruling)
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 44 to break down)

### Phase 45: TS Bulldozer Comeback text/engine reconciliation — resolve the ts-bulldozer-comeback divergence per its 2026-06-11 todo. Ruling from Gandoe (code wins / text wins / third design).

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** None (independent reconciliation ruling)
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 45 to break down)

### Phase 46: Thematic Piecie Cards for Specific Mosjes

**Goal:** Add 4 new thematic Piecie cards, each tied to a Mosje that currently lacks a dedicated item. Shared design principle (locked in 46-CONTEXT.md): generic base effect anyone can use + a small kicker when the named Mosje's tag-family is on the field — nothing hard-gated, so future Mosjes in those families benefit automatically. All 4: `mpCost: 0`, `requirement: "any"`, UTILITY subtype, `isBoosterOnly: true` (booster pool only, no starter-deck slots), placeholder art.

**Locked card specs (user-approved 2026-07-19):**

| Card | Mosje | Rarity | Effect |
|---|---|---|---|
| Loaded Dice | Jeffrey | ★★ | Your next Quest roll this turn gets +1. JEFFREY-tagged Mosje on field: +2 instead. |
| Boosterpackkie | Coert KasteLuck | ★★ | Draw 1 card, then roll 1d6 — on 5-6 draw 1 additional card. COERT-tagged Mosje on field: also gain 10 MP. |
| Perfect Rhythm | Dancing/DDR Chris | ★ | Your next Piecie activation this turn also draws 1 card. `mosje_chris_ddr` on field: also gain 10 MP. |
| Dikke Plaat | DJ 80/20 | ★★ | Your next Quest roll this turn gets +1. DJ-tagged Mosje on field: +2 instead. |

**Requirements:**

- THEME-01: Loaded Dice — data entry + `effect_loaded_dice` (questPrepBonus setter, JEFFREY tag scan)
- THEME-02: Boosterpackkie — data entry + `effect_boosterpackkie` (draw + 1d6 bonus draw, COERT tag scan for +10 MP)
- THEME-03: Perfect Rhythm — data entry + `effect_perfect_rhythm` (one-shot draw-on-next-Piecie-activation flag, DDR Chris check for +10 MP)
- THEME-04: Dikke Plaat — data entry + `effect_dikke_plaat` (questPrepBonus setter, DJ tag scan)
- THEME-05: Docs — card-reference.md rows for all 4 new cards + note that Keyboard is Coert Hawaiian Tech Savant's thematic item (existing card, no code change)
- THEME-06: No-work confirmations — Coert Kast-elein stays hidden (`disabled: true` already set); Chris All-Rounder deliberately gets no item

**Depends on:** Phase 45
**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 46-01-PLAN.md - Added four thematic booster-only Piecies, effect wiring, Perfect Rhythm one-shot draw hook, focused tests, browser registry coverage, docs, and verification.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 46-02-PLAN.md - Gap closure: gate Boosterpackkie 5-6 bonus draw behind a COERT Mosje, make Perfect Rhythm draw on every later Piecie activation this turn, and extend Dikke Plaat's DJ bonus to exact [Alyssa] Fissa Fissa! (3 UAT design changes).

**Success Criteria:**

1. All 4 Piecies defined in piecies.js with locked effects/rarities; effect functions in piecieEffects.js
2. Kickers detect tag families (JEFFREY/COERT/DJ), not exact cardIds — except Perfect Rhythm's DDR-Chris check
3. Existing passives (Perfect Combo Chain, Lucky Beats, Morning Luck, Brute Force) untouched
4. All 4 cards drop from boosters and appear in deck-builder; none added to starter decks
5. card-reference.md updated (4 new rows + Keyboard pairing note)
6. Full verification sequence green: node --check, npm test, Ronald Kip stacking, sim 0 crashes

### Phase 47: Milestone planning ledger reconciliation and verification backfill routing

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 46
**Plans:** 1/1 plans complete

Plans:
- [x] TBD (run /gsd-plan-phase 47 to break down) (completed 2026-07-20)

### Phase 48: Original requirement verification backfill for Phases 01-06 and 09 using live code, tests, and honest traceability evidence

**Goal:** Every one of the 64 original milestone requirements (28 IMPL-PF-*, 27 IMPL-AR-*, 4 cross-cutting IMPL-*, 5 Phase-9 BUG-*) has an honest, evidence-backed disposition (VERIFIED / SUPERSEDED / GAP-DESCOPED) in a single consolidated traceability matrix, backed by real passing tests that fail if the mechanic breaks — retiring the milestone audit's 0/64 traceability finding. Tests-only: no runtime/src changes (D-04).
**Requirements**: 64 original ids — IMPL-PF-M1/M2, IMPL-PF-P1..P12, IMPL-PF-S1..S4, IMPL-PF-PL1..PL3, IMPL-PF-Q1..Q7, IMPL-AR-M1/M2, IMPL-AR-P1..P13, IMPL-AR-S1..S4, IMPL-AR-PL1..PL3, IMPL-AR-Q1..Q5, IMPL-TEST/LOBBY/SIM/REG, BUG-01..05
**Depends on:** Phase 47
**Plans:** 6/6 plans complete

Plans:
**Wave 1** *(parallel — each owns distinct test + fragment files)*
- [x] 48-01-PLAN.md — Physical Force Piecies map + gap-fill (IMPL-PF-P1..P12)
- [x] 48-02-PLAN.md — Artistic Rhythm Piecies map + gap-fill (IMPL-AR-P1..P13)
- [x] 48-03-PLAN.md — Snelle Piecies (both decks) map + gap-fill (IMPL-PF-S1..S4, IMPL-AR-S1..S4)
- [x] 48-04-PLAN.md — Places + Quests + cross-cutting map (6 Places, 12 Quests, IMPL-TEST/LOBBY/SIM/REG)
- [x] 48-05-PLAN.md — Mosje abilities + BUG-01..05 gap-fill + 09-VERIFICATION.md backfill (IMPL-*-M1/M2, BUG-01..05)

**Wave 2** *(blocked on Wave 1)*
- [x] 48-06-PLAN.md — Consolidate 64-row 48-VERIFICATION.md, tick REQUIREMENTS.md with evidence, full phase-gate verification

### Phase 49: Legacy execution evidence closure for plans without summaries and off-roadmap phase artifacts

**Goal:** Close the legacy execution-evidence debt catalogued by the Phase 47 reconciliation manifest — 9 historical plans that never got a SUMMARY.md, 9 off-roadmap phase directories (+2 duplicate-directory routes), and the stale pending todos — giving every item ONE honest, evidence-backed disposition (SUPERSEDED / INSUFFICIENT-EVIDENCE-PRESERVED / GENUINELY-UNFINISHED), without fabricating any historical SUMMARY.md and without deleting or renaming any legacy directory.
**Requirements:** Docs/evidence-only; dispositions trace to 47-RECONCILIATION-MANIFEST.md rows + CONTEXT decisions D-01..D-08. No REQUIREMENTS.md ticks (that was Phase 48's scope); validate.health may legitimately remain "degraded" (D-01 forbids fabricating summaries).
**Depends on:** Phase 48
**Plans:** 2 plans

**Status:** Complete (2/2 plans)

Plans:
- [x] 49-01-PLAN.md — Evidence-verified closure ledger (49-VERIFICATION.md): 9 plans-without-summaries + 9 off-roadmap dirs + 2 duplicate routes + 8 todos, each disposition backed by a live git/test existence check
- [x] 49-02-PLAN.md — Discoverability closure markers (9) + honest todo hygiene (close 2 shipped, subset-record 2, leave 4 open-phase untouched) + post-closure health appendix

---

### Phase 36: Piecie/Snelle Piecie/Place/Personal Quest MP Cost Model Redesign — default all costs to 0, add explicit tribute payment only for cards whose text requires it

**Goal:** Every Piecie and Snelle Piecie's `mpCost` matches what its own printed text actually
promises — audited card-by-card against the existing "text wins" convention — with exactly one
card (Welloe Force) keeping a real, player-chosen, affordability-gated tribute payment. Places and
Personal Quests are confirmed (via full audit) to need no cost/tribute work of their own; the one
narrow Place-text dependency (Delluft/Dierenasiel referencing now-corrected Piecie costs) is
explicitly ruled, not silently left inconsistent.

**Requirements:**

- COST-01: Full text audit — all 70 Piecies, ruling table (36 currently nonzero-cost cards read in full; expected outcome 35 correct to `mpCost: 0`, 1 (Welloe Force) keeps its cost)
- COST-02: Full text audit — all 20 Snelle Piecies, ruling table (10 currently nonzero-cost cards read in full; expected outcome all 10 correct to `mpCost: 0`, including an explicit ruling for `snelle_blensen`'s conditional-cost phrasing)
- COST-03: Personal Quest audit closure — confirm (and document) that none of the 6 Personal Quests require tribute; no code change
- COST-04: Resolve Delluft/Dierenasiel's Place-text dependency on the corrected Piecie costs (checkpoint decision + implementation)
- COST-05: Build the reusable tribute-payer-picker + affordability-gate helper (generalizes `showMosjeSelect`)
- COST-06: Rework Welloe Force (`piecie_welloe_force`) to use the new picker + affordability gate, fixing its hardcoded-payer and missing-affordability-check bugs
- COST-07: Wire tribute into any additional cards the full audit confirms need it (expected: none beyond Welloe Force)
- COST-08: Correct every Piecie/Snelle Piecie `mpCost` field to match the final ruling
- COST-09: Full sim + Ronald Kip stacking test re-run + docs update (phase gate) after the combined data + engine changes land

**Depends on:** Phase 35
**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 36-01-PLAN.md — Full audit ruling doc + mpCost corrections (Piecies + Snelle Piecies) + regression test (COST-01, COST-02, COST-03, COST-07, COST-08)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 36-02-PLAN.md — Tribute-payer picker + Welloe Force rework + engine/browser test coverage (COST-05, COST-06)
- [x] 36-03-PLAN.md — Checkpoint: Delluft/Dierenasiel Place-text fate decision (COST-04)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 36-04-PLAN.md — Apply Delluft/Dierenasiel decision + docs/card-reference.md update + full phase-gate verification (COST-04, COST-09)

**Success Criteria:**

1. Every Piecie/Snelle Piecie's `mpCost` matches its own printed text; `piecie_welloe_force` is the sole nonzero-cost card
2. Welloe Force lets the player choose the payer and blocks entirely when unaffordable — its two prior bugs (hardcoded payer, no affordability check) are fixed
3. Personal Quest audit closed (no tribute found); Delluft/Dierenasiel's text matches an explicit, recorded ruling
4. docs/card-reference.md fully current; full verification sequence (node --check, npm test, npm run test:cards incl. Ronald Kip, npm run test:sim) green with 0 crashes, timeout < 25%

### Phase 50: Rarity-tier card redesign (4 tiers: boxed ★–★★★, full-art ★★★★)

**Goal:** Card faces show rarity as a visual tier (star count of `card.rarity`): tiers 1–3 boxed art with escalating frame (soft line / type-colour line / rainbow foil + cosmos dots), tier 4 full art with holographic shine. Every card type can be any tier. Built on the card-frame-v1 branch work.
**Requirements:** Spec in `.planning/RARITY-TIERS-DESIGN.md`; reference board in `docs/design/rarity-tiers/`. No changes to Quest cards, game logic, drop weights or copy limits. 745-test suite stays green.
**Depends on:** card-frame-v1 (unmerged, branch ui/card-frame-v1)
**Plans:** TBD — implement tier 4 first, then tiers 1–3, with a visual approval gate after each.

**Status:** Discuss/plan pending

### Phase 51: Card refinement — hand cards, field tiles and remaining card sizes in the tier style

**Goal:** Refine how the rarity-tier card design (Phase 50) looks at hand size, as field tiles on the board, and in any other place cards render (opponent area, graveyard, deck builder, detail views), so each size reads well and feels like the same card family.
**Requirements:** Scope and details to be set in discuss-phase. Builds on Phase 50 (branch ui/rarity-tiers). No changes to game logic, drop weights or copy limits.
**Depends on:** Phase 50
**Plans:** TBD

**Status:** Discuss pending
