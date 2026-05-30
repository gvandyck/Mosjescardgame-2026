---
plan: 10-04
phase: 10-deck-balance
status: complete
date: 2026-05-30
---

# Plan 10-04 Summary — Deck-Out Engine Rule

## What Was Built

Implemented the deck-out rule in `src/engine/turnManager.js` per D-06: reshuffle discard on empty deck, set `player.skipNextTurn = true`, and skip the player's next turn entirely. Filled in all 7 `deck-out.test.ts` assertions.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | phaseDrawCard deck-out branch + startTurn skip guard | ✓ Done | dff60f3 |
| 2 | Fill deck-out.test.ts with real assertions | ✓ Done | e5d2bdb |

## Key Changes

**`src/engine/turnManager.js`:**
- `phaseDrawCard`: when deck empty + non-empty discard → shuffle discard into deck, draw 1, set `skipNextTurn = true`; when both empty → no-op
- `startTurn`: skip guard before per-turn tracker reset — if `skipNextTurn === true`, clear flag, advance `activePlayerId`, return early

**`tests/engine/deck-out.test.ts`:**
- 7 real assertions covering all deck-out behaviors

## Verification

- `grep -n "skipNextTurn" src/engine/turnManager.js` → 4 matches (set, check, clear, log)
- `npm test` → **624 passing, 26 todo, 0 failures** — 7 deck-out tests promoted to green

## Self-Check: PASSED

All must-haves verified:
- [x] phaseDrawCard with empty deck + non-empty discard: reshuffles, draws 1, sets skipNextTurn = true
- [x] phaseDrawCard with both empty: no draw, no penalty
- [x] startTurn with skipNextTurn = true: skips entire turn, advances activePlayerId, clears flag
- [x] All 7 deck-out tests pass
