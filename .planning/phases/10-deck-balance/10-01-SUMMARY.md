---
phase: 10-deck-balance
plan: "01"
subsystem: engine
tags: [mosje-slots, subtype, test-scaffolds, equipment-scaling, deck-out, balance]
dependency_graph:
  requires: []
  provides:
    - src/engine/turnManager.js createMosjeSlotFromDefinition with subtype field
    - tests/engine/deck-out.test.ts scaffold
    - tests/effects/equipment-scaling.test.ts scaffold
    - tests/data/deck-balance.test.ts scaffold
  affects:
    - src/abilities/piecieEffects.js (Equipment effects can now read activeMosje.subtype)
tech_stack:
  added: []
  patterns:
    - it.todo() stubs for Wave 2 test scaffolding
key_files:
  created:
    - tests/engine/deck-out.test.ts
    - tests/effects/equipment-scaling.test.ts
    - tests/data/deck-balance.test.ts
  modified:
    - src/engine/turnManager.js
decisions:
  - "Added subtype field immediately after name in createMosjeSlotFromDefinition return object per plan D-02"
  - "Used it.todo() for all scaffold test stubs — Wave 2 plans fill in real assertions"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-30T00:01:25Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 10 Plan 01: Mosje Slot Subtype + Test Scaffolds Summary

Added `subtype: mosjeDef.subtype` to `createMosjeSlotFromDefinition()` in turnManager.js and created three it.todo() test scaffold files that Wave 2 plans will populate with real assertions.

## What Was Done

### Task 1: Add subtype to createMosjeSlotFromDefinition

Modified `src/engine/turnManager.js` line 734 to store the Mosje definition's subtype on the slot object. This one-line addition (`subtype: mosjeDef.subtype`) inserted after `name: mosjeDef.name` ensures that Equipment MP scaling logic in Plan 03 can read `activeMosje.subtype === 'DIGITAL'` from the slot directly. Without this, the check would always return `undefined` (falsy), silently skipping the Digital bonus for all players.

### Task 2: Write Wave 2 test scaffolds

Created three test scaffold files with `it.todo()` stubs:

- **tests/engine/deck-out.test.ts** — 7 todo stubs covering `phaseDrawCard` reshuffle behavior and `startTurn` skip-turn mechanics (BAL-05, for Plan 04)
- **tests/effects/equipment-scaling.test.ts** — 16 todo stubs covering `effect_keyboard`, `effect_mouse`, `effect_controller`, and `effect_tikker` MP scaling at all Mosje levels (BAL-01, for Plan 03)
- **tests/data/deck-balance.test.ts** — 9 todo stubs covering deck composition checks and quest economy integrity (BAL-02/03/04, for Plans 02 and 05)

All stubs show as "todo" in Vitest — zero new failures introduced.

## Verification

- `grep -n "subtype: mosjeDef.subtype" src/engine/turnManager.js` returns exactly one match at line 734
- All three scaffold files exist under `tests/`
- `npm test`: 617 passing, 33 todo, 0 failures (81 test files passed, 3 scaffold files shown as skipped/todo)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 25b664c | feat | Add subtype field to createMosjeSlotFromDefinition |
| 3f9902e | test | Add Wave 2 test scaffolds (deck-out, equipment-scaling, deck-balance) |

## Known Stubs

The three test scaffold files are intentional stubs. They contain `it.todo()` entries only — no real assertions yet. This is the designed output of Plan 01; Wave 2 plans (02, 03, 04, 05) will replace the todos with passing assertions once the implementations exist.

## Self-Check: PASSED

- [x] `src/engine/turnManager.js` contains `subtype: mosjeDef.subtype` at line 734
- [x] `tests/engine/deck-out.test.ts` exists
- [x] `tests/effects/equipment-scaling.test.ts` exists
- [x] `tests/data/deck-balance.test.ts` exists
- [x] Commit 25b664c exists
- [x] Commit 3f9902e exists
- [x] npm test: 617 passing, 0 failures
