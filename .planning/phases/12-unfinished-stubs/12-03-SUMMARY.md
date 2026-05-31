---
phase: 12-unfinished-stubs
plan: 03
subsystem: engine
tags: [dierenasiel, synergy-chamber, useMosjeAbility, tdd, stub-wiring, place-mechanics]

# Dependency graph
requires:
  - phase: 12-02
    provides: stable 684-test base, negateNextSearch wired, STUB-04/05/07/08 resolved
provides:
  - dierenasielWaiver constant documented at useMosjeAbility engine call site (STUB-09)
  - Synergy Chamber cost reduction pre-adjustment wired in useMosjeAbility (STUB-10)
  - getSynergyChambercostReduction() call site established in turnManager.js
affects:
  - any UI caller of useMosjeAbility that checks cantAffordAbility for PET Mosjes
  - any Mosje with abilityCost > 0 when place_synergy_chamber is active

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Synergy Chamber pre-adjustment pattern: clone state, bump Mosje mp by synergyDiscount before calling fn(), individual ability function deducts full cost netting a 5 MP savings"
    - "dierenasielWaiver constant: engine-level marker — no behavioral gate, just documentation and passthrough logging"

key-files:
  created: []
  modified:
    - src/engine/turnManager.js
    - tests/engine/stub-engine-wiring.test.ts

key-decisions:
  - "Dierenasiel guard is documentation-only at engine level — engine has no cost gate; dierenasielWaiver logs and documents UI responsibility"
  - "Synergy Chamber reduction applied as pre-MP-adjustment (stateForAbility clone with s.mp += 5) rather than changing every individual ability function"
  - "stateForAbility only created when synergyDiscount > 0 AND mosjeDef.abilityCost > 0 — zero-cost abilities are unaffected"

patterns-established:
  - "Pre-adjustment pattern for cost reduction: clone state and adjust target field before dispatching to ability function"

requirements-completed: [STUB-09, STUB-10]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 12 Plan 03: Dierenasiel 0-MP Guard + Synergy Chamber Cost Reduction Summary

**Dierenasiel engine guard documented in useMosjeAbility (STUB-09); Synergy Chamber cost reduction wired as MP pre-adjustment before ability dispatch (STUB-10)**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-31T19:20:00Z
- **Completed:** 2026-05-31T19:30:00Z
- **Tasks:** 2
- **Files modified:** 2 (turnManager.js, stub-engine-wiring.test.ts)

## Accomplishments

- Added `dierenasielWaiver` constant in `useMosjeAbility()` after slot retrieval — logs when Dierenasiel place is active and a PET ability activation occurs
- Added JSDoc comment above `useMosjeAbility()` clarifying that the engine has no abilityCost gate; UI `cantAffordAbility` is the primary guard; UI must also check `dierenasielActive` for PET Mosjes (UI phase responsibility)
- Wired `placeEffects.getSynergyChambercostReduction(gameState)` call in `useMosjeAbility()` — when Synergy Chamber is active and the Mosje has `abilityCost > 0`, the Mosje's MP is pre-incremented by 5 (the discount) in a deep-cloned state before the ability function runs
- Changed `fn(gameState, ...)` call to `fn(stateForAbility, ...)` to use the discounted state
- Added 7 new tests (Tests 17–23) covering both stubs: artifact check, regression guard, dierenasielActive path, Synergy Chamber success/fail paths, and getSynergyChambercostReduction unit tests

## Task Commits

Each task was committed atomically:

1. **RED: add failing tests for dierenasielWaiver and Synergy Chamber** - `12d70c8` (test)
2. **GREEN: wire dierenasielWaiver + Synergy Chamber cost reduction** - `eb5be7d` (feat)

_TDD: RED commit covers both tasks; GREEN commit implements both tasks (single coherent change to useMosjeAbility)_

## Files Created/Modified

- `tests/engine/stub-engine-wiring.test.ts` — 7 new tests (Tests 17–23); added `useMosjeAbility` and `getSynergyChambercostReduction` imports; added `makeAbilityState()` and `makeCoertAbilityState()` helper functions
- `src/engine/turnManager.js` — `useMosjeAbility()` gains: JSDoc note, `dierenasielWaiver` constant + log block, `synergyDiscount` pre-adjustment block, `stateForAbility` clone when discount applies, `fn(stateForAbility, ...)` call

## Decisions Made

- Dierenasiel guard is documentation and engine call-site annotation only — the engine never had a hard cost gate at this level, so no behavioral change is needed; the `dierenasielWaiver` constant is the STUB-09 artifact
- Synergy Chamber reduction is implemented as a pre-MP-adjustment (clone state, add 5 to Mosje mp, pass cloned state to fn()) rather than modifying every individual ability function — simplest correct approach
- `stateForAbility` clone is only created when both conditions are true: `synergyDiscount > 0` AND `mosjeDef.abilityCost > 0` — this avoids unnecessary cloning for zero-cost abilities

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None introduced by this plan. Both changes complete documented stubs (STUB-09, STUB-10).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All threat register items (T-12-03-01, T-12-03-02, T-12-03-03) were pre-assessed as `accept` dispositions; no new surface created.

## Self-Check

Files exist:
- `src/engine/turnManager.js` — modified
- `tests/engine/stub-engine-wiring.test.ts` — modified

Commits:
- `12d70c8` — RED tests
- `eb5be7d` — feat (GREEN)

## Self-Check: PASSED

## Next Phase Readiness

- Wave 3 complete: STUB-09 and STUB-10 resolved
- 691 tests passing (7 new tests added by this plan)
- Plan 04 (Wave 4 — UI-gated interactions: Bagga of Greed, Welloe Force, MP Adjuster) ready to execute

---
*Phase: 12-unfinished-stubs*
*Completed: 2026-05-31*
