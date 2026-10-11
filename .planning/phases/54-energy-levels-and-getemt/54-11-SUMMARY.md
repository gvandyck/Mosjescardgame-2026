---
phase: 54-energy-levels-and-getemt
plan: 11
subsystem: engine
tags: [sideways, canMosjeAct, bot, obby-2.0]
requires: ["54-10"]
provides:
  - "canMosjeAct(slot): the single gate for 'may this Mosje act'"
  - "Sideways lifecycle: armed at owner turn start, stands up at owner turn end"
key-files:
  created:
    - src/engine/mp/canMosjeAct.js
    - tests/engine/sideways.test.ts
  modified:
    - src/engine/turnManager.js
    - src/bot/botDriver.js
    - src/bot/strategy/assessQuestRisk.js
    - src/ui/modalManager.js
    - src/main.js
    - tests/bot/strategy.test.ts
    - tests/bot/botDriver.test.ts
requirements-completed: []
duration: 20min
completed: 2026-10-11
---

# Phase 54 Plan 11: Sideways lifecycle Summary

A sideways Mosje sits out exactly one owner turn (no ability, no Quest) and stands up at the end of it, while the player still plays the turn.

## Commits
- a7564f1: canMosjeAct, arm (startTurn) / stand-up (endTurn), useMosjeAbility gate, sideways.test.ts (red first: module missing; 7 cases).
- 0f76122: Quest picker, bot gates, 2.0 loss severity, test rewrites.

## Decision 1 (orchestrator)
Sideways is per-Mosje. `startTurn` sets `sidewaysArmed` on the owner's sideways slots; `endTurn` stands up armed ones. A Mosje getemt during its owner's own turn is not armed yet, so it also sits out the following own turn. V4 `skipNextTurn` is not used (test asserts it stays falsy).

## Gates
- Engine: `useMosjeAbility` refuses with 'This Mosje is sideways' before any Energy is paid.
- Quest entry: `attemptGeneralQuest` / `attemptPersonalQuest` do not know the acting slot, so the guard until Phase 56 is the UI picker (disabled + "(sideways)" label; main.js passes `sideways`) and the bot (`canMosjeAct` in ability phase and `bestQuestSlot`; `assessQuestRisk` returns reason 'sideways').
- **Phase 56 hand-off:** the attack action and the "one action per Mosje" rule must call `canMosjeAct`.

## Bot severity (2.0 terms)
`classifyLossSeverity({mpBefore, level, lossAmount, sideways})`: safe if MP stays above 0 (exactly 0 is now getemt, per E4); L2-3 'regress'; upright L1 'sideways' (required P 0.7, the old 'defeat' bar); sideways 'fatal'. Backup-Mosje logic and 'defeat' tier removed (a getemt is not a defeat). botDriver Risk-and-Reward call updated.

## Test changes (why)
- strategy.test.ts: 'fatal for last Mosje' now 'sideways' and attempts at p 0.83 (V4 lone-Mosje defeat = game loss; 2.0 getemt only turns it sideways); 'defeat with backup' now 'sideways'; classifyLossSeverity defeat/fatal cases replaced by sideways/fatal/exactly-0 cases; getRequiredConfidence uses 'sideways'; added sideways-actor refusal.
- botDriver.test.ts: the two low-MP quest-skip cases (mp 10, 15) now expect the attempt (failure leaves a sideways, not defeated, Mosje); added a sideways-never-quests case.
- Nothing weakened to a no-op.

## Deviations
None.

## Tests
npm test: 100 files / 1024 tests green. node --check (CLAUDE.md list + bot files) clean. Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
