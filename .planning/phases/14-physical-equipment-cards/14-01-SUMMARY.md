---
phase: 14-physical-equipment-cards
plan: "01"
subsystem: card-effects
tags: [physical-equipment, piecie, tdd, fighting]
dependency_graph:
  requires: []
  provides: [effect_dumbbells, effect_boxing_gloves, effect_skipping_rope, piecie_dumbbells, piecie_boxing_gloves, piecie_skipping_rope]
  affects: [src/abilities/piecieEffects.js, src/data/piecies.js]
tech_stack:
  added: []
  patterns: [flat-MP-gain, conditional-draw, trait-gate, GANDOE-tag-check, MP_LOSS_HALVED-push]
key_files:
  created:
    - tests/effects/physical-equipment-scaling.test.ts
  modified:
    - src/data/piecies.js
    - src/abilities/piecieEffects.js
decisions:
  - "Dumbbells uses flat 20 MP (not level-scaled) to FIGHTING Mosje per PLAN.md truths — PATTERNS.md getPhysicalMP helper was not adopted since the plan specifies flat damage"
  - "Boxing Gloves GANDOE check uses cardId.includes('gandoe') matching existing Coert's Caravan / effect_the_gym pattern"
  - "MP_LOSS_HALVED turnsLeft:1 for Boxing Gloves (not 2 like Bowie & Stormey) — plan explicitly specifies 1-turn duration"
  - "Skipping Rope always draws (deck.length > 0 guard) regardless of Mosje subtype; questPrepBonus +1 only for FIGHTING"
metrics:
  duration: "122s"
  completed: "2026-05-31T19:00:30Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 14 Plan 01: Physical Equipment Cards Summary

**One-liner:** Three PHYSICAL-EQUIPMENT Piecies (Dumbbells flat-20 MP, Boxing Gloves GANDOE-gate 25/40 MP, Skipping Rope questPrepBonus+draw) implemented and tested with TDD RED-then-GREEN discipline.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — Failing tests for Dumbbells, Boxing Gloves, Skipping Rope | dfb1a75 | tests/effects/physical-equipment-scaling.test.ts |
| 2 | GREEN — Card definitions + effect functions | e7a336a | src/data/piecies.js, src/abilities/piecieEffects.js |

## TDD Gate Compliance

- RED gate: `test(14-01)` commit `dfb1a75` — 17 tests failing (functions not exported)
- GREEN gate: `feat(14-01)` commit `e7a336a` — 17 tests passing, 708 total passing, 0 regressions
- REFACTOR gate: Not required — implementation is clean on first pass

## What Was Built

### Dumbbells (piecie_dumbbells, ★)
- `effect_dumbbells` in `src/abilities/piecieEffects.js`
- Gives flat **20 MP** to FIGHTING Mosje at any level (levels 1, 2, 3 all yield 20)
- Gives **5 MP** base to non-FIGHTING Mosje
- Draws 1 card only at FIGHTING level 3 (level-3 bonus gate)
- Deck-empty guard on draw: `if (player.deck.length > 0)`

### Boxing Gloves (piecie_boxing_gloves, ★★)
- `effect_boxing_gloves` in `src/abilities/piecieEffects.js`
- Requires `mosje.traits.physical >= 2` — returns unchanged state if physical < 2
- Gives **25 MP** to Physical ★★+ Mosje (no GANDOE tag)
- GANDOE check: `mosje.cardId.toLowerCase().includes('gandoe')`
- GANDOE path: gives **40 MP** + pushes `{ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 1 }` to all active slots
- MP_LOSS_HALVED is consumed by existing mpManager.js halving logic (no mpManager change needed)

### Skipping Rope (piecie_skipping_rope, ★)
- `effect_skipping_rope` in `src/abilities/piecieEffects.js`
- FIGHTING Mosje: `questPrepBonus += 1` AND draw 1 card
- Non-FIGHTING Mosje: draw 1 card only (questPrepBonus unchanged)
- Deck-empty guard on draw

## Verification Results

```
grep -c "effect_dumbbells|effect_boxing_gloves|effect_skipping_rope" src/abilities/piecieEffects.js → 3
grep -c "PHYSICAL-EQUIPMENT" src/data/piecies.js → 6
grep -c "piecie_dumbbells|piecie_boxing_gloves|piecie_skipping_rope" src/data/piecies.js → 3
npm test physical-equipment-scaling → 17 passed
npm test (full suite) → 708 passed, 88 test files
```

## Deviations from Plan

**1. [Rule 2 - Pattern decision] Did not use getPhysicalMP helper from PATTERNS.md**
- Found during: Task 2 GREEN
- Issue: PATTERNS.md showed a `getPhysicalMP(mosje)` helper with level-scaling (15/25/40 MP). The PLAN.md truths explicitly state "effect_dumbbells gives 20 MP to a Physical Mosje" (flat, no scaling).
- Fix: Implemented flat 20 MP logic inline without a level-scaling helper. PLAN.md takes precedence over PATTERNS.md.
- Files modified: src/abilities/piecieEffects.js

All other aspects executed exactly as written.

## Known Stubs

None — all three effects are fully wired with correct data flow. No placeholder values, no hardcoded empty returns, no TODO markers.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure in-memory engine functions.

## Self-Check: PASSED
