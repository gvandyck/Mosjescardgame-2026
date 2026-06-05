---
phase: 24-interrupt-modal-system
plan: "02"
subsystem: game-loop, ui-interaction
tags: [async, interrupt, bot, snelle-piecie, offline]
dependency_graph:
  requires: [24-01]
  provides: [async_playBotSteps, humanTakesDamageOrElimination, showDamageInterruptModal]
  affects: [src/main.js]
tech_stack:
  added: []
  patterns: [async/await setTimeout, interrupt modal pattern, fire-and-forget with .catch()]
key_files:
  created: []
  modified:
    - src/main.js
decisions:
  - "Empty freshSteps after interrupt calls onComplete immediately to prevent T-24-03 infinite recursion"
  - "End Turn call site uses fire-and-forget + .catch() since event listener is synchronous"
  - "isOffline guard ensures interrupt modal never fires in bot-vs-bot or online mode"
metrics:
  duration: "~15 minutes"
  completed: 2026-06-05
  tasks_completed: 3
  files_changed: 1
---

# Phase 24 Plan 02: Async playBotSteps with Interrupt Modal Summary

playBotSteps converted to async with a guaranteed pause window before damaging bot steps, letting the human reactively play Not Today! or Emergency Healings in offline mode.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add humanTakesDamageOrElimination and showDamageInterruptModal helpers | 049dd37 | src/main.js |
| 2 | Convert playBotSteps to async with interrupt hook | a9d6af | src/main.js |
| 3 | Human-verify checkpoint | APPROVED | — |

## What Changed

**humanTakesDamageOrElimination** — Pure helper that compares prevState vs nextState for a given player. Returns `{ isDamage, isElimination, affectedSlotIndex, mpDelta }`. Detects elimination (slot null or isDefeated) and >= 30 MP damage events per bot step.

**showDamageInterruptModal** — Async helper that filters the human's hand for PROTECT-tagged Snelle Piecies, builds an options list via `modal.showOptionSelect`, and calls `playSnellie` if the human selects a card. Validates handIndex >= 0 and cardDef !== undefined before calling playSnellie (T-24-02 mitigation). Returns false immediately if no playable interrupt cards are in hand.

**playBotSteps (async)** — Replaced the recursive `setTimeout` callback pattern with `await new Promise(resolve => setTimeout(resolve, delay))`. Added interrupt check guarded by `if (isOffline)`. After human plays a card, re-runs `driveBotTurnSteps` from the updated gameState and recurses from index 0. If fresh steps are empty, calls onComplete and returns (T-24-03 DoS mitigation).

**End Turn call site** — Added `.catch(err => console.error('[BOT] playBotSteps error:', err))` to the fire-and-forget call in the click event listener.

## Checkpoint: APPROVED

Human verified all 6 browser tests and approved. Plan is COMPLETE.

## Test Results

916 passing / 1 pre-existing failure (DECK-14 deck-balance, out of scope). No regressions from either task.

## Deviations from Plan

None — plan executed exactly as written. The T-24-03 empty-freshSteps guard was added as specified in the threat model.

## Known Stubs

None introduced.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. The interrupt modal is gated behind `isOffline` and never exposes opponent state (T-24-04 compliant).

## Self-Check: PASSED

- `grep -n "async function playBotSteps" src/main.js` — 1 match at line 489
- `grep -c "humanTakesDamageOrElimination" src/main.js` — 3 matches (definition + 2 calls)
- `grep -c "showDamageInterruptModal" src/main.js` — 2 matches (definition + call)
- `grep -n "isOffline" src/main.js` shows interrupt block guarded by `if (isOffline)`
- `.catch(err => console.error` present on End Turn call site
- Commits 049dd37 and a9d16af present in git log
- 916 tests passing
