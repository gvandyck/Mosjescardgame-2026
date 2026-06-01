---
phase: 14-physical-equipment-cards
plan: "03"
subsystem: card-effects
tags: [physical-equipment, place, tdd, cless, the-gym, boxing-ring, docs]
dependency_graph:
  requires:
    - phase: 14-01
      provides: [effect_dumbbells, effect_boxing_gloves, effect_skipping_rope, physical-equipment-scaling.test.ts]
    - phase: 14-02
      provides: [effect_protein_shake, effect_boxing_ring, place_boxing_ring]
  provides: [effect_the_gym CLESS branch, updated The Gym description, card-reference.md Phase 14 docs]
  affects: [src/abilities/placeEffects.js, src/data/places.js, docs/card-reference.md]
tech_stack:
  added: []
  patterns: [cardId-substring-check, isCless-guard, else-if-priority-chain]
key_files:
  created: []
  modified:
    - tests/effects/physical-equipment-scaling.test.ts
    - src/abilities/placeEffects.js
    - src/data/places.js
    - docs/card-reference.md
key_decisions:
  - "CLESS branch placed as else-if AFTER physical >= 2 branch — physical trait earns physical bonus even on CLESS Mosjes"
  - "isCless check uses cardId.includes('cless') matching mosje_azn_cless and mosje_cless_teacher"
  - "Simulation crash confirmed pre-existing (Phase 12 Plan 01 out-of-scope issue); not introduced by Phase 14"
  - "effect_the_gym static import added to existing test import line — no dynamic await import() inside it() callbacks"

requirements-completed: [PHYS-06]

duration: "3min"
completed: "2026-05-31"
---

# Phase 14 Plan 03: The Gym CLESS Patch + Card Reference Docs Summary

**CLESS-tagged Mosjes (mosje_azn_cless, mosje_cless_teacher) now gain +20 MP at The Gym END_PHASE instead of losing 10 MP; all 6 Phase 14 cards documented in card-reference.md.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-31T19:07:48Z
- **Completed:** 2026-05-31T19:11:00Z
- **Tasks:** 2
- **Files modified:** 4 (including test file)

## Accomplishments

- Patched `effect_the_gym` with `isCless` branch: CLESS Mosjes with physical < 2 gain +20 MP instead of losing 10
- Priority chain maintained: physical >= 3 > physical >= 2 > isCless > default applyDamage(-10)
- Updated The Gym description in `places.js` to mention CLESS-tagged Mosjes clause
- All 6 Phase 14 cards documented in `docs/card-reference.md` (4 Piecies + Boxing Ring + The Gym update)
- Card counts corrected: Piecie 64 → 68, Place 16 → 17
- Phase 14 notes section appended to card-reference.md
- 721 tests passing (3 new CLESS tests + 718 prior baseline; 0 regressions)

## Task Commits

1. **RED gate — failing CLESS tests** - `e3df13e` (test)
2. **Task 1: GREEN — CLESS patch + description update** - `7726004` (feat)
3. **Task 2: card-reference.md docs** - `79229a0` (docs)

## Files Created/Modified

- `tests/effects/physical-equipment-scaling.test.ts` — 3 new CLESS patch tests appended; effect_the_gym added to static import
- `src/abilities/placeEffects.js` — effect_the_gym patched with isCless branch (+20 MP for CLESS, physical < 2)
- `src/data/places.js` — The Gym description updated to mention CLESS-tagged Mosjes bonus
- `docs/card-reference.md` — Piecie count +4, Place count +1; 4 new Piecie rows; Boxing Ring Place row; The Gym row updated; Phase 14 notes section added

## Decisions Made

- **CLESS branch after physical branches**: A CLESS Mosje with physical >= 2 earned the physical bonus through deck building — it should receive that. CLESS bonus only fires when physical < 2 (the Mosjes that would be penalised). This is correct per PHYS-06 spec.
- **cardId.includes('cless')**: Consistent with the `effect_coerts_caravan` pattern (id.includes('coert')). Catches mosje_azn_cless and mosje_cless_teacher in one check.
- **Static import in test file**: Per key_instructions, `effect_the_gym` added to the existing `import { effect_boxing_ring, ... }` line at the top — no dynamic await import() inside it() callbacks.

## Deviations from Plan

None — plan executed exactly as written. The TDD RED/GREEN gates, CLESS branch structure, places.js description text, card-reference.md row formats, and Phase 14 notes section all match the plan specification.

## Known Stubs

None — all Phase 14 cards are fully wired with correct data flow. No placeholder values, no TODO markers, no hardcoded empty returns.

## Simulation Note

The simulation crashes with a pre-existing error (null prototype exception) documented as out-of-scope in Phase 12 Plan 01. Confirmed unchanged by reverting to the prior commit and reproducing the same crash output identically. No new crashes introduced by Phase 14 changes.

## Threat Flags

None — all changes are pure in-memory engine functions. No new network endpoints, auth paths, file access patterns, or schema changes. The `cardId.includes('cless')` check operates on internal engine IDs only; no external input path exists.

## TDD Gate Compliance

- RED gate: `test(14-03)` commit `e3df13e` — 1 test failing (CLESS Mosje expected +20 MP, got -10 MP)
- GREEN gate: `feat(14-03)` commit `7726004` — 721 tests passing, 0 regressions
- REFACTOR gate: Not required — implementation is clean on first pass

## Self-Check: PASSED
