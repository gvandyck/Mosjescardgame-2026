---
plan: 26-01
phase: 26-debug-logging-system
status: complete
completed: 2026-06-05
---

## Summary

Added source attribution to quest cost log entries in `showQuestPreviewThenRoll` (main.js line 1090).

## What was built

- **Task 1**: Changed `log.add('loss', 'Quest attempt cost: -20 MP')` → `log.add('loss', \`Quest cost: ${questDef.name} -20 MP\`)` — quest name now appears in the loss entry.
- **Task 2**: Verified personal quest resolution callback (line ~1859) already had `${questDef.name}` in its log.add call — no change needed.

## Key files

- `src/main.js` — quest cost log entry at line 1090

## Self-Check: PASSED

- node --check: clean
- npm test: 920 passed, 0 failures
- `grep "Quest cost.*questDef.name" src/main.js` returns 1 match inside showQuestPreviewThenRoll
