# Card Implementation Roadmap

**7 phases** | **~43 unique cards + multiplayer features** | **Sequential execution**

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
- BUG-01: Quest roll threshold displays wrong tier — Strategy Puzzle shows 3+ instead of 2+ when player has Mental ★★★ (stat level 3)
- BUG-02: Dubbele Dosis Piecie discards immediately after activation instead of persisting until end of turn
- BUG-03: Senor West wrong-guess penalty drives MP to −10 when player is at 0 MP (floor not respected); should degrade level −1 or block activation if already at minimum level
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
- [ ] 10-01-PLAN.md — Prerequisite: add subtype to Mosje slots (turnManager.js) + test scaffolds
- [ ] 10-02-PLAN.md — Quest economy: all successMP +20, failMP capped at -20 (quests.js)
- [ ] 10-03-PLAN.md — Equipment effect scaling + Tikker bug fix (piecieEffects.js)
- [ ] 10-04-PLAN.md — Deck-out engine rule: reshuffle + skipNextTurn (turnManager.js)
- [ ] 10-05-PLAN.md — Deck compositions + docs + full verification

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

*Last updated: 2026-05-24*
