---
plan: 26-03
phase: 26-debug-logging-system
status: complete
completed: 2026-06-05
---

## Summary

Extended `showDiceRoll` callback signature in modalManager.js to expose the raw dice result and threshold, then updated both call sites in main.js to log "rolled N, needed M+" in quest resolution entries.

## What was built

- **Task 1 (modalManager.js)**:
  - No-container stub: `onResolved(false)` → `onResolved(false, { roll: 0, threshold: _threshold })`
  - Real implementation "Continue →" handler: `onResolved(didSucceed)` → `onResolved(didSucceed, { roll: result, threshold })`

- **Task 2 (main.js)**:
  - Site A (general quest, line ~1039): callback `(didSucceed)` → `(didSucceed, rollInfo)`, log enriched with rollLabel
  - Site B (personal quest, line ~1781): same pattern — callback updated and log entry enriched
  - Both sites use `rollInfo ? \`rolled ${rollInfo.roll}, needed ${rollInfo.threshold}+ → \` : ''` fallback guard

## Key files

- `src/ui/modalManager.js` — showDiceRoll stub + click handler (lines 17, 136)
- `src/main.js` — both showDiceRoll call sites (lines 1039, 1781)

## Self-Check: PASSED

- node --check: clean on all 6 UI files
- npm test: 920 passed, 0 failures
- `grep "onResolved(didSucceed, { roll" src/ui/modalManager.js` — 1 match
- `grep "didSucceed, rollInfo" src/main.js` — 2 matches
- `grep "rolled.*needed" src/main.js` — 2 matches
