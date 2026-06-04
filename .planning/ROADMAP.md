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
| 10 | Deck Balance | Fix game stalling — insufficient MP generation across all 3 decks causes games to end in deck-out or stalemate instead of someone reaching Level 3 | BAL-01 through BAL-N | All 3 decks can reliably progress to Level 3; deck-out eliminated; game length reduced to target range |
| 11 | Bot Opponent | Add a basic AI opponent for offline single-player matches. Bot plays Piecie cards, activates Places, attempts Quests, levels its Mosje, and uses Mosje abilities. Players opt in via "Play Offline" checkbox in room creation. | BOT-01 through BOT-05 | Player can start and complete a full game against the bot; bot makes valid moves every turn; no Firebase required for offline mode |
| 16 | Eendjes Voeren Place | Transform Eendjes Voeren from a Piecie into a Place: resilience aura (all resilient traits max ??? while active) + Michelle +10 MP each End Phase. | EEV-01 through EEV-05 | place_eendjes_voeren in places.js; getMosjeTrait maxes resilient; Physical Force deck updated; piecie retired to booster-only |
| 17 | Place Recovery Mechanics ? | Unified per-player graveyard (Places + Mosjes + Piecies all go to owner's discard). Rework Slecht Gezet (ownership-aware: return own / destroy opponent's), rework Huisbaas (return Place from own discard), add new snelle Chillingsvoorbij! | PLACE-REC-01/02/03 + ENGINE-01/02/03 | DONE — 821 tests pass, 0 sim crashes. Engine unified, 3 recovery cards live |
| 18 | Dead-Flag Card Fixes ? | Wire 6 cards whose effect flags were set but never consumed. Wave 1 (engine + persistence): Tweede Kans reroll, Battle Concert redirect, Those Eyelashes Snelle-block — all persist on field. Wave 2 (UI-pick): Ronald Master Plan (play Piecie from discard), Ming Future Sight (quest peek/bottom), Tuk Perfect Placement (peek 5 take 2, face-down removed). | DEADFLAG-01 through 06 | DONE — 837 tests pass, 0 sim crashes. All 6 cards match their descriptions; no dead flags remain |
| 19 | UI-Modal Card Completions ? | Wire the 2 remaining "deferred — needs UI" Mosje abilities to existing modals (the reveal flags `opponentHandPeeked` + `_ronaldPeek` were dead). Plan 01 — **FPS West**: Geen Raad-style guess-a-card-type-in-opponent's-hand game, correct +70 MP / wrong -20 MP (old text archived). Plan 02 — **Ronald Chef**: pay 20 MP to pick an opponent hand card and LOCK it (unplayable) until your next turn, 3-turn cooldown. (Geen Raad was already implemented — card-reference was stale. Emergency Swap ? reworked into Leipe Swap, Phase 20.) | UICARD-01/02 | DONE — 850 tests pass, 0 sim crashes. FPS West guess game (+70/-20) live; Ronald hand-card lock + 3-turn cooldown enforced across all 4 play paths; both dead flags gone |
| 20 | Leipe Swap (temporary MP swap) ? | Rework the unused Emergency Swap into **Leipe Swap** (*leip* = Dutch slang for sick/crazy; rarest tier ???? = 1 per deck; no MP cost; stays on field 1 turn). On your turn, pick one of your Mosjes + an opponent Mosje and swap their MP; at the END of your turn swap the *current* MP back. Levels banked off the borrowed progress stick; leftover MP is handed to the other Mosje (double-swap). Imperative engine: effect + endTurn revert + target modals; rename old emergency_swap refs across both card systems + docs. | LEIPE-01 | DONE — 856 tests pass, 0 sim crashes. Leipe Swap swaps/reverts MP, banked levels persist, max-rarity deck cap set, old refs renamed |
| 21 | Quest Behaviors + Cleanup ? | **Bucket C** — wire 3 engine-doable quest behaviors via static quest-def fields read by `resolveQuest`: draw-on-success (Artistic Expression + Late Night Questing draw 2), Elimination Challenge (opponent -30 MP on success), Hack Mainframe Hacker/FPS -1 threshold id fix. **Bucket A** — delete dead `effect_jensen`/`effect_lucky_coin` stubs + tidy the unrun `.js` test, refresh stale `card-reference.md` rows (Geen Raad, Huisbaas, the 4 wired quests). (Bucket D — 3-way outcomes + turn-action gates — deferred.) | QUEST-01/02/03 + CLEAN-01 | DONE — 867 tests pass, 0 sim crashes. Draw-on-success + Elimination -30 MP + Hack FPS bonus wired; dead stubs removed; card-reference rows corrected |
| 22 | Call of the Welloes | Implement the full Call of the Welloes Piecie effect: summon a Mosje from the Welloe pile into a free active slot (level+MP restored from welloe record); Piecie stays on field as the anchor — if the Piecie leaves play the summoned Mosje immediately returns to the Welloe pile. Requires: UI pick (showOptionSelect), new `returnMosjeToWelloe` engine helper, end-of-turn sweep check, `linkedMosjeCardId` field on piecieSlot, `summonedByPiecie` field on mosjeSlot. No free slot ? effect silently cancelled. Welloe pile empty ? effect silently cancelled. | CALLW-01 through CALLW-04 | effect_call_of_welloes functional; summon + return lifecycle correct; 0 sim crashes; all tests pass |

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
- [ ] 07-01-PLAN.md — Stats data layer: statsStore.js, leaderboardStore.js, matchRewards.js stats hook, accountSetup.js profile seeding, RTDB rules
- [ ] 07-02-PLAN.md — Leaderboard UI: leaderboard.html, leaderboard.css, leaderboard.js, index.html nav button
- [ ] 07-03-PLAN.md — Disconnect loss hook: registerDisconnectLoss + cancelDisconnectHooks in syncManager.js

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
- CARD-COMP-QUEST: All partial Quests audited — functional quests upgraded to `implemented`; OR-condition / interactive-pick quests documented with specific deferred reasons naming the blocking primitive (UI selection primitive does not exist yet — deferred to UI phase per Phase 5 decision)
- CARD-COMP-PLACE: place_synergy_chamber duration extension and ability-cost reduction

**Plans:** 6 plans

Plans:
- [ ] 08-01-PLAN.md — Mosje ability fixes: Tuk Architect deck reorder, Ronald Mastermind sort-to-top, Jeffrey quest-bonus fix, Ronald Chef/FPS West peek flags (src/abilities/mosjeAbilities.js)
- [ ] 08-02-PLAN.md — Snelle bug fixes: Jantje×3 const/let crash, Blensen free-cost flag (src/abilities/snelleEffects.js)
- [ ] 08-03-PLAN.md — Piecie stub completions: Zie Je Die Dingetjes two-call keep pattern, Dingetje Toch flag documentation (src/abilities/piecieEffects.js, src/engine/turnManager.js)
- [ ] 08-04-PLAN.md — Snelle flag enforcement in loseMP: drainReversal, negateNextAttack, negateNextPiecie, dierenasiel; Synergy Chamber JSDoc (src/engine/mpManager.js, src/abilities/placeEffects.js)
- [ ] 08-05-PLAN.md — Verification: npm test, simulation run, card-reference.md status updates (docs/card-reference.md)
- [ ] 08-06-PLAN.md — Quest audit: classify all partial quests as implemented or deferred-with-reason; add DEFERRED comments in quests.js (src/data/quests.js, docs/card-reference.md)

**Success Criteria:**
1. No card function in any ability file returns early with a "pending UI" or "deferred" stub comment
2. All cards in card-reference.md with status `partial` are updated to `implemented` or `advanced`
3. Existing 588+ tests still pass
4. Simulation runs without new crashes

---

### Phase 9: UI & Engine Bug Fixes

**Goal:** Fix 5 playtesting bugs found in the live browser game: quest roll threshold display, Dubbele Dosis Piecie card lifecycle, Senor West MP floor + level-degrade fallback, Lucky Coin activation guard, DJ Lucky Mixer turn modifier redesign.

**Requirements:**
- BUG-01: Quest roll threshold displays wrong tier — Strategy Puzzle shows 3+ instead of 2+ when player has Mental ??? (stat level 3)
- BUG-02: Dubbele Dosis Piecie discards immediately after activation instead of persisting until end of turn
- BUG-03: Senor West wrong-guess penalty drives MP to -10 when player is at 0 MP (floor not respected); should degrade level -1 or block activation if already at minimum level
- BUG-04: Lucky Coin coin flip resolves before checking Piecie slot availability — player can flip risk-free with full slots; slot check must run first and block activation if no slots free
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

**Goal:** Fix game stalling — insufficient MP generation across all 3 starter decks causes games to end in deck-out or stalemate before anyone reaches Level 3. Fix by reworking underused cards, adjusting deck compositions, and/or tweaking rules. Prefer reworking existing cards over adding new ones.

**Requirements:**
- BAL-01: Digital Control stalling — too many draw-only cards, not enough reliable MP gain; Coert's draw ability bleeds MP
- BAL-02: Physical Force — adequate direct MP but lacks fallback when quests fail; emergency_healings only delays stalls
- BAL-03: Artistic Rhythm — post-bug-fix state unknown; verify balance after Phase 8 fixes
- BAL-04: Quest cost vs reward economy — quests require MP upfront; if failing quests, net negative
- BAL-05: Deck-out vulnerability — 15-17 card decks run dry before game ends

**Success Criteria:**
1. Digital Control can reliably reach Level 3 without deck-out
2. All 3 decks have at least 2 clear paths to MP generation per game
3. Games end with a winner (Level 3) rather than stalemate/deck-out
4. Quest economy feels fair — attempting quests is never a pure drain
5. Changes are backwards-compatible with existing card implementations

**Plans:** 5 plans

Plans:
- [x] 10-01-PLAN.md — Prerequisite: add subtype to Mosje slots (turnManager.js) + test scaffolds
- [x] 10-02-PLAN.md — Quest economy: all successMP +20, failMP capped at -20 (quests.js)
- [x] 10-03-PLAN.md — Equipment effect scaling + Tikker bug fix (piecieEffects.js)
- [x] 10-04-PLAN.md — Deck-out engine rule: reshuffle + skipNextTurn (turnManager.js)
- [x] 10-05-PLAN.md — Deck compositions + docs + full verification

---

### Phase 11: Bot Opponent

**Goal:** Add a basic AI opponent so players can practice or play offline without needing a second human. The bot uses simple heuristics (no ML, no tree search) and drives the same engine action functions a human player calls.

**Requirements:**
- BOT-01: Bot decision loop — on bot's turn, pick and execute actions using heuristics (play Piecies, activate Places, attempt Quests, use Mosje ability)
- BOT-02: Offline room mode — "Play Offline" checkbox on the lobby form bypasses Firebase room creation and starts a local-only game immediately
- BOT-03: Bot identity — bot gets a name, a starter deck selection, and a player slot (player_2) in the engine state
- BOT-04: Bot turn driver — after the human ends their turn, automatically drive the bot's turn without any UI input (with a short delay so moves are readable)
- BOT-05: Full game loop — offline game runs through win conditions (Level 3 / knockout) and shows the result screen

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

**Goal:** Eliminate all silent no-ops in the engine — status effects that are pushed but never read, stub functions that return early, snelle flags set but never consumed, and partial card mechanics deferred to UI. Every card that claims to protect, halve, or modify MP must actually do so.

**Requirements:**
- STUB-01: MP_LOSS_HALVED — wire into loseMP() in mpManager.js (5 cards: Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes)
- STUB-02: MP_LOSS_REDUCTION — wire into loseMP() (3 consumers: Laat me chillen, FF Haaltje Nemen, The Protector snelle flag)
- STUB-03: WELLOE_SHIELD — implement no-knockout protection check in victoryChecker.js (1 card: Mosje Shield)
- STUB-04: negateNextSearch — wire into deck draw logic in turnManager.js (1 card: Jammertje Gepakt)
- STUB-05: doubleNextPiecie — implement double-activation executor logic (1 card: Double Trigger)
- STUB-06: FF Haaltje Nemen undefined variable — fix console.log referencing undefined `reduction`
- STUB-07: Dingetje Toch — wire _dingetjeTochActive flag consumption in piecie requirement checker
- STUB-08: SNOEIERTJE_COST — cleanup: push is never consumed (questBonusMP handles the real logic); remove the dead push or document clearly
- STUB-09: Dierenasiel cost-waiver — move 0-MP PET ability cost-waiver from UI-only to engine guard
- STUB-10: Synergy Chamber cost/duration reduction — integrate into ability activation caller
- STUB-11: Bagga of Greed discard-one-of-two — wire the `_baggaDiscard = true` flag into UI selection handler (draw 2, discard 1 is currently only flagged, not enforced)
- STUB-12: Emergency Swap — implement ability-copy selection or document as deferred with explicit reason
- STUB-13: Huisbaas — implement Place search from deck or document as deferred with explicit reason
- STUB-14: Welloe Force redirect — implement damage redirect or document as deferred with explicit reason
- STUB-15: MP Adjuster hardcoded 50 — wire UI exact-value selection or document as deferred
- STUB-16: FPS West + Ronald Chef hand reveal — wire opponentHandPeeked flag to actual UI hand reveal

**Success Criteria:**
1. Every status effect type that is pushed to statusEffects is either checked in loseMP/turnManager/victoryChecker OR explicitly documented as deferred with a named blocking primitive
2. No function in any ability file returns early with a silent no-op where real behaviour was intended — all are either implemented or tagged `// DEFERRED: <reason>`
3. All snelle flags that are set have corresponding read-points in the engine
4. 664+ tests pass, 0 simulation crashes
5. card-reference.md updated: all items that are now implemented changed to `implemented`; all remaining deferred items given a specific reason naming the missing primitive

**Plans:** 5 plans

Plans:
- [x] 12-01-PLAN.md — Engine wiring: MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD checks wired into loseMP() and markMosjeDefeated(); fix FF Haaltje Nemen ReferenceError; restore push site values
- [x] 12-02-PLAN.md — Flag wiring: negateNextSearch in phaseDrawCard, STUB-05 verification, dingetjeToch documentation, SNOEIERTJE_COST dead push removal
- [x] 12-03-PLAN.md — Place mechanics: Dierenasiel 0-MP guard and Synergy Chamber cost reduction in useMosjeAbility
- [x] 12-04-PLAN.md — UI-gated interactions: Bagga of Greed discard picker, Welloe Force redirect target, MP Adjuster value picker (via existing modal functions)
- [x] 12-05-PLAN.md — Deferred docs: Emergency Swap and Huisbaas DEFERRED comments, FPS West/Ronald Chef flag comments, card-reference.md full update

---

### Phase 13: Action Animation Feedback

**Goal:** Add visual animation feedback to game actions so players can clearly see what happened — MP gains, MP losses, attacks, quest results — without reading the log.

**Status:** COMPLETE (implemented by gvandyck, 2026-05-31)

**Plans:** 1 plan
Plans:
- [x] 13-01-PLAN.md — Action animation system: actionAnimations.js module, boardRenderer wiring, CSS animations for MP gain/loss/attack/quest events

---

### Phase 14: Physical Equipment Cards & Boxing Ring

**Goal:** Add a Physical equipment Piecie suite (mirroring the Digital Keyboard/Mouse/Controller set), a new Boxing Ring place, and update The Gym to give CLESS-tagged Mosjes a bonus — giving Fighting/Physical decks a proper item identity and making Gandoe + Cless cards meaningfully stronger in themed setups.

**Requirements:**
- PHYS-01: Dumbbells (?, PHYSICAL-EQUIPMENT) — Physical Mosje on field: +20 MP; Physical ???: also draw 1 card
- PHYS-02: Boxing Gloves (??, PHYSICAL-EQUIPMENT) — Physical ??+ Mosje: +25 MP; GANDOE tag: +40 MP + apply MP_LOSS_HALVED 1 turn
- PHYS-03: Skipping Rope (?, PHYSICAL-EQUIPMENT) — Physical Mosje: +1 next Quest roll + draw 1 card; no Physical Mosje: draw 1 only
- PHYS-04: Protein Shake (??, PHYSICAL-EQUIPMENT + FOOD) — +25 MP to active Physical Mosje; +35 MP if Boxing Ring is active place
- PHYS-05: Boxing Ring (???, Place) — ON_QUEST: Physical Mosjes +15 MP any outcome; GANDOE tag: +25 MP instead; END_PHASE: FIGHTING type +10 MP, non-FIGHTING -5 MP
- PHYS-06: Gym update — Add CLESS-tag bonus: +20 MP at END_PHASE when any CLESS Mosje is on field (regardless of physical trait level)

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
- [x] 14-01-PLAN.md — Physical Equipment Piecies: Dumbbells, Boxing Gloves, Skipping Rope (data + effects + tests)
- [x] 14-02-PLAN.md — Protein Shake + Boxing Ring place (data + effects + tests)
- [x] 14-03-PLAN.md — Gym patch (CLESS bonus) + card-reference.md update + simulation check

---

### Phase 15: Starter Deck Reworks

**Goal:** Redesign all three starter decks around real-life relationships and thematic identities. Add 4 new IRL-themed cards (Toennoe place, Tesla place, Kickboxing Bootcamp quest, Tijd voor Winston Jaaa quest) with dedicated engine wiring. Every card in every deck earns its slot.

**Final deck compositions:**

Physical Force — Gandoe Destroyer + Michelle Iron Tuk (couple IRL, boxing theme):
Piecies: Boxing Gloves, Bowie & Stormey, Eendjes Voeren, Laat me Chillen, Kannetje Melk, Protein Shake, Affoe ×2, Dubbele Dosis, Tikker
Snelle: Not Today!, Emergency Healings, Jensen!, Lucky Coin
Places: Boxing Ring, Toennoe (NEW)
Quest: Kickboxing Bootcamp (NEW personal quest)

Digital Control — Coert Tech + Binti Sharp Tongue (couple IRL, food-double synergy + Tesla loop):
Piecies: Kannetje Melk ×3, Varkenspootjes, Pot of Weed, Dubbele Dosis ×2, Bong Hit Demolition, Redbull, Keyboard, Controller
Snelle: Jensen! ×2, Lucky Coin, Counter Strikka
Places: Tesla (NEW), Bank Chilling
Quest: Tijd voor Winston Jaaa (NEW personal quest)

Artistic Rhythm — Youri Speedrunner + Chris DDR (gaming + dancing, wired synergy):
Piecies: Kannetje Melk ×2, Affoe ×2, Pot of Weed, Dubbele Dosis ×2, Controller, Synergy Field, Grammetje Pieter
Snelle: Lucky Coin ×2, Jensen!, Ff Haaltje Nemen
Places: Quest Haven, Bank Chilling
Quest: quest_improvise

**New cards (4):**
- DECK-NEW-01: place_toennoe — END_PHASE: GANDOE Mosje +20 MP, MICHELLE/TUK Mosje +15 MP, both active: +10 bonus each. New effect function in placeEffects.js.
- DECK-NEW-02: quest_personal_kickboxing_bootcamp — requiredMosjeId: mosje_michelle. Physical roll 4+ alone, 2+ with Gandoe on field. If Gandoe active: questLogic adds +2 diceBonus. Success: +80 MP. Fail: -20 MP.
- DECK-NEW-03: place_tesla — Requires Coert active to play (activation guard in main.js). TURN_START: COERT +20 MP, BINTI +20 MP, both active: +10 each. Coert defeated: Tesla destroyed ? sent to player discard (hook in victoryChecker.js).
- DECK-NEW-04: quest_personal_winston_tijd — requiredMosjeId: mosje_binti. Requires place_tesla active. Tesla returns to player hand. Auto-succeed: +100 MP. Recover piecie_varkenspootjes from player discard if present. Logic in questLogic.js.

**Requirements:**
- DECK-01: Physical Force mosjes ? mosje_gandoe_destroyer + mosje_michelle
- DECK-02: Physical Force piecies — full list as above (Boxing Gloves, Bowie & Stormey, etc.)
- DECK-03: Physical Force places ? Boxing Ring + Toennoe (NEW)
- DECK-04: Physical Force quest ? quest_personal_kickboxing_bootcamp (NEW)
- DECK-05: Digital Control mosjes ? mosje_coert_tech + mosje_binti
- DECK-06: Digital Control piecies — full list as above (Kannetje Melk ×3, Varkenspootjes, etc.)
- DECK-07: Digital Control places ? Tesla (NEW) + Bank Chilling
- DECK-08: Digital Control quest ? quest_personal_winston_tijd (NEW)
- DECK-09: Artistic Rhythm mosjes ? mosje_youri + mosje_chris_ddr
- DECK-10: Artistic Rhythm piecies — full list as above (Controller replaces F1 Telemetry)
- DECK-11: Artistic Rhythm quest ? quest_improvise (replacing quest_personal_lucky_crescendo)
- DECK-12: Engine — Tesla activation guard in main.js (Coert required to play card)
- DECK-13: Engine — victoryChecker.js: Coert defeated ? Tesla destroyed, sent to discard
- DECK-14: Engine — questLogic.js: Kickboxing Bootcamp +2 diceBonus when Gandoe active
- DECK-15: Engine — questLogic.js: Winston quest auto-succeed, Tesla to hand, recover Varkenspootjes
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
- [ ] 15-01-PLAN.md — Physical Force rework: Gandoe+Michelle pair, deck composition, Toennoe place, Kickboxing quest + questLogic
- [ ] 15-02-PLAN.md — Digital Control rework: Coert+Binti pair, deck composition, Tesla place + engine hooks, Winston quest + questLogic
- [ ] 15-03-PLAN.md — Artistic Rhythm rework: Youri+Chris DDR pair, deck composition, synergyWith updates, isBoosterOnly fixes, simulation alignment, docs

---


---

### Phase 22: Call of the Welloes

**Goal:** Implement the full Call of the Welloes Piecie effect — summon a Mosje from the owner’s Welloe pile into a free active slot at restored MP/Level; the Piecie is the anchor, and when it leaves play the summoned Mosje returns to the Welloe pile. Two new tracking fields only (`piecieSlots[i].linkedMosjeCardId`, `activeSlots[i].summonedByPiecie`).

**Requirements:**
- CALLW-01: effect_call_of_welloes — silent cancel guards + welloe-pick pending flag
- CALLW-02: returnMosjeToWelloe engine helper — push to welloe[] + null slot, no defeat side-effects
- CALLW-03: End-of-turn sweep — return summoned Mosjes whose anchor Piecie has left play
- CALLW-04: confirmCallOfWelloes summon executor + main.js showOptionSelect UI flow

**Plans:** 3 plans

Plans:
- [x] 22-01-PLAN.md — Engine return path: returnMosjeToWelloe helper + endTurn sweep hook (TDD)
- [x] 22-02-PLAN.md — Summon path: effect_call_of_welloes + confirmCallOfWelloes + description fix (TDD)
- [x] 22-03-PLAN.md — UI wiring: main.js _callOfWelloesPending modal branch + card-reference.md (human-verify)
- [x] 22-04-PLAN.md — Gap closure: mechanic revision (Level 1/50 MP, defeat-on-sweep, persistence guard) (TDD)
- [x] 22-05-PLAN.md — Gap closure: bidirectional destroy — Piecie discarded immediately when linked Mosje defeated (TDD)

**Success Criteria:**
1. effect_call_of_welloes functional; summon + return lifecycle correct
2. Summoned Mosje restores welloe-recorded MP/Level (not Level 1 / 0 MP)
3. Empty Welloe pile or no free slot ? effect silently cancelled (no UI, no error)
4. All tests pass; 0 simulation crashes
---

### Phase 23: Graveyard System

**Goal:** Normalize the graveyard (discard pile) into a clean, modular system ready for graveyard-themed card mechanics. Fix silent-removal bugs in Klaar met Jou and Those Eyelashes. Standardize all entries as typed objects. Rename "discard pile" ? "Graveyard" in all UI labels and card descriptions.

**Requirements:**
- GRAV-01: Fix Klaar met Jou — discarded hand card must go to opponent's graveyard
- GRAV-02: Fix Those Eyelashes — discarded hand cards must go to owner's graveyard
- GRAV-03: Normalize graveyard entry format — all entries as `{ cardId, name, type, ...meta }` objects (no bare strings)
- GRAV-04: Rename `player.discard` ? `player.graveyard` across engine, UI, and tests
- GRAV-05: Rename "Graveyard" in all UI labels, card descriptions, and docs (discard pile ? Graveyard)
- GRAV-06: Graveyard viewer shows card names, types, and counts clearly; ready for future filtering

**Plans:** 2 plans\n\nPlans:\n- [ ] 23-01-PLAN.md — graveyardUtils.js + player.discard rename + Klaar met Jou + Those Eyelashes fixes (TDD)\n- [ ] 23-02-PLAN.md — UI rename (Graveyard label + modal) + card descriptions + docs

**Success Criteria:**
1. No card removal bypasses the graveyard — every destroyed/discarded card is visible
2. All graveyard entries are typed objects with at minimum `{ cardId, name, type }`
3. UI label reads "Graveyard" everywhere; card descriptions updated
4. All existing tests pass; 0 regressions

---

## Build Order Rationale

1. **Mosje abilities first** — Foundation for deck synergies and playstyles
2. **Piecies second** — Most of a deck, bulk of effects
3. **Snelle Piecies third** — Instant responses, fewer interdependencies
4. **Places fourth** — Environmental effects, moderate complexity
5. **Quests fifth** — Most complex (roll mechanics), depends on other systems
6. **Integration last** — After all cards work individually

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

*Last updated: 2026-06-02*
