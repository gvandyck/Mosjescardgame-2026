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

*Last updated: 2026-05-23*
