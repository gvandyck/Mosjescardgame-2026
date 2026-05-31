---
phase: 12-unfinished-stubs
plan: "05"
subsystem: docs
tags: [deferred-comments, card-reference, emergency-swap, huisbaas, fps-west, ronald-chef, documentation]

# Dependency graph
requires:
  - phase: 12-04
    provides: Bagga of Greed, Welloe Force, MP Adjuster wired; 691 tests baseline
provides:
  - DEFERRED comments at Emergency Swap and Huisbaas effect functions naming blocking primitives
  - DEFERRED (STUB-16) comments at FPS West and Ronald Chef flag set sites
  - docs/card-reference.md updated for all 16 Phase 12 stubs (11 implemented, 2 partial, 4 deferred)
affects:
  - Future UI phase — deferred primitives are named and discoverable
  - docs/card-reference.md is now the authoritative Phase 12 status reference

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DEFERRED comment pattern: names the specific blocking primitive, the implementation path, and deferred-to phase"
    - "Huisbaas PARTIAL pattern: documents which part works (Place destruction) and which is deferred (deck search)"

key-files:
  created: []
  modified:
    - src/abilities/piecieEffects.js
    - src/abilities/mosjeAbilities.js
    - docs/card-reference.md

key-decisions:
  - "Emergency Swap DEFERRED: ability registry (mosjeAbilities module) already exists; blocking primitive is UI modal for opponent Mosje selection"
  - "Huisbaas PARTIAL: Place destruction works; deck-search-for-Place requires new primitive — not feasible without UI phase"
  - "FPS West and Ronald Chef DEFERRED: flags are set correctly in engine; opponent hand reveal requires boardRenderer.js UI primitive"
  - "card-reference.md deferred status added to legend; all 16 STUB entries updated with accurate notes and final status"

requirements-completed: [STUB-12, STUB-13, STUB-16]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 12 Plan 05: DEFERRED Comments + card-reference.md Update Summary

**All 16 Phase 12 stubs accounted for: 11 implemented, 2 partial (UI-deferred), 4 deferred (named blocking primitives). Every silent no-op in the engine is now either wired or documented with an explicit reason.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added DEFERRED comment to `effect_emergency_swap` in piecieEffects.js: ability registry dispatch pattern documented, exact implementation path (showOptionSelect modal → MOSJES array lookup → mosjeAbilities[abilityId] dispatch) written out, ruling reference to card-specific-rulings.md included
- Updated `effect_huisbaas` in piecieEffects.js: PARTIAL comment clarifies Place destruction is live; DEFERRED comment names the blocking primitive (deck-search-modal + activatePlace call); else branch added for when no active Place exists
- Added DEFERRED (STUB-16) comment at `player.opponentHandPeeked = true` in ability_fps_west_tactical_analysis: names boardRenderer.js as the blocking file and "hand reveal primitive" as the needed feature
- Added DEFERRED (STUB-16) comment at `state._ronaldPeek = peeked` in ability_ronald_chef_strategic_insight: names "peek-reveal modal" as the blocking primitive
- Updated docs/card-reference.md: added `deferred` status to legend; updated all 16 stub entries with accurate summaries and final status; added Phase 12 notes section with complete stub-by-stub summary of what was implemented, what is partial, and what is deferred

## Task Commits

1. **Task 1: DEFERRED comments in piecieEffects.js and mosjeAbilities.js** — `d212e42` (docs)
2. **Task 2: Update docs/card-reference.md for all 16 Phase 12 stubs** — `1af3a06` (docs)

## Files Created/Modified

- `src/abilities/piecieEffects.js` — effect_emergency_swap DEFERRED comment + implementation path; effect_huisbaas PARTIAL/DEFERRED comments + else branch for no-Place case
- `src/abilities/mosjeAbilities.js` — DEFERRED (STUB-16) comments at opponentHandPeeked and _ronaldPeek set sites
- `docs/card-reference.md` — status legend updated; all 16 STUB-XX entries updated; Phase 12 notes section added

## Decisions Made

- Emergency Swap investigated: the ability registry (mosjeAbilities module) already exists in turnManager.js — `mosjeAbilities[mosjeDef.abilityId]` is the dispatch pattern. The only blocker is a UI modal for "choose which opponent Mosje to copy". This is deferrable; the comment documents the exact 4-step implementation path.
- Huisbaas PARTIAL: the Place destruction half already works correctly; only the "search deck for new Place" half is deferred. The function now logs accurately for both paths (active Place vs. no Place).
- FPS West and Ronald Chef are definitively deferred — the engine flags are set correctly, but rendering opponent-side information requires a dedicated UI primitive in boardRenderer.js.
- card-reference.md deferred status added so entries can be accurately classified without being mislabeled as `partial` (which implies the feature is partially wired, not blocked on an external primitive).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None introduced by this plan. All four deferred stubs (STUB-12, STUB-13, STUB-16) have explicit DEFERRED comments naming the blocking primitive. The partial stubs (STUB-07, STUB-09) have their engine documentation complete.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. T-12-05-01 and T-12-05-02 (from plan threat register) are accept dispositions: _ronaldPeek and opponentHandPeeked flags are internal state with no accidental disclosure path in the current implementation.

## Self-Check

Files exist:
- `src/abilities/piecieEffects.js` — modified
- `src/abilities/mosjeAbilities.js` — modified
- `docs/card-reference.md` — modified

Commits:
- d212e42 — Task 1 docs
- 1af3a06 — Task 2 docs

Tests: 691 passing

## Self-Check: PASSED

---
*Phase: 12-unfinished-stubs*
*Completed: 2026-05-31*
