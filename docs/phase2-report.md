# Phase 2 Report

## Summary
Phase 2 primitive library is implemented and validated with unit + integration tests.
The phantom card suite passes and demonstrates cards can be composed from data-driven primitive expressions.

## Files Created / Updated

### Core Effect Contracts
- src/effects/effect-context.ts
- src/effects/primitive.ts
- src/effects/registry.ts

### MP Primitives
- src/effects/mp/types.ts
- src/effects/mp/gain-mp.ts
- src/effects/mp/lose-mp.ts
- src/effects/mp/drain-mp.ts
- src/effects/mp/set-mp.ts
- src/effects/mp/multiply-next-mp-gain.ts
- src/effects/mp/index.ts

### Card Primitives
- src/effects/cards/types.ts
- src/effects/cards/draw-cards.ts
- src/effects/cards/discard-cards.ts
- src/effects/cards/reveal-top-deck.ts
- src/effects/cards/look-at-top.ts
- src/effects/cards/search-deck-and-draw.ts
- src/effects/cards/return-to-hand.ts
- src/effects/cards/index.ts

### Board Primitives
- src/effects/board/types.ts
- src/effects/board/destroy-place.ts
- src/effects/board/enter-place.ts
- src/effects/board/destroy-piecie.ts
- src/effects/board/activate-face-down-piecie.ts
- src/effects/board/index.ts

### Dice Primitives
- src/effects/dice/types.ts
- src/effects/dice/roll-die.ts
- src/effects/dice/reroll-die.ts
- src/effects/dice/choose-die-result.ts
- src/effects/dice/index.ts

### Buff / Duration Primitives
- src/effects/buffs/types.ts
- src/effects/buffs/apply-buff.ts
- src/effects/buffs/reduce-mp-loss-by.ts
- src/effects/buffs/clear-expired-buffs.ts
- src/effects/buffs/negate-effect.ts
- src/effects/buffs/index.ts

### Condition Primitives
- src/effects/conditions/check-trait.ts
- src/effects/conditions/check-synergy.ts
- src/effects/conditions/check-pet-synergy.ts
- src/effects/conditions/check-level.ts
- src/effects/conditions/check-mp.ts
- src/effects/conditions/check-card-type-in-play.ts
- src/effects/conditions/check-place-active.ts
- src/effects/conditions/index.ts

### Control Flow Primitives
- src/effects/control/types.ts
- src/effects/control/run-condition-expr.ts
- src/effects/control/run-effect-expr.ts
- src/effects/control/if-then-else.ts
- src/effects/control/chain.ts
- src/effects/control/choose.ts
- src/effects/control/roll-branch.ts
- src/effects/control/index.ts

### Engine / Type Updates
- src/types/events.ts
- src/types/game-state.ts
- src/engine/create-game.ts
- src/engine/end-turn.ts
- vitest.config.ts

### Tests
- tests/effects/mp-primitives.test.ts
- tests/effects/card-primitives.test.ts
- tests/effects/board-primitives.test.ts
- tests/effects/dice-primitives.test.ts
- tests/effects/buff-primitives.test.ts
- tests/effects/condition-primitives.test.ts
- tests/effects/control-primitives.test.ts
- tests/effects/registry.test.ts
- tests/effects/effect-branch-coverage.test.ts
- tests/effects/effect-branch-coverage-2.test.ts
- tests/integration/phase2-phantom-cards.test.ts

### Documentation
- docs/phase2-questions.md
- docs/buff-stacking-rules.md
- docs/phase2-report.md

## Coverage
Command: `npm run coverage`

Coverage (configured for `src/effects/**/*.ts`, excluding barrel/type-only files):
- Statements: 99.87%
- Branches: 92.37%
- Functions: 100%

Targets met:
- Branch coverage >90% for `src/effects/`
- Statement coverage >95% for `src/effects/`

## Open Questions
Captured in:
- docs/phase2-questions.md

## Deviations / Notes
- `searchDeckAndDraw` supports `byName` directly and emits warning for `byType`/`byCost` until catalog metadata is injected into runtime state.
- Condition primitives use existing runtime flags for trait/type/quest overrides pending stronger typed state in Phase 3+.
- `choose` primitive uses an injected resolver in Phase 2 tests; full player-input pipeline is deferred to Phase 3.

## Phantom Card Suite Status
`tests/integration/phase2-phantom-cards.test.ts` passes with all 5 scenarios:
1. Simple gain
2. Conditional gain (both branches)
3. Stacked modifiers
4. Roll-branch chaos distribution
5. Duration buff across turns
