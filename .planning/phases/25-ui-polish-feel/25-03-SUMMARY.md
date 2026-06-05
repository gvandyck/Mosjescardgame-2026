---
phase: 25-ui-polish-feel
plan: "03"
subsystem: ui
tags: [stats, end-game, reward-overlay, ux]
dependency_graph:
  requires: []
  provides: [end-game-stats-screen]
  affects: [src/main.js, src/ui/rewardOverlay.js, styles/main.css]
tech_stack:
  added: []
  patterns: [stats-accumulator, slot-diff-tracking]
key_files:
  modified:
    - src/main.js
    - src/ui/rewardOverlay.js
    - styles/main.css
decisions:
  - "Used prevActiveSlots snapshot pattern for mosjesLost detection — same before/after diff used in animateMosjeDeltas; avoids needing engine changes"
  - "Incremented gameStats at all 3 resolveQuest call sites (Geen Raad, general quest, personal quest); Geen Raad recovery path intentionally excluded per plan spec"
  - "statsSection rendered via template literal with integer values from local accumulator — no HTML injection risk"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_changed: 3
---

# Phase 25 Plan 03: End-Game Stats Screen Summary

Added a lightweight gameStats accumulator in initGamePage scope and a "Your Game" stats section to the reward overlay — players now see 5 quantified highlights after each game ends.

## Tasks Completed

| Task | Commit | Description |
|------|--------|-------------|
| 1 — gameStats accumulator in main.js | 07fe03a | Declare gameStats, trackPeakMP helper, prevActiveSlots snapshot, increments at 3 resolveQuest sites, pass stats to showRewardOverlay |
| 2 — Stats section in rewardOverlay.js | 573a1b6 | Accept stats param, render 5-stat "Your Game" section, add CSS rules to main.css |

## What Was Built

- `gameStats` object declared at `initGamePage` scope tracking: `questsAttempted`, `questsSucceeded`, `peakMP`, `biggestSingleGain`, `mosjesLost`
- `trackPeakMP()` helper called after every `renderAndCheckWin` to update peak
- `prevActiveSlots` snapshot used to detect `isDefeated` transitions for `mosjesLost`
- `renderAndCheckWin` rewritten to diff slots before calling `renderFromState`, snapshot afterwards, then call `trackPeakMP`
- Stat increments at all 3 `resolveQuest` call sites: Geen Raad (~line 896), general quest dice roll (~line 989), personal quest dice roll (~line 1722)
- `showRewardOverlay` extended with optional `stats` parameter; renders stats section between munten and back button when present
- CSS added to `styles/main.css` for `.reward-stats`, `.reward-stats__title`, `.reward-stats__list`, `.stat-label`, `.stat-value`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 5 stats are wired to real accumulator values.

## Self-Check: PASSED

- src/main.js: 13 gameStats references, 2 trackPeakMP references, 1 stats: gameStats reference
- src/ui/rewardOverlay.js: 12 stats references, 3 reward-stats references
- styles/main.css: 4 reward-stats references
- Commits 07fe03a and 573a1b6 verified in git log
- node --check: clean (no output)
- npm test: 920 passed, 0 failures
