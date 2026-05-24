---
phase: "09"
plan: "09-02"
subsystem: "ui/snelle-piecie"
tags: [bug-fix, lucky-coin, slot-guard, BUG-04]
dependency_graph:
  requires: []
  provides: [BUG-04-fix]
  affects: [src/main.js, tests/engine/snelle-piecie-full-slots.test.ts]
tech_stack:
  added: []
  patterns: [pre-condition-guard, engine-characterization-test]
key_files:
  created: []
  modified:
    - src/main.js
    - tests/engine/snelle-piecie-full-slots.test.ts
decisions:
  - "Guard placed in main.js UI layer before coin flip, keeping playSnellie safety net intact"
  - "TDD characterization tests added for existing engine-level slot enforcement"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-24"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 09 Plan 02: Lucky Coin Pre-Flip Slot Guard (BUG-04) Summary

Pre-flip slot guard added to Lucky Coin activation in main.js — coin flip now blocked when all 4 Piecie/Place slots are full, preventing free risk-free flips.

## What Was Built

### Task 1: Pre-flip slot guard in main.js (commit d0dcddc)

Inserted a slot-count check as the very first statement in the `effect_snelle_lucky_coin` branch of main.js, before `Math.random() < 0.5`. When all 4 Piecie/Place slots are full, the handler shows a `modal.showInfo` message and returns early — the coin is never flipped.

**Guard pattern added (src/main.js lines 1329-1337):**
```js
// BUG-04 fix: check slot availability BEFORE flipping the coin.
const filledSlots = gameState.players[localPlayerId].piecieSlots.filter(s => s !== null).length;
const activePlaceCount = gameState.activePlace ? 1 : 0;
if (filledSlots + activePlaceCount >= 4) {
    modal.showInfo('Cannot Play', 'Cannot play Lucky Coin — all Piecie/Place slots are full.');
    return;
}
const isHeads = Math.random() < 0.5;  // original — now only reached when slots available
```

The `playSnellie()` slot check in `turnManager.js` remains unchanged as a safety net.

### Task 2: Engine-level characterization tests (commit b2912bb)

Extended `tests/engine/snelle-piecie-full-slots.test.ts` with a new `describe` block:
- "Lucky Coin — Full Slot Guard (BUG-04)"
- Test 1: `playSnellie` with Lucky Coin and 4 full slots returns `success: false` with correct error message
- Test 2: `playSnellie` with Lucky Coin and 3 full slots is not blocked by slot capacity

These tests document the engine-layer invariant — not the UI guard (which cannot be unit-tested). The `playSnellie` safety net was already enforcing this behavior; the tests now characterize it explicitly for Lucky Coin.

## Verification Results

- `grep -n "filledSlots.*activePlaceCount" src/main.js` → line 1333 (guard present)
- `grep -n "Cannot play Lucky Coin" src/main.js` → line 1334 (user-facing error)
- Guard at line 1333 appears before `Math.random()` at line 1337 — confirmed correct order
- `npm test` → **590 tests pass** (up from 588; 2 new BUG-04 tests added, 0 regressions)

## Deviations from Plan

None — plan executed exactly as written. The TDD characterization tests passed immediately (GREEN without a failing RED) because the engine-level behavior in `playSnellie()` already existed. The tests document the invariant rather than driving new implementation.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: T-09-02-01 mitigated | src/main.js | Pre-flip slot guard blocks exploitation of free coin flips with full slots |

## Self-Check: PASSED

- src/main.js modified with pre-flip guard: FOUND
- tests/engine/snelle-piecie-full-slots.test.ts extended with BUG-04 block: FOUND
- commit d0dcddc (fix): FOUND
- commit b2912bb (test): FOUND
- 590 tests passing: CONFIRMED
