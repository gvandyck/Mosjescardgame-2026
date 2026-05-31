---
phase: 12-unfinished-stubs
plan: 01
subsystem: engine
tags: [status-effects, mp-loss, engine-wiring, tdd]

# Dependency graph
requires:
  - phase: 11-offline-bot
    provides: stable 664-test base, offline game infrastructure
provides:
  - MP_LOSS_HALVED read point in loseMP() — Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes now functional
  - MP_LOSS_REDUCTION read point in loseMP() — Laat me chillen, FF Haaltje Nemen now functional
  - WELLOE_SHIELD read point in markMosjeDefeated() — Mosje Shield now functional
  - snelleFlags.mpLossReduction consolidated at same read point as MP_LOSS_REDUCTION
  - effect_ff_haaltje_nemen ReferenceError fixed — reduction const now defined
affects:
  - 12-02 (negateNextSearch wiring)
  - any plan touching loseMP() or markMosjeDefeated()

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "statusEffect check pattern: .find(e => e.type === TYPE && e.turnsLeft > 0) with inline turnsLeft decrement"
    - "Snelle flag consolidation at status-effect read point (mpLossReduction)"
    - "TDD RED-GREEN commit discipline: test commit then feat commit"

key-files:
  created:
    - tests/engine/stub-engine-wiring.test.ts
  modified:
    - src/engine/mpManager.js
    - src/engine/victoryChecker.js
    - src/abilities/piecieEffects.js
    - src/abilities/snelleEffects.js

key-decisions:
  - "MP_LOSS_HALVED uses Math.ceil(lossAmount / 2) per CONTEXT.md decision (round up favors defender)"
  - "WELLOE_SHIELD check inserted BEFORE negateNextElimination to give shield priority"
  - "snelleFlags.mpLossReduction consolidated at MP_LOSS_REDUCTION read point (one read point, not two)"
  - "Simulation crash (exit code 1) confirmed pre-existing before this plan — not caused by these changes"

patterns-established:
  - "Status effect interception: use .find() not .forEach(); decrement turnsLeft inline; place before mosje.mp -= lossAmount"
  - "Early-return shape in markMosjeDefeated mirrors negateNextElimination block exactly"

requirements-completed: [STUB-01, STUB-02, STUB-03, STUB-06]

# Metrics
duration: 5min
completed: 2026-05-31
---

# Phase 12 Plan 01: Stub Engine Wiring Summary

**Three silent status effects (MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD) wired into loseMP() and markMosjeDefeated(); ReferenceError in effect_ff_haaltje_nemen fixed; all six zero-value push sites corrected**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-31T13:52:48Z
- **Completed:** 2026-05-31T13:57:17Z
- **Tasks:** 2
- **Files modified:** 5 (+ 1 created)

## Accomplishments
- Wired MP_LOSS_HALVED into loseMP(): five cards (Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes) now actually halve incoming MP loss for their Mosje
- Wired MP_LOSS_REDUCTION into loseMP(): Laat me chillen and FF Haaltje Nemen now reduce incoming loss; snelleFlags.mpLossReduction (The Protector) consolidated at same read point
- Wired WELLOE_SHIELD into markMosjeDefeated(): Mosje Shield now prevents knockout, restoring Mosje to 1 MP instead of sending to Welloe pile
- Fixed effect_ff_haaltje_nemen: `const reduction = resilient >= 2 ? 30 : 20` reintroduced before the push, eliminating the ReferenceError
- Corrected all six push sites that had `value: 0` as corruption-prevention workaround (now value: 1 for HALVED, value: 20 for REDUCTION, value: 1 for WELLOE_SHIELD)
- Added 17 tests (13 labeled + 4 sub-tests for the five MP_LOSS_HALVED push sites) covering all behaviors

## Task Commits

Each task was committed atomically:

1. **RED: add failing tests** - `c3bfa73` (test)
2. **Task 1: Wire MP_LOSS_HALVED and MP_LOSS_REDUCTION into loseMP(), fix push site values** - `14352ce` (feat)
3. **Task 2: Wire WELLOE_SHIELD into markMosjeDefeated(), fix effect_ff_haaltje_nemen** - `f233822` (feat)

_TDD: one RED commit covers both tasks; two GREEN commits (one per task) per plan structure_

## Files Created/Modified
- `tests/engine/stub-engine-wiring.test.ts` — 17 new tests proving MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD, and ff_haaltje_nemen all work correctly
- `src/engine/mpManager.js` — inserted MP_LOSS_HALVED and MP_LOSS_REDUCTION blocks before dierenasielActive check; consolidated mpLossReduction snelle flag
- `src/engine/victoryChecker.js` — inserted WELLOE_SHIELD check before negateNextElimination block in markMosjeDefeated()
- `src/abilities/piecieEffects.js` — fixed all 6 zero-value push sites (5x MP_LOSS_HALVED, 1x MP_LOSS_REDUCTION, 1x WELLOE_SHIELD)
- `src/abilities/snelleEffects.js` — fixed effect_ff_haaltje_nemen: added `const reduction` before push, updated push value from 0 to reduction

## Decisions Made
- MP_LOSS_HALVED uses `Math.ceil(lossAmount / 2)` (round up) per CONTEXT.md: favors the defender
- WELLOE_SHIELD check placed before negateNextElimination so shield takes priority when both are active
- snelleFlags.mpLossReduction consolidated at the MP_LOSS_REDUCTION read point rather than a separate check — one read point is cleaner
- Simulation crash (exit code 1) investigated and confirmed pre-existing before this plan: out of scope per deviation rules scope boundary

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Simulation `run-once.ts` exits with code 1 — investigated and confirmed this crash existed on the branch before any changes in this plan. The simulation was already broken at the pre-plan committed state. Documented as out-of-scope (pre-existing, unrelated to status effect wiring).

## Known Stubs

None introduced by this plan. All push sites now have correct non-zero values and their read points exist in the engine.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure internal engine functions consuming already-trusted internal state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wave 1 engine wiring complete for STUB-01, STUB-02, STUB-03, STUB-06
- Plan 02 (negateNextSearch wiring + turnManager stubs) ready to execute
- 681 tests passing (17 new tests added)

---
*Phase: 12-unfinished-stubs*
*Completed: 2026-05-31*
