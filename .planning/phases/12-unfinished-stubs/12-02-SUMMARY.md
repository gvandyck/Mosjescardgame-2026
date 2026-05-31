---
phase: 12-unfinished-stubs
plan: 02
subsystem: engine
tags: [negateNextSearch, snelle-flags, dead-code-removal, tdd, stub-wiring]

# Dependency graph
requires:
  - phase: 12-01
    provides: stable 681-test base, MP_LOSS_HALVED/REDUCTION/WELLOE_SHIELD wired
provides:
  - negateNextSearch guard in phaseDrawCard() — Jammertje Gepakt now cancels opponent-triggered draws
  - STUB-05 confirmed implemented — doubleNextPiecie comment added for clarity
  - STUB-07 documented with explicit UI consumption point in main.js handleActivatePiecie()
  - STUB-08 dead code removed — SNOEIERTJE_COST push eliminated from effect_snoeiertje
affects:
  - 12-03 (any callers of phaseDrawCard who trigger draws on behalf of opponent)
  - any plan touching effect_snoeiertje behavior

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isOpponentTriggered parameter pattern: optional boolean gating engine side-effect on call origin"
    - "snelleFlags guard inside conditional: if (isOpponentTriggered) { if (flag) { delete; return; } }"

key-files:
  created: []
  modified:
    - src/engine/turnManager.js
    - src/abilities/piecieEffects.js
    - tests/engine/stub-engine-wiring.test.ts

key-decisions:
  - "negateNextSearch guard placed inside if (isOpponentTriggered) block — natural turn draws are never negated"
  - "STUB-05 is confirmed already implemented — only a comment was added, no code change"
  - "STUB-07 is UI-side only — engine comment enhanced with exact consumption point (main.js handleActivatePiecie)"
  - "SNOEIERTJE_COST push was never read anywhere — safe to remove with no test impact"

patterns-established:
  - "isOpponentTriggered=false default parameter pattern for engine functions with origin-dependent guards"

requirements-completed: [STUB-04, STUB-05, STUB-07, STUB-08]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 12 Plan 02: negateNextSearch Wiring + Dead Code Cleanup Summary

**negateNextSearch (Jammertje Gepakt) wired into phaseDrawCard() with isOpponentTriggered parameter; STUB-05 confirmed implemented; STUB-07 documented with explicit UI consumption point; dead SNOEIERTJE_COST push removed**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-31T17:08:08Z
- **Completed:** 2026-05-31T17:19:00Z
- **Tasks:** 2
- **Files modified:** 3 (turnManager.js, piecieEffects.js, stub-engine-wiring.test.ts)

## Accomplishments

- Wired negateNextSearch flag into phaseDrawCard(): Jammertje Gepakt card now actually cancels opponent-triggered draws/searches when the flag is active
- Added `isOpponentTriggered = false` optional parameter to phaseDrawCard(): natural turn draws (startTurn) bypass the guard entirely — they are never negated
- Confirmed STUB-05 (doubleNextPiecie / Dubbele Temminks) is already implemented at lines 593–597 of turnManager.js; added clarifying comment
- Enhanced `_dingetjeTochActive` comment (STUB-07) with explicit consumption point: main.js handleActivatePiecie() validator block, before activatePiecie() call
- Removed dead SNOEIERTJE_COST push from effect_snoeiertje (STUB-08): questBonusMP already handles the +15 MP logic; the push was never consumed anywhere
- Added 3 new tests (Tests 14–16) covering all negateNextSearch guard behaviors

## Task Commits

Each task was committed atomically:

1. **RED: add failing tests for negateNextSearch** - `5b3a1a9` (test)
2. **Task 1: wire negateNextSearch + STUB-05 + STUB-07** - `c7047cc` (feat)
3. **Task 2: remove dead SNOEIERTJE_COST push** - `c43cc28` (feat)

_TDD: RED commit covers Task 1; GREEN commit implements Task 1; Task 2 had no RED (no failing test — just dead code removal)_

## Files Created/Modified

- `tests/engine/stub-engine-wiring.test.ts` — 3 new tests (Tests 14–16) for negateNextSearch guard; import for phaseDrawCard added; makeDrawState() helper added
- `src/engine/turnManager.js` — phaseDrawCard() gains `isOpponentTriggered = false` parameter and negateNextSearch guard block; STUB-05 comment added above doubleNextPiecie block; _dingetjeTochActive comment enhanced with STUB-07 consumption point
- `src/abilities/piecieEffects.js` — SNOEIERTJE_COST push removed from effect_snoeiertje; comment explains why; console.log updated to accurately reflect the effect

## Decisions Made

- negateNextSearch guard is placed inside `if (isOpponentTriggered)` — this is the simplest correct approach: the natural turn draw path never touches the guard
- STUB-05 needs no code change — the doubleNextPiecie block already exists and works; a comment is sufficient documentation
- STUB-07 is entirely UI-side — no engine code needed; the comment enhancement in turnManager.js is the complete deliverable for this wave
- SNOEIERTJE_COST push removal had no test impact, confirming it was genuinely dead code

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None introduced by this plan. All changes are either completing functionality (STUB-04), confirming existing functionality (STUB-05), documenting deferred UI work (STUB-07), or removing dead code (STUB-08).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The `isOpponentTriggered` parameter is an internal boolean with no user-input path (per threat model T-12-02-02 disposition: accept).

## Self-Check

Files exist:
- `src/engine/turnManager.js` — modified
- `src/abilities/piecieEffects.js` — modified
- `tests/engine/stub-engine-wiring.test.ts` — modified

Commits:
- `5b3a1a9` — RED tests
- `c7047cc` — Task 1 feat
- `c43cc28` — Task 2 feat

## Self-Check: PASSED

## Next Phase Readiness

- Wave 2 complete: STUB-04, STUB-05, STUB-07, STUB-08 resolved
- 684 tests passing (3 new tests added by this plan)
- Plan 03 (STUB-09 Dierenasiel 0-MP guard, STUB-10 Synergy Chamber cost reduction) ready to execute

---
*Phase: 12-unfinished-stubs*
*Completed: 2026-05-31*
