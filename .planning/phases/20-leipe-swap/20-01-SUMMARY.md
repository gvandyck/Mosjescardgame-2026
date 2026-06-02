# Phase 20 Summary - Leipe Swap

## What changed

- Reworked the live browser/UI Piecie from `piecie_emergency_swap` into `piecie_leipe_swap`.
- Added `effect_leipe_swap`, which reads `_pendingTargets.leipeYourSlot`, `_pendingTargets.leipeOppId`, and `_pendingTargets.leipeOppSlot`, swaps MP by direct assignment, and stores `_leipeSwap`.
- Added `endTurn` swap-back for the swapper's turn so the two slots' current MP swaps back and banked levels stay.
- Added the Leipe Swap target-pick flow in `main.js` using the existing Mosje target selectors.
- Set Leipe Swap to free, level 1+, `★★★★★`, booster-only, `persistUntilEndOfTurn: true`, and added the five-star deck-builder cap at 1 copy.
- Renamed the declarative registry twin to `src/cards/piecies/utility/leipe-swap.ts` and updated registry exports/tests.
- Updated card reference/ruling docs and removed old Emergency Swap references under `src/`, `tests/`, and `docs/`.

## Verification

- RED: `npm test -- tests/abilities/leipe-swap.test.ts` failed before implementation as expected.
- Existing baseline during RED: `npm test -- --exclude tests/abilities/leipe-swap.test.ts` passed with 850 tests.
- Focused U6/Ronald-related coverage: `npm test -- tests/integration/phase2-phantom-cards.test.ts tests/effects/mp-primitives.test.ts` passed, 15 tests.
- Final tests: `npm test` passed, 94 files / 856 tests.
- Final simulation: `npx tsx src/simulation/run-once.ts` completed 100 games with 0 crashes and 0 timeouts.
- Final grep: `rg "emergency_swap|Emergency Swap|emergency-swap|EMERGENCY_SWAP" src tests docs -n` returned no matches.

## Deviations

- The declarative TypeScript card registry twin is registered as a no-op (`effects: []`) with the new `piecie_leipe_swap` identity. The interactive double-swap mechanic is implemented in the imperative browser path as instructed; the TS registry has no target-selection primitive for this mechanic.
