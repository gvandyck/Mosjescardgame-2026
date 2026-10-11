---
phase: 54-energy-levels-and-getemt
plan: 07
subsystem: engine
tags: [levels, gain, normaliser, getPower, obby-2.0]
requires: ["54-05"]
provides:
  - "applyGainToSlot: any gain reaching 100 raises one Level and resets MP to 0; L3 capped at 95"
  - "getPower (level-row Power + boosts, multiple of 10, >= 0), roundToTen, normalizeSlotMp"
  - "gainMP/checkLevelUp thin wrappers; allowLevelUp deleted; checkVictory runs normalizeMosjeMp"
affects: [54-08, 54-09, 54-12, 54-13, 54-14, 54-15]
key-files:
  created:
    - src/engine/mp/applyGainToSlot.js
    - src/engine/mp/normalizeSlotMp.js
    - src/engine/mp/getPower.js
    - src/engine/mp/roundToTen.js
    - tests/engine/level-up.test.ts
    - tests/engine/get-power.test.ts
    - tests/engine/mp-grid-invariants.test.ts
  modified:
    - src/engine/mpManager.js
    - src/engine/victoryChecker.js
    - src/engine/turnManager.js
    - src/abilities/questLogic.js
    - src/abilities/mosjeAbilities.js
  deleted:
    - tests/engine/mp-cap.test.ts
key-decisions:
  - "Level-up stamps slot.levelledUpTurn (R2 marker for Phase 55/56)"
requirements-completed: []
duration: 20min
completed: 2026-10-11
---

# Phase 54 Plan 07: 2.0 gain pipeline Summary

Every gain through gainMP now follows the 2.0 rule: 100+ MP raises one Level and resets MP to 0 (no carry-over), Level 3 caps at 95, and the V4 non-levelling mode (`allowLevelUp`) is gone.

## Commits
- 3074fb5 gain functions, wrappers, normaliser, tests (Tasks 1 and 2 in one commit; the tests were red first, then green)

## Notes
- Tests written first and seen red (module missing, then wrapper cases failing on V4 carry-over/100 cap).
- checkVictory's safety net is now `normalizeMosjeMp` (levels >= 100, caps L3 at 95, snaps to the 5-grid, floors at 0). The V4 instant win at Level 3 stays until 54-12.
- The turn trickle (+10 per turn) can now level a Mosje; keeping or removing the trickle is Phase 55's call.
- Quest `successMP` in questLogic.js (line ~132, 138) and a few other direct `mp +=` writes are still unfunnelled; the normaliser backstops them until 54-13..54-15.

## Tests
- Deleted: tests/engine/mp-cap.test.ts (V4 100-cap/no-level rule; replaced by level-up.test.ts).
- Rewritten: instant-win-level3 overshoot (L2 at 90 + 80 -> L3 at 0, not 70).
- Fixture fallout updated to the 2.0 rule: ability-text-reconciliation (FPS Coert opponent sentinel 100 -> 90; Chris DDR 50+25+25 now levels to L2/0), quest-behaviors (opponent sentinel 100 -> 90), gandoe-michelle-synergy (95+10 now L2/0; Michelle level-up case 70 -> 65, overshoot is dropped and later bonus gains apply after the level-up).
- npm test: 98 files / 1005 tests green. node --check (CLAUDE.md list plus touched files) clean. Playwright and sim not run.

## Deviations
- [Rule 1] Fixtures that used 100 MP as an "unchanged" sentinel were invalid under 2.0 (100 normalises to a level-up); moved to 90.
- Comment-only edit in tests/ui/cards/card-chains.spec.js (stale `clampMosjeMp` name).
- `state.advance-plan` not used; STATE.md and ROADMAP.md edited by hand.

## Known Stubs
None.

## Self-Check: PASSED
