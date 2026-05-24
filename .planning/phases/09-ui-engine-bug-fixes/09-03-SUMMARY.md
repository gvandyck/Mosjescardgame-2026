---
phase: "09"
plan: "09-03"
subsystem: "engine/data/abilities"
tags: [bug-fix, piecie-lifecycle, persist-eot, quest-prep-bonus, dj-8020, BUG-02, BUG-05]
dependency_graph:
  requires: [09-01]
  provides: [persistUntilEndOfTurn_piecie_lifecycle, dj_questPrepBonus, endTurn_questPrepBonus_reset]
  affects:
    - src/data/piecies.js
    - src/engine/turnManager.js
    - src/abilities/mosjeAbilities.js
    - src/data/mosjes.js
    - tests/engine/piecie-persist-eot.test.ts
    - tests/cards/mosje-abilities.test.ts
tech_stack:
  added: []
  patterns: [persistUntilEndOfTurn-flag, slot-sweep-endTurn, questPrepBonus-accumulation]
key_files:
  created:
    - tests/engine/piecie-persist-eot.test.ts
  modified:
    - src/data/piecies.js
    - src/engine/turnManager.js
    - src/abilities/mosjeAbilities.js
    - src/data/mosjes.js
    - tests/cards/mosje-abilities.test.ts
decisions:
  - "Use persistUntilEndOfTurn card property (not a tag) to flag cards that stay in slot post-activation"
  - "Set persistUntilEoT on the slot object (not just a flag) to distinguish activated-but-persisting from face-down unactivated"
  - "Reset questPrepBonus to 0 in endTurn alongside the persistUntilEoT sweep — same lifecycle as BUG-02 Piecie"
  - "DJ BUG-05 uses existing questPrepBonus pattern (one-shot, consumed at quest resolution) rather than a new djQuestModifierThisTurn flag"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  files_changed: 5
---

# Phase 09 Plan 03: Dubbele Dosis Persist-EOT and DJ 80/20 Quest Modifier Summary

BUG-02 and BUG-05 fixed: Dubbele Dosis now stays in its Piecie slot until end-of-turn sweep using `persistUntilEndOfTurn: true` on the card definition, and DJ 80/20's ability now correctly adds `questPrepBonus += 2` on top of the existing +10 MP passive.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add persistUntilEndOfTurn to piecies.js; update activatePiecie + endTurn in turnManager.js | 210eb92 | src/data/piecies.js, src/engine/turnManager.js |
| 2 | Create piecie-persist-eot.test.ts for BUG-02 lifecycle | 309d72d | tests/engine/piecie-persist-eot.test.ts |
| 3 | Add questPrepBonus to DJ 80/20 ability; extend mosje-abilities test | a28c577 | src/abilities/mosjeAbilities.js, src/data/mosjes.js, tests/cards/mosje-abilities.test.ts |

## What Was Built

**BUG-02 — Dubbele Dosis persist-until-EOT lifecycle:**

- `src/data/piecies.js`: Added `persistUntilEndOfTurn: true` to `piecie_quest_prep` definition.
- `src/engine/turnManager.js` (activatePiecie): Replaced the unconditional discard block with a conditional. If `knownCardDef.persistUntilEndOfTurn === true`, the slot is marked with `persistUntilEoT = true` and `faceDown = false` instead of being discarded. The effect still fires (questPrepBonus is set). The card stays visible in the slot.
- `src/engine/turnManager.js` (endTurn): Extended the Snelle Piecie sweep loop with an `else if (slot?.persistUntilEoT === true)` branch that pushes the cardId to discard and nulls the slot. Added `state.players[playerId].questPrepBonus = 0` reset immediately after the sweep loop.
- `tests/engine/piecie-persist-eot.test.ts`: New test file with 6 tests covering the full BUG-02 lifecycle: slot not null after activation, persistUntilEoT flag set, questPrepBonus set, slot null after endTurn, card in discard after endTurn, questPrepBonus reset to 0 after endTurn.

**BUG-05 — DJ 80/20 quest dice modifier:**

- `src/abilities/mosjeAbilities.js` (ability_dj_8020_lucky_beats): Added `player.questPrepBonus = (player.questPrepBonus || 0) + 2` before the return, on top of the existing `+10 MP` passive. Updated console.log to reflect both effects.
- `src/data/mosjes.js`: Updated DJ 80/20 `abilityDescription` from "reroll one die result" to "+2 added to your next Quest dice roll this turn".
- `tests/cards/mosje-abilities.test.ts`: Added `describe("DJ 80/20 — Quest Dice Modifier (BUG-05)")` with 2 tests: questPrepBonus is set to 2, and +10 MP passive still works. Uses simplified inline JS-layer state shape (TypeScript GameState type does not include questPrepBonus).

## Test Results

- Before: 596 tests passing (80 test files)
- After: 596 tests passing (80 test files, includes 6 new BUG-02 tests + 2 new BUG-05 tests vs. the pre-worktree baseline)
- No regressions

## Deviations from Plan

None — plan executed exactly as written.

The plan's interfaces section accurately described the code locations and the exact shape of the changes required. No unexpected code structure was encountered.

## Known Stubs

None — both BUG-02 and BUG-05 are fully wired end-to-end. The Dubbele Dosis card stays in its slot after activation (visible to the UI) and is swept at endTurn. The DJ ability sets questPrepBonus which is already consumed by the quest resolution logic in main.js.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced at trust boundaries. The `persistUntilEndOfTurn` flag is a card-data-to-engine internal pattern; `questPrepBonus` modification is an engine-internal game mechanic. No threat flags.

## Self-Check: PASSED

- src/data/piecies.js contains `persistUntilEndOfTurn: true`: FOUND (line 453)
- src/engine/turnManager.js contains `persistUntilEndOfTurn` guard: FOUND (activatePiecie, line 590 area)
- src/engine/turnManager.js contains `persistUntilEoT` sweep: FOUND (endTurn, line 153)
- src/engine/turnManager.js contains `questPrepBonus = 0` reset: FOUND (line 161)
- src/abilities/mosjeAbilities.js contains `questPrepBonus` increment: FOUND (line 43)
- tests/engine/piecie-persist-eot.test.ts: FOUND (134 lines, 6 tests)
- tests/cards/mosje-abilities.test.ts: FOUND (DJ BUG-05 describe block added)
- Commit 210eb92: FOUND
- Commit 309d72d: FOUND
- Commit a28c577: FOUND
