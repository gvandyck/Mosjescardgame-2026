---
phase: 22-call-of-the-welloes
plan: "01"
subsystem: engine
tags: [tdd, engine, welloe, return-path, sweep]
dependency_graph:
  requires: []
  provides: [returnMosjeToWelloe, endTurn-welloe-sweep]
  affects: [src/engine/turnManager.js]
tech_stack:
  added: []
  patterns: [deep-clone-and-return, slot-lifecycle-sweep]
key_files:
  created:
    - tests/abilities/call-of-welloes.test.ts
  modified:
    - src/engine/turnManager.js
decisions:
  - "Used inline push+null pattern (not markMosjeDefeated) — no defeat flags, discard entries, or checkVictory"
  - "Sweep placed after piecieSlots for-loop, before questPrepBonus reset; state reassigned via let"
  - "returnMosjeToWelloe clears summonedByPiecie via delete before archiving"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-03"
  tasks_completed: 3
  files_count: 2
---

# Phase 22 Plan 01: returnMosjeToWelloe + endTurn Sweep Summary

**One-liner:** `returnMosjeToWelloe` pure engine helper + `endTurn` anchor-Piecie sweep for Call of the Welloes return path, TDD RED-then-GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — failing tests | e77caf7 | tests/abilities/call-of-welloes.test.ts |
| 2 | GREEN — implementation | ba07463 | src/engine/turnManager.js |
| 3 | Regression — full suite + sim | ba07463 | (no new files; sim reports unchanged) |

## What Was Built

### `returnMosjeToWelloe(gameState, playerId, slotIndex)`
Exported from `src/engine/turnManager.js`. Deep-clones the state, retrieves the slot at `slotIndex`, deletes `summonedByPiecie` from the copy, pushes it to `player.welloe[]`, and nulls the slot. Does NOT set `isDefeated`, does NOT add a discard entry, does NOT call `checkVictory`.

### `endTurn` sweep hook
Inserted immediately after the piecieSlots for-loop (after line 254 in the original). Iterates `activeSlots` for the current player; for any slot with `summonedByPiecie === 'piecie_call_of_welloes'`, checks whether `piecie_call_of_welloes` is still present in `piecieSlots`. If absent, calls `returnMosjeToWelloe` and reassigns `state` (valid because `endTurn` declares `let state`).

## TDD Gate Compliance

- RED commit: `e77caf7` — test file created, 4/5 tests failing (returnMosjeToWelloe undefined / sweep absent)
- GREEN commit: `ba07463` — implementation added, all 5 tests passing

## Verification

- `npx vitest run tests/abilities/call-of-welloes.test.ts`: 5/5 passed
- `npm test`: 891 tests passing (0 failures, no regressions)
- Simulation: 100 games, 0 crashes, 0 timeouts

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. `returnMosjeToWelloe` is a complete, wired engine primitive. Wave 2 (summon path) will call `confirmCallOfWelloes` which depends on this return path being correct.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- `tests/abilities/call-of-welloes.test.ts`: EXISTS
- `src/engine/turnManager.js` contains `export function returnMosjeToWelloe`: CONFIRMED
- `src/engine/turnManager.js` contains sweep guard `summonedByPiecie === 'piecie_call_of_welloes'`: CONFIRMED
- Commits e77caf7 and ba07463: CONFIRMED in git log
