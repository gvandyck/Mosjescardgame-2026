---
phase: 24-interrupt-modal-system
plan: "01"
subsystem: card-data, abilities
tags: [data-fix, tdd, piecie, snelle-piecie, interrupt]
dependency_graph:
  requires: []
  provides: [piecie_laat_me_chillen-persist, not-today-graveyard-text, snelle-emergency-heal-unconditional]
  affects: [src/data/piecies.js, src/data/snellePiecies.js, src/abilities/snelleEffects.js]
tech_stack:
  added: []
  patterns: [TDD RED-then-GREEN, pure-function effect replacement]
key_files:
  created:
    - tests/abilities/interrupt-data-fixes.test.ts
  modified:
    - src/data/piecies.js
    - src/data/snellePiecies.js
    - src/abilities/snelleEffects.js
decisions:
  - "persistUntilEndOfTurn placed after isBoosterOnly in piecie_laat_me_chillen per plan spec"
  - "effect_snelle_emergency_healings body fully replaced to match effect_emergency_healings pattern"
  - "Pre-existing deck-balance test failure (DECK-14 / getKickboxingBootcampDiceBonus) is out of scope"
metrics:
  duration: "~10 minutes"
  completed: 2026-06-04
  tasks_completed: 2
  files_changed: 4
---

# Phase 24 Plan 01: Interrupt Data Fixes Summary

Three small prerequisite data/logic fixes for the interrupt modal system: piecie_laat_me_chillen now persists until end of turn, Not Today! uses correct graveyard terminology, and effect_snelle_emergency_healings heals unconditionally.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix Laat me chillen! lifecycle + Not Today! text | 82ba41e | src/data/piecies.js, src/data/snellePiecies.js, tests/abilities/interrupt-data-fixes.test.ts |
| 2 | Fix effect_snelle_emergency_healings unconditional heal | 9c5df23 | src/abilities/snelleEffects.js |

## What Changed

**piecie_laat_me_chillen** — Added `persistUntilEndOfTurn: true`. The `activatePiecie` sweep in `turnManager.js` checks this flag; without it the `else` branch ran immediately, removing the card from the field as soon as it activated.

**snelle_negate_elimination (Not Today!)** — Description updated from "Welloe pile" to "the graveyard". Phase 23 renamed all pile references; this card was missed.

**effect_snelle_emergency_healings** — Removed `if (mosje.mp <= 0) mosje.mp = 30` conditional set. Replaced with the same resilient-trait-aware `+= healAmount` pattern from `effect_emergency_healings`. The card now heals +25 (or +35 with resilient >= 2) regardless of current MP.

## Test Results

5 new tests in `tests/abilities/interrupt-data-fixes.test.ts`, all passing:
- Test 1: piecie_laat_me_chillen.persistUntilEndOfTurn === true
- Test 2: Not Today! description contains "graveyard", not "Welloe pile"
- Test 3: effect_snelle_emergency_healings heals +25 when mp=50
- Test 4: effect_snelle_emergency_healings heals +35 when resilient >= 2
- Test 5: effect_snelle_emergency_healings heals +25 when mp=0 (gain not set)

Total: 916 passing / 1 pre-existing failure (DECK-14 deck-balance test, out of scope).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None introduced.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- tests/abilities/interrupt-data-fixes.test.ts: FOUND
- src/data/piecies.js persistUntilEndOfTurn: FOUND at line 489
- src/data/snellePiecies.js graveyard text: FOUND at line 145
- src/abilities/snelleEffects.js mp <= 0 guard: ABSENT (verified via grep)
- Commits 82ba41e and 9c5df23: FOUND in git log
