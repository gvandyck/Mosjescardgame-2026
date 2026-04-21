# Phase 7 Report: Place Cards and Persistent-Effect System

## Summary
- Status: complete through Step 5.
- Test status: `npm test` green.
- Coverage status: `npm run coverage` green.
- Place architecture is state-driven (`activePlace.subscribedTriggers`) with no module-level listener map.

## New File Tree
- docs/
  - phase7-questions.md
  - phase7-report.md
- src/cards/schema/
  - place-definition.ts
  - place-trigger.ts
- src/cards/places/
  - arcade.ts
  - bank-chilling.ts
  - coerts-caravan.ts
  - delluft.ts
  - drain-zone.ts
  - index.ts
  - momentum-factory.ts
  - momentum-stabilizer.ts
  - obby-1.ts
  - quest-haven.ts
  - skiffa.ts
  - synergy-chamber.ts
  - the-gym.ts
  - the-void.ts
  - welloe-graveyard.ts
  - zo-is-natuur.ts
- src/engine/
  - place-manager.ts
- src/effects/board/
  - set-game-flag.ts
- tests/engine/
  - place-manager.test.ts
- tests/cards/
  - phase7-place-registry.test.ts
- tests/cards/places/
  - step1-batch1-places.test.ts
  - step1-batch2-places.test.ts
  - step2-batch1-places.test.ts
  - step2-batch2-places.test.ts
  - step3-places.test.ts
- tests/integration/
  - phase7-place-leak-sim.test.ts

## Core Architecture Delivered
- Declarative place model:
  - `PlaceDefinition` with `onEnterEffects`, `onExitEffects`, `triggers`
  - `PlaceTrigger` with `on`, `forPlayer`, `condition`, `effects`
- `place-manager` engine:
  - `enterPlace`
  - `exitPlace`
  - `resolveActivePlaceTriggers`
- Event-bus wiring:
  - `appendEvent` appends then resolves active place triggers automatically.
- Leak prevention:
  - subscriptions are stored on `state.activePlace.subscribedTriggers`.
  - clearing/replacing active place drops trigger references immediately.

## Coverage Snapshot (from `npm run coverage`)
- Global:
  - Statements: 98.5%
  - Branches: 89.67%
  - Functions: 96.59%
  - Lines: 98.5%
- Key Phase 7 modules:
  - `src/cards/places/*`: 100 / 100 / 100 / 100
  - `src/engine/place-manager.ts`: covered via `tests/engine/place-manager.test.ts` and integration leak sim
  - `src/effects/board/set-game-flag.ts`: 100 statements/lines, 80 branch
  - `src/effects/mp/set-mp.ts`: 98.36 statements, 93.54 branch
  - `src/cards/executor/execute-card.ts`: 85.37 statements, 80.21 branch

## Registered Places
- `place_the_gym`
- `place_bank_chilling`
- `place_quest_haven`
- `place_skiffa`
- `place_obby_1`
- `place_arcade`
- `place_zo_is_natuur`
- `place_the_void`
- `place_momentum_factory`
- `place_coerts_caravan`
- `place_synergy_chamber`
- `place_welloe_graveyard`
- `place_drain_zone`
- `place_momentum_stabilizer`
- `place_delluft`

## Missing Places
- Missing from row-122-135 audit set: none.
- Additional registered place: `place_delluft` (outside the row-122-135 subset used by the Step 4 audit test).

## phase7-questions.md Items
- Fighting subtype check in `place_the_gym` is mapped through `checkCardTypeInPlay` with `cardType: "fighting"`; exact subtype semantics depend on flags/data model.
- Declarative trigger names (`turn_end`, `turn_start`, `quest_attempt`) are mapped to runtime event names (`turn_ended`, `turn_started`, `quest_attempted`).
- `place_synergy_chamber` duration-extension behavior is deferred.
- `place_synergy_chamber` ability-cost reduction (-5) is deferred to ability-cost phase.

## Leak Simulation Result (Phase 7 Integration)
- Test: `tests/integration/phase7-place-leak-sim.test.ts`
- Result: pass.
- Scenario outcomes:
  - Gym active and firing: pass
  - Swap to Skiffa; Gym no longer firing: pass
  - The Void blocks effect gain/loss, allows costs: pass
  - Destroy The Void via `slecht-gezet`; effect MP changes resume immediately: pass
  - Synergy Chamber forces synergy without partner: pass
  - Exit Synergy Chamber reverts synergy requirement: pass
  - Welloe Graveyard triggers gain+draw on defeat owner: pass
  - Quest Haven applies +10 on quest completion: pass
  - Momentum Stabilizer blocks `setMP`: pass
  - Replace Stabilizer; `setMP` works and active flag is cleared: pass

## Deviations
- Runtime compatibility fallback retained for legacy states that have `activePlace` objects without `subscribedTriggers`.
  - Justification: existing tests/fixtures still construct legacy `activePlace` shapes.
- `voidActive` transition supports both the new state flag and legacy `activePlace.cardId === "place_the_void"` checks.
  - Justification: preserves backward compatibility while migrating to persistent state flags.
- Registry audit checks required row-122-135 set and minimum count instead of hard exact count.
  - Justification: `place_delluft` is also implemented and registered.
