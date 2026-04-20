# Phase 1 Report

## Summary
Phase 1 core engine scaffolding is complete in TypeScript strict mode with pure immutable reducers, deterministic utilities, and a passing Vitest suite.

## Files Created (Phase 1 tree)

- src/engine/
  - advance-phase.ts
  - append-event.ts
  - apply-victory-check.ts
  - check-victory.ts
  - create-game.ts
  - end-turn.ts
  - event-bus.ts
  - events-since.ts
  - start-turn.ts
  - turn-manager.ts
  - reducers/player/
    - activate-piecie.ts
    - discard-card.ts
    - draw-card.ts
    - gain-mp.ts
    - index.ts
    - level-up-mosje.ts
    - lose-mp.ts
    - play-piecie-face-down.ts
    - switch-active-mosje.ts
- src/types/
  - card-id.ts
  - events.ts
  - game-state.ts
  - mosje-instance.ts
  - pending-effect.ts
  - phase.ts
  - piecie-slot.ts
  - place-instance.ts
  - player-reducer-actions.ts
  - player-state.ts
- src/utils/
  - freeze.ts
  - id.ts
  - rng.ts
- tests/engine/
  - apply-victory-check.test.ts
  - check-victory.test.ts
  - create-game.test.ts
  - event-bus.test.ts
  - player-reducers.test.ts
  - turn-manager.test.ts
- tests/integration/
  - phase1-smoke-test.ts
- tests/utils/
  - freeze.test.ts
  - id.test.ts
  - rng.test.ts
- docs/
  - phase1-questions.md

## Coverage (% per module)
From `npm run coverage`:

- All files: Statements 98.4, Branch 86.74, Functions 100, Lines 98.4
- Engine: Statements 100, Branch 95.52, Functions 100, Lines 100
- Engine/reducers/player: Statements 100, Branch 80.45, Functions 100, Lines 100
- Utils: Statements 84.31, Branch 76.47, Functions 100, Lines 84.31
- Types: 0 (type-only files, no runtime statements)

## Questions Logged
See docs/phase1-questions.md.

## Deviations from Spec (with justification)
1. One-function-per-file rule enforced over single-file multi-function examples:
- Spec examples requested grouped functions in files like `event-bus.ts` and `turn-manager.ts`.
- Implemented one exported function per file, with thin barrel files for compatibility, to satisfy universal rule #1.

2. Victory emission handling:
- Spec required pure `checkVictory` return shape while also requiring `game_won` emission.
- Kept `checkVictory` pure and added `applyVictoryCheck` to append `game_won` in reducer/turn flow call sites.

3. Snelle activation determination in core scaffolding:
- No card-catalog logic is in Phase 1 by design.
- `activatePiecie` accepts explicit `isSnelle` action input until Phase 2 card primitive wiring is added.

## Final Test Status
- `npm test`: PASS
- `npm run coverage`: PASS
