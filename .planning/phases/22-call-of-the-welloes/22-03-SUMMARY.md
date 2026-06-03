---
phase: 22-call-of-the-welloes
plan: "03"
subsystem: ui-wiring
tags: [call-of-the-welloes, modal, ui, browser, card-reference]
dependency_graph:
  requires: [22-02]
  provides: [CALLW-04]
  affects: [src/main.js, docs/card-reference.md]
tech_stack:
  added: []
  patterns: [pending-flag modal branch, showOptionSelect, confirmCallOfWelloes]
key_files:
  modified:
    - src/main.js
    - docs/card-reference.md
decisions:
  - "_callOfWelloesCancel cleanup placed inline after the pending-flag branch (not inside it) — runs unconditionally on every activation"
  - "Silent cancel is implicit: effect_call_of_welloes never sets _callOfWelloesPending on cancel, so the branch never fires"
  - "Card-reference Phase 4 deferred note updated to resolved checkmark; Phase 8 partial list trimmed"
metrics:
  duration: "~15 min"
  completed: "2026-06-03"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 2
---

# Phase 22 Plan 03: Call of the Welloes UI Wiring Summary

**One-liner:** Browser UI wired for Call of the Welloes — activating the Piecie shows a Welloe-pick modal via `showOptionSelect`, calls `confirmCallOfWelloes`, and silently ignores empty-pile/no-slot cancels.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Wire _callOfWelloesPending branch + import | 2035deb | src/main.js |
| 2 | Update card-reference.md | 3a37a4d | docs/card-reference.md |
| 3 | Human verify checkpoint | PENDING | — |

## What Was Built

### Task 1 — main.js UI branch
- Added `confirmCallOfWelloes` to the `turnManager.js` import on line 10
- Inserted `_callOfWelloesPending` branch after the Welloe Force block in `handleActivatePiecie`
- Branch maps `welloeOptions` to `{ id, label, metaLabel }` and calls `modal.showOptionSelect`
- On pick: calls `confirmCallOfWelloes(gameState, localPlayerId, chosen)` and applies the new state
- Deletes `_callOfWelloesPending` after branch; cleans up `_callOfWelloesCancel` unconditionally
- No `showError`/`alert` on cancel path — fully silent

### Task 2 — card-reference.md
- Row status: `partial` → `implemented` with summon-restore-return behavior description
- Phase 4 deferred note: updated to resolved checkmark
- Phase 8 partial list: `call-of-the-welloes` entry removed
- Phase 22 notes section added documenting all three waves

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes.

## Self-Check

- [x] src/main.js modified and syntax-checked (`node --check` exits 0)
- [x] `confirmCallOfWelloes` appears 2 times in main.js (import + call)
- [x] `_callOfWelloesPending` and `_callOfWelloesCancel` both present in main.js
- [x] docs/card-reference.md shows `implemented` status for Call of the Welloes
- [x] Verification script exits 0 (`node -e` regex check)
- [x] Task 3 checkpoint returned to user for browser verification

## Self-Check: PASSED
