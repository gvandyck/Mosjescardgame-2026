---
phase: 48-original-requirement-verification-backfill-for-phases-01-06
plan: 01
subsystem: testing
tags: [vitest, traceability, requirements-audit, piecie-effects]

# Dependency graph
requires:
  - phase: 47-milestone-planning-ledger-reconciliation-and-verification-ba
    provides: routed the IMPL/BUG-* traceability debt into this phase
provides:
  - Honest evidence-backed disposition for all 12 IMPL-PF-P* (Physical Force Piecie) requirements
  - Two-pronged (id-string + effect-fn) evidence-discovery method proven on a full 12-row bucket
  - Gap-fill regression tests for effect_snoeiertje, effect_dikke_taks, effect_momentum_diefje happy-path, effect_varkenspootjes deferred target
affects: [48-VERIFICATION.md consolidation, IMPL-AR-P1 (shares piecie_kannetje_melk evidence with IMPL-PF-P1)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gap-fill unit test: import effect_* directly from src/abilities/piecieEffects.js, minimal makeState/makeMosje/makePlayer fixture, assert a concrete field delta"
    - "Two-pronged grep (card id string AND effect fn name) before declaring a requirement a GAP"
    - "Traceability matrix fragment (one file per bucket) instead of one monolithic 64-row doc, to be consolidated later"

key-files:
  created:
    - tests/effects/phase48-pf-piecie-verification.test.ts
    - .planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-FRAGMENT-01-pf-piecies.md
  modified: []

key-decisions:
  - "P7 (varkenspootjes) disposition kept VERIFIED but with an explicit residual-coverage note: the exported effect only arms a pending-target flag (tested), while the actual +60/-30 MP swing lives in non-exported UI/bot logic outside piecieEffects.js and remains untested at the unit tier — flagged as a future browser-coverage task rather than silently claimed as fully closed"
  - "P12 (quest_tough_it_out) recorded as a REQUIREMENTS.md duplicate of IMPL-PF-Q7, NOT ticked, because a fresh grep found IMPL-PF-Q7 itself has zero qualifying test evidence yet — avoided the trap of citing evidence that doesn't exist"
  - "P9/P11 (nature-s-gift, gun-een-piece) confirmed absent from src/ and docs/card-reference.md and recorded GAP-DESCOPED, never ticked"

patterns-established:
  - "Deferred-resolution effects (effect sets a pending flag, real mutation happens in UI/bot layer): test the flag-set, document the untestable remainder as a residual finding rather than fabricating a test around an unexported function"

requirements-completed: [IMPL-PF-P1, IMPL-PF-P2, IMPL-PF-P3, IMPL-PF-P4, IMPL-PF-P5, IMPL-PF-P6, IMPL-PF-P7, IMPL-PF-P8, IMPL-PF-P9, IMPL-PF-P10, IMPL-PF-P11, IMPL-PF-P12]
# Note: "completed" here means each row was investigated and given an honest disposition
# per D-08 (VERIFIED / GAP-DESCOPED), not that all 12 are ticked as satisfied. P9, P11
# are GAP-DESCOPED (no live card); P12 is an unticked REQUIREMENTS.md duplicate of the
# not-yet-verified IMPL-PF-Q7. See 48-FRAGMENT-01-pf-piecies.md for the per-row detail.

# Metrics
duration: 35min
completed: 2026-07-20
---

# Phase 48 Plan 01: PF Piecie Requirement Verification Summary

**Mapped all 12 IMPL-PF-P* Physical Force Piecie requirements to real evidence, closing 4 confirmed test-coverage gaps (effect_snoeiertje, effect_dikke_taks, effect_momentum_diefje happy-path, effect_varkenspootjes) with 4 new false-green-guarded Vitest tests.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-20T20:40:00Z
- **Completed:** 2026-07-20T21:15:00Z
- **Tasks:** 2/2 completed
- **Files modified:** 2 (both new)

## Accomplishments
- Ran the two-pronged evidence-discovery method (id string + effect fn name) against `tests/` for all 12 PF Piecie requirement rows and recorded an honest disposition for each in `48-FRAGMENT-01-pf-piecies.md`
- 5 rows (P1, P2, P6, P8, P10) already had qualifying T1 evidence in `tests/ui/cards/card-registry.js`'s data-driven browser card-test-library (real MP-delta/ATTACK/GAMBLE assertions, not registry-membership-only)
- Closed 4 confirmed gaps with a new focused unit-test file exercising the real effect functions directly and asserting concrete state deltas
- Confirmed P9 (`nature-s-gift`) and P11 (`gun-een-piece`) are genuinely absent from the live 74-Piecie pool (not renamed) — recorded GAP-DESCOPED with the exact search performed, never ticked
- Confirmed P12 (`quest_tough_it_out`) is a REQUIREMENTS.md filing duplicate of `IMPL-PF-Q7` (a Quest, mis-filed under the Piecie section) — and discovered during the check that Q7 itself currently has zero test evidence, so P12 is left unticked rather than citing evidence that doesn't exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Two-pronged evidence map for all 12 PF Piecie rows** - `ff19882` (docs)
2. **Task 2: Gap-fill unit tests for confirmed PF Piecie effect gaps** - `3b119c3` (test)

## Files Created/Modified
- `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-FRAGMENT-01-pf-piecies.md` - 12-row traceability matrix fragment (Requirement ID | slug | current id | disposition | evidence | notes)
- `tests/effects/phase48-pf-piecie-verification.test.ts` - 4 new gap-fill tests: `effect_snoeiertje` (+15 questBonusMP), `effect_dikke_taks` (AOE -35 MP + draw 2), `effect_momentum_diefje` happy-path (steal 20 MP unprotected), `effect_varkenspootjes` (pending-target flag)

## Decisions Made
See `key-decisions` in frontmatter — summarized: (1) P7's residual MP-swing coverage gap flagged rather than papered over since the real mutation logic isn't a unit-testable exported pure function without a `src/` change (forbidden by D-04); (2) P12 left unticked once the Q7-evidence assumption in the plan's own interfaces block turned out to be false on re-check; (3) P9/P11 confirmed absent via direct source + docs search, not assumed from the plan text alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - honesty correction] P12's "cite the Q7 evidence" instruction could not be followed as written**
- **Found during:** Task 1 (evidence mapping)
- **Issue:** The plan's `<interfaces>` block instructed citing `IMPL-PF-Q7`'s evidence for the P12 duplicate row. A grep for `quest_tough_it_out` and its requirement function `quest_req_tough_it_out` across the entire `tests/` tree returned zero hits — Q7 itself has no qualifying evidence yet (it belongs to a not-yet-executed Quest-bucket wave of this phase).
- **Fix:** Recorded P12 as GAP-DESCOPED (duplicate-of-Q7, not ticked) with an explicit note that Q7's own evidence does not yet exist, instead of citing a nonexistent test. No new Quest-level test was fabricated (out of this plan's declared file scope and D-04).
- **Files modified:** `48-FRAGMENT-01-pf-piecies.md` only (docs).
- **Verification:** Re-confirmed via `Grep` for both the Quest id and its requirement-function name across `tests/` — zero hits either way.
- **Committed in:** `ff19882` (Task 1 commit)

**2. [Rule 1 - honesty correction] P7 (varkenspootjes) required a narrower evidence claim than a simple VERIFIED tick**
- **Found during:** Task 1 (evidence mapping) / Task 2 (gap-fill)
- **Issue:** `piecie_varkenspootjes`'s registry entry in `tests/ui/cards/card-registry.js` carries `skipReason: 'requires-mosje-target-pick'` (no real MP-swing assertion runs), and the exported `effect_varkenspootjes` function itself only arms a pending-target flag — the actual +60/-30 MP mutation happens in unexported, non-pure logic in `src/main.js` and `src/bot/botDriver.js`, neither of which can be unit-tested without a forbidden `src/` change.
- **Fix:** Added a gap-fill test asserting the one thing that IS testable and real (the deferred pending-flag hand-off), and recorded an explicit residual-coverage note in the fragment rather than silently claiming the card's full behavior is unit-tested.
- **Files modified:** `tests/effects/phase48-pf-piecie-verification.test.ts`, `48-FRAGMENT-01-pf-piecies.md`.
- **Verification:** `npx vitest run tests/effects/phase48-pf-piecie-verification.test.ts` — 4/4 green.
- **Committed in:** `3b119c3` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — honesty corrections to avoid fabricated/overclaimed evidence, no scope creep, no src/ changes)
**Impact on plan:** Both deviations narrow the plan's claims toward strict D-01/D-02/D-08 accuracy; neither adds unplanned functionality.

## Issues Encountered
None beyond the two deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 12/12 PF Piecie rows have an honest, evidence-backed disposition ready for consolidation into the eventual `48-VERIFICATION.md`
- `IMPL-PF-Q7` is now a known open item for whichever plan covers the Quest bucket (P12's duplicate depends on it)
- `IMPL-AR-P1` (Artistic Rhythm bucket, not this plan) can directly reuse this plan's `piecie_kannetje_melk` evidence citation when that fragment is written
- Full suite verified green: `npx vitest run tests/effects/phase48-pf-piecie-verification.test.ts` 4/4; `npm test` 709/709 (705 baseline + 4 new, 0 regressions); `git diff --stat` confirms zero `src/` files touched

---
*Phase: 48-original-requirement-verification-backfill-for-phases-01-06*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: `tests/effects/phase48-pf-piecie-verification.test.ts`
- FOUND: `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-FRAGMENT-01-pf-piecies.md`
- FOUND: `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-01-SUMMARY.md`
- FOUND commit `ff19882` (Task 1)
- FOUND commit `3b119c3` (Task 2)
