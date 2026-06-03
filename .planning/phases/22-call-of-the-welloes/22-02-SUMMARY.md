---
phase: 22-call-of-the-welloes
plan: "02"
subsystem: engine/abilities
tags: [piecie, welloe, summon, tdd]
dependency_graph:
  requires: [22-01]
  provides: [effect_call_of_welloes, confirmCallOfWelloes, _callOfWelloesPending]
  affects: [src/abilities/piecieEffects.js, src/engine/turnManager.js, src/data/piecies.js]
tech_stack:
  added: []
  patterns: [cloneState deep-clone, cancel-guard pending-flag, stat-restore summon, anchor-link piecieSlot]
key_files:
  created: []
  modified:
    - tests/abilities/call-of-welloes.test.ts
    - src/abilities/piecieEffects.js
    - src/engine/turnManager.js
    - src/data/piecies.js
decisions:
  - "Replaced old effect_call_of_welloes stub (Mosje Reborn passthrough) with real cancel-guard + pending-flag implementation"
  - "confirmCallOfWelloes reads stats directly from welloe record (no savedState wrapper) — consistent with Wave 1 archive design"
  - "No checkVictory call in confirmCallOfWelloes — summon is not a victory-affecting event"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-03"
  tasks_completed: 3
  tasks_total: 3
  tests_before: 891
  tests_after: 896
---

# Phase 22 Plan 02: Call of the Welloes — Summon Path Summary

**One-liner:** Cancel-guard + pending-flag activation (`effect_call_of_welloes`) and stat-restoring summon executor (`confirmCallOfWelloes`) with dual tracking fields for Wave 3 UI consumption.

## What Was Built

### effect_call_of_welloes (src/abilities/piecieEffects.js)
Replaces the old Mosje-Reborn stub. Two silent cancel guards:
- Returns `_callOfWelloesCancel: true` when `player.welloe` is empty
- Returns `_callOfWelloesCancel: true` when no `activeSlots` entry is `null`

On success: maps welloe[] to `welloeOptions` (`{cardId, name, mp, level}`) and sets `state._callOfWelloesPending = { playerId, welloeOptions }` for Wave 3 UI to consume.

### confirmCallOfWelloes (src/engine/turnManager.js)
Summon executor called after UI picks a cardId from `welloeOptions`:
- Splices the chosen record from `player.welloe[]`
- Calls `createMosjeSlotFromDefinition` (local to same file, reuses existing function)
- Restores welloe-recorded `mp`, `level`, `traits`, `statusEffects` from the record
- Sets `slot.summonedByPiecie = 'piecie_call_of_welloes'` (Wave 1's endTurn sweep key)
- Sets `player.piecieSlots[idx].linkedMosjeCardId = mosjeCardId` (anchor link for D-01)
- Returns `{ state, success: true, slotIndex }`

### piecies.js description fix
Replaced "Level 1, 0 MP" placeholder description with accurate "restoring its MP and Level from when it was last defeated" text.

## TDD Gate Compliance

- RED commit: `778ad4f` — 5 failing tests (F–J)
- GREEN commit: `cab6ac3` — all 10 tests passing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate effect_call_of_welloes stub**
- **Found during:** Task 2 (GREEN phase), SyntaxError on test run
- **Issue:** piecieEffects.js already had a stub `effect_call_of_welloes` (lines 726–737) that routed to `effect_mosje_reborn`. My insertion created a duplicate declaration.
- **Fix:** Removed the old stub, kept only the new implementation.
- **Files modified:** src/abilities/piecieEffects.js
- **Commit:** cab6ac3

## Test Results

- Full suite: **896 tests passing** (was 891 after Wave 1; +5 new)
- Ronald Kip stacking test: green (MP restore path covered)
- Simulation: 100 games, **0 crashes, 0 timeouts**

## Known Stubs

None — `effect_call_of_welloes` and `confirmCallOfWelloes` are fully implemented. Wave 3 (22-03) will wire the `_callOfWelloesPending` flag into main.js UI.

## Self-Check: PASSED

- `src/abilities/piecieEffects.js`: effect_call_of_welloes present (1 declaration)
- `src/engine/turnManager.js`: confirmCallOfWelloes present
- `src/data/piecies.js`: description contains "restoring its MP and Level"
- Commits: 778ad4f (RED), cab6ac3 (GREEN) — both in git log
