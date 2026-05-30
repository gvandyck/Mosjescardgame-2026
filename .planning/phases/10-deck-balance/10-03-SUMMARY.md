---
phase: 10-deck-balance
plan: "03"
subsystem: engine
tags: [equipment-scaling, digital-subtype, tikker, quest-blocked, piecieEffects, questLogic, tdd]
dependency_graph:
  requires:
    - 10-01 (subtype field on Mosje slot — src/engine/turnManager.js createMosjeSlotFromDefinition)
  provides:
    - src/abilities/piecieEffects.js — Digital-scaled Equipment effects + fixed Tikker
    - src/abilities/questLogic.js — QUEST_BLOCKED guard in canAttemptGeneralQuest and canAttemptPersonalQuest
    - tests/effects/equipment-scaling.test.ts — 20 passing assertions (BAL-01)
  affects:
    - Digital Control deck (Equipment cards now provide 15/25/40 MP vs 5 MP flat)
    - Physical Force deck (Tikker now gives flat 40 MP + QUEST_BLOCKED, no dice)
tech_stack:
  added: []
  patterns:
    - getDigitalMP helper: reads mosje.subtype and mosje.level to determine Equipment MP amount
    - QUEST_BLOCKED statusEffect guard: checked via Array.some() before quest eligibility proceeds
key_files:
  created:
    - tests/effects/equipment-scaling.test.ts
  modified:
    - src/abilities/piecieEffects.js
    - src/abilities/questLogic.js
decisions:
  - "getDigitalMP helper returns 15/25/40 for Digital Mosje at Lv1/2/3, 5 for all others"
  - "effect_tikker uses flat +40 MP and pushes QUEST_BLOCKED (removed dice roll per D-01)"
  - "effect_keyboard flavor bonus: draw 1 card (replaces old questPrepBonus +1)"
  - "effect_mouse flavor bonus: draw 1 card (was draw-only with no MP gain)"
  - "effect_controller flavor bonus: questPrepBonus +1 (replaces old draw 1)"
  - "QUEST_BLOCKED guard inserted via getFirstActiveMosje in canAttemptPersonalQuest"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-30T00:14:21Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 3
---

# Phase 10 Plan 03: Equipment MP Scaling + Tikker Fix + QUEST_BLOCKED Guard Summary

Digital Equipment cards (Keyboard, Mouse, Controller) now scale MP by active Mosje level when subtype is DIGITAL (15/25/40 at Lv1/2/3), Tikker gives flat +40 MP and blocks quests via QUEST_BLOCKED status, and both canAttemptGeneralQuest and canAttemptPersonalQuest enforce the block.

## What Was Done

### Task 1: Rewrite Equipment effects and fix Tikker (feat commit 5dff876)

Modified `src/abilities/piecieEffects.js` with four replacements and one new helper:

**New helper `getDigitalMP(mosje)`** (added above effect_keyboard in the DIGITAL EQUIPMENT section):
- Returns 5 if `mosje.subtype !== 'DIGITAL'`
- Returns 15 for level 1, 25 for level 2, 40 for level 3 (or higher)

**effect_tikker** replaced: removed the `rollDie(6) * 5` calculation; now gives flat `+40 MP` and pushes `{ type: 'QUEST_BLOCKED', value: 1, turnsLeft: 1 }` onto the active Mosje's statusEffects.

**effect_keyboard** replaced: calls `getDigitalMP(mosje)` via `applyMPGain`, then draws 1 card as flavor bonus (previously was hardcoded `+15 MP + questPrepBonus +1`).

**effect_mouse** replaced: calls `getDigitalMP(mosje)` via `applyMPGain`, then draws 1 card as flavor bonus (previously drew 1 card but gave no MP at all).

**effect_controller** replaced: calls `getDigitalMP(mosje)` via `applyMPGain`, then sets `questPrepBonus +1` (previously was `+10 MP + draw 1`).

All 617 pre-existing tests still pass after this change.

### Task 2: Fill in equipment-scaling.test.ts with real assertions (test commit cdb282e)

Created `tests/effects/equipment-scaling.test.ts` from scratch (the scaffold created by Plan 01 existed only in the main repo, not in this worktree). Contains 20 real assertions across 5 describe blocks:

- `effect_keyboard`: 3 Digital level tests (15/25/40), 1 non-Digital test (5), 2 draw-1 tests
- `effect_mouse`: 3 Digital level tests (15/25/40), 1 non-Digital test (5), 1 draw-1 test
- `effect_controller`: 3 Digital level tests (15/25/40), 1 non-Digital test (5), 1 questPrepBonus test
- `effect_tikker`: flat-40 test, QUEST_BLOCKED status effect test
- `QUEST_BLOCKED enforcement`: canAttemptGeneralQuest returns false, canAttemptPersonalQuest returns false

18 of 20 tests passed immediately after Task 1's implementation. The 2 QUEST_BLOCKED enforcement tests failed (RED) until Task 3.

### Task 3: Add QUEST_BLOCKED guard to questLogic.js (feat commit 92c01cf)

Modified `src/abilities/questLogic.js` with two guard insertions:

**canAttemptGeneralQuest** (after `activeMosje` null check, before MP check): added `if (activeMosje?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED'))` → returns false with log message.

**canAttemptPersonalQuest** (after player null check, before `activeMosjes` filter): called `getFirstActiveMosje(player)` and added same guard.

After this change: all 637 tests pass (617 original + 20 new equipment-scaling tests). No regressions.

## Verification

1. `grep -n "getDigitalMP" src/abilities/piecieEffects.js` — returns function definition at line 870 and 3 call sites
2. `grep -n "QUEST_BLOCKED" src/abilities/piecieEffects.js` — returns Tikker push line and log line
3. No `rollDie` inside `effect_tikker` (verified via grep)
4. `grep -n "QUEST_BLOCKED" src/abilities/questLogic.js` — returns 4 lines (2 guards x comment + check per function)
5. `npm test`: 82 test files, 637 tests passed, 0 failures

## Deviations from Plan

**1. [Rule 3 - Blocking] equipment-scaling.test.ts not present in worktree**

- **Found during:** Task 2 start
- **Issue:** The scaffold file created by Plan 01 (`tests/effects/equipment-scaling.test.ts`) existed in the main repo but not in this worktree (worktree was branched before Plan 01 ran). The test file was absent.
- **Fix:** Created the complete test file from scratch with all real assertions (not from the scaffold stubs). File includes the 5 describe blocks as specified in the plan.
- **Files modified:** `tests/effects/equipment-scaling.test.ts` (created)
- **Commit:** cdb282e

No other deviations. All four functions replaced exactly per plan specification. All behavior matches the `<behavior>` list in the plan.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 5dff876 | feat | Rewrite Equipment effects with Digital MP scaling + fix Tikker |
| cdb282e | test | Add equipment-scaling assertions (TDD RED then GREEN via Task 3) |
| 92c01cf | feat | Add QUEST_BLOCKED guard to canAttemptGeneralQuest and canAttemptPersonalQuest |

## Known Stubs

None. All test assertions are real and passing.

## Self-Check: PASSED

- [x] `src/abilities/piecieEffects.js` contains `getDigitalMP` function at line 870
- [x] `src/abilities/piecieEffects.js` Tikker pushes `QUEST_BLOCKED` status, no `rollDie`
- [x] `src/abilities/questLogic.js` has QUEST_BLOCKED guard in both canAttempt functions
- [x] `tests/effects/equipment-scaling.test.ts` exists with 20 real assertions
- [x] Commit 5dff876 exists
- [x] Commit cdb282e exists
- [x] Commit 92c01cf exists
- [x] npm test: 82 test files, 637 tests passing, 0 failures
