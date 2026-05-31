# Developer Handoff

## Project State
Phase 11 handoff point after Phase 10 balancing and AI robustness work:
- Core simulation pipeline exists and is stable.
- Documentation now includes a full master card reference and playtesting guide.
- Known deferred mechanics remain intentionally tracked in phase question docs.

Latest validation baseline before this handoff phase:
- 69 test files passed
- 497 tests passed
- Coverage snapshot: 99.41 statements, 90.89 branches, 98.03 functions, 99.41 lines

## Architecture Overview

### Runtime Layers
1. Card registry and definitions
- All cards are data definitions registered by side-effect imports.
- Registry lookup drives executor behavior.

2. Effect primitives
- Primitive handlers live under src/effects.
- Card effects are declarative expression objects mapped to primitives.

3. Card execution
- Executor resolves placeholders, validates requirements/costs, then runs effects.
- Snelle response chain and stack resolution are integrated with engine flow.

4. Game engine
- Turn flow, state transitions, event append, victory checks, and place manager.
- Turn start trickle: every active Mosje of the active player gains +10 MP at the start of each turn (fires in startTurn() before Place effects and the Draw Phase).

5. Simulation harness
- Deterministic AI plays full games and writes aggregate reports.

## File Map

### Core Engine
- src/engine/create-game.ts
- src/engine/turn-manager.ts
- src/engine/player-reducers.ts
- src/engine/place-manager.ts
- src/engine/quest-manager.ts
- src/engine/resolve-effect-stack.ts
- src/engine/check-victory.ts

### Card Runtime
- src/cards/registry/card-registry.ts
- src/cards/executor/execute-card.ts
- src/cards/executor/execute-mosje-ability.ts
- src/cards/executor/resolve-effect-expression.ts
- src/cards/executor/resolve-target-reference.ts

### Card Content
- src/cards/mosjes/
- src/cards/piecies/
- src/cards/snelle-piecies/
- src/cards/places/
- src/cards/quests/

### Effects and Conditions
- src/effects/mp/
- src/effects/cards/
- src/effects/board/
- src/effects/buffs/
- src/effects/conditions/
- src/effects/control/

### Simulation and Reports
- src/simulation/bootstrap-registry.ts
- src/simulation/starter-decks.ts
- src/simulation/ai-player.ts
- src/simulation/game-runner.ts
- src/simulation/run-simulation.ts
- src/simulation/run-once.ts
- docs/simulation-report.json
- docs/simulation-report.md

### Tests
- tests/cards/
- tests/core/
- tests/simulation/
- tests/helpers/

## Implementation Guides

### Adding a new card
1. Add card definition file in proper category folder.
2. Export from local index barrel.
3. Ensure bootstrap/registry import path reaches it.
4. Add or update tests for card behavior and registry audit.

### Adding a new primitive
1. Implement primitive in relevant src/effects module.
2. Register primitive in src/effects/registry.ts.
3. Add focused primitive tests.
4. Add at least one card integration test using the primitive.

### Adjusting AI behavior
1. Edit src/simulation/ai-player.ts decision flow.
2. Keep deterministic seeded behavior.
3. Validate with tests/simulation/ai-player.test.ts.
4. Re-run 100-game simulation and check report deltas.

### Rebalancing starter decks
1. Edit src/simulation/starter-decks.ts only.
2. Run tests.
3. Run simulation and compare:
- Timeout rate
- Never-played count
- Matchup win spread
4. Document changes in phase report.

## Deferred Feature Priority List
Prioritized for engine completeness and human-play quality.

### Priority 1: Core mechanic gaps used by many cards
- True retargetPendingEffect behavior.
- activateFromDiscard and activatePiecie slot-target primitives.
- discardRandom and robust discard-cost choice enforcement.
- searchDeck primitive for mosje tutor effects.

### Priority 2: Combat and protection hooks
- Exact threshold-based MP mitigation checks.
- Full mp_loss_immune flag path instead of large-reduction approximation.
- Castle/token persistent object model with destruction checks.

### Priority 3: Prediction and hidden-information support
- checkGuess condition support.
- revealHand and named-card/typed prediction contracts.
- Better caller contracts for interactive target/choice collection.

### Priority 4: Quest completeness
- Native OR requirement composition.
- Event-log-this-turn query primitives for quests.
- Complex interactive/multi-player quest offers.

## Next Phase Priorities
1. Close Priority 1 deferred primitives and update partial cards to implemented.
2. Run focused human playtests with docs/playtesting-guide.md flow.
3. Reduce timeout rate under 25% while preserving matchup parity.
4. Shrink never-played list below 15 without introducing high-complexity starter friction.
5. Add one regression test per resolved deferred item.

## Environment Setup

### Requirements
- Node.js (current repo tested with Node 24)
- npm

### Install
1. npm install

### Test and coverage
1. npm test
2. npm run coverage

### Simulation run
1. Preferred: npx tsx src/simulation/run-once.ts
- Note: Node 24 + ts-node ESM loader is unstable in this repo; tsx is the reliable path used in recent phases.

### Useful outputs
- docs/simulation-report.json
- docs/simulation-report.md

## Documentation Index for Continuation
- docs/card-reference.md
- docs/playtesting-guide.md
- docs/phase9-report.md
- docs/phase10-report.md
- docs/phase4-questions.md
- docs/phase5-questions.md
- docs/phase6-questions.md
- docs/phase7-questions.md
- docs/phase8-questions.md
