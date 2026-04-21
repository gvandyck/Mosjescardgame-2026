# Phase 9 Report — Simulation Harness & Balance Analysis

## Overview

Phase 9 delivered a complete deterministic simulation harness for Mosjescardgame-2026. The harness runs seeded 1-vs-1 AI games, collects per-game stats, and aggregates results into a balance report.

## What Was Built

| Step | File | Description |
|------|------|-------------|
| 0 | `src/simulation/starter-decks.ts` | Three pre-built 38-card starter decks (Physical Force, Digital Control, Artistic Rhythm) |
| 0 | `src/simulation/bootstrap-registry.ts` | Side-effect import that registers all card modules before simulation runs |
| 1 | `src/simulation/ai-player.ts` | Deterministic AI: draw → play up to 2 piecies → attempt quest → switch if MP<20 |
| 2 | `src/simulation/game-runner.ts` | Runs one game between two AI players; returns `GameResult` with stats |
| 3 | `src/simulation/run-simulation.ts` | Runs 3 matchups (33-34 games each) → `SimulationReport` |
| 4 | `src/simulation/run-once.ts` | CLI script that executes 100 games and writes `docs/simulation-report.*` |

## Test Coverage

- `tests/simulation/ai-player.test.ts` — 6 tests verifying full-turn execution, draw, piecie play, empty-hand skip, quest attempt, and Mosje switch
- `tests/simulation/game-runner.test.ts` — 4 tests verifying no-crash completion, winner/timeout invariant, stats population, and graceful bad-card handling

All 497 tests pass. Suite coverage: **99.41% statements / 90.89% branches**.

## Simulation Results (100 games, seed-deterministic)

Matchup | P1 Wins | P2 Wins | Timeouts | Avg Turns
--------|---------|---------|----------|----------
Physical Force vs Digital Control (33 games) | 14 (42.4%) | 3 (9.1%) | 16 (48.5%) | 35.7
Digital Control vs Artistic Rhythm (33 games) | 4 (12.1%) | 20 (60.6%) | 9 (27.3%) | 27.7
Artistic Rhythm vs Physical Force (34 games) | 13 (38.2%) | 15 (44.1%) | 6 (17.6%) | 22.0

**Most common win condition:** `level_3`  
**Most played card:** `energy-surge`  
**Total crashes:** 0

## Balance Findings

### 1. Physical Force over-performs vs Digital Control
Physical Force wins 14 of 17 decisive games (82%) against Digital Control. This exceeds the 65% flag threshold and should be reviewed.

### 2. Artistic Rhythm over-performs vs Digital Control
Artistic Rhythm wins 20 of 24 decisive games (83%) against Digital Control. The `dj-8020` mosje starting with 20 MP provides a significant early advantage from DJ rhythm synergies.

### 3. High timeout rate in Physical Force vs Digital Control
48.5% of games timeout at 60 turns. Digital Control's low-MP gain cards struggle to end games decisively. Consider making Digital Control quests easier to complete or adding a momentum-win trigger.

### 4. Low quest engagement
Quests across all three starter decks were never completed in any game. The AI's quest-attempt logic triggers correctly but `quest_attempted` events are not reflected in `questsCompletedByPlayer` because the quest cards in starter decks use roll-based mechanics that the AI doesn't satisfy consistently. Quests should either be simplified or the AI should be given role-specific choices for quest resolution.

### 5. Places never entered
All 8 places included in the starter decks (`place_the_gym`, `place_zo_is_natuur`, etc.) were never entered across 100 games. The AI does not currently play place cards — `seemsPlayable` filters them out since they have category `"place"` rather than `"piecie"` or `"snelle-piecie"`. The AI should be extended to play place cards, or place cards should be tested separately.

### 6. Never-played cards
36 cards were never played across 100 games. Beyond places and quests, notable never-played piecies include:
- `momentum-diefje` — requires specific conditions not met by the AI's choices
- `harde-didde` — likely blocked by trait or combo cost
- `bagga-of-greed` — requires a `$choice:baggaDiscard` that the AI supplies as `null`; always rejects

## Recommended Follow-up (Phase 10+)

1. **Fix `bagga-of-greed`**: The AI provides no `baggaDiscard` choice. Either give the AI a valid discard choice or mark this card as `requiresInteractiveChoice: true` to skip in simulation.
2. **Extend AI to play place cards**: Add `"place"` to `seemsPlayable` category check.
3. **Review Digital Control starter deck**: Replace expensive/conditional quests with simpler MP-gain cards to reduce timeout rate.
4. **Re-balance Physical Force vs Digital Control**: Physical Force wins at 82% — consider reducing ATK primitives on fighting piecies or increasing Digital Control's counterplay.
5. **Add human-vs-AI playtest path**: Use the AI runner as opponent for a human player.

## Commits

| Hash | Message |
|------|---------|
| 27a7fc0 | phase9: step 0 - starter deck definitions |
| e3dbdf5 | phase9: step 1 - ai player decision engine |
| b2576a2 | phase9: step 2 - game runner |
| 9045f9d | phase9: step 3 - simulation harness |
| *(step 4-6)* | phase9: step 4-6 - run-once, vitest config, final report |
