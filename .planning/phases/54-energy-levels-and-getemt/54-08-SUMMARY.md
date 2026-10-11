---
phase: 54-energy-levels-and-getemt
plan: 08
subsystem: tests
tags: [levels, fixtures, guard, obby-2.0]
requires: ["54-06", "54-07"]
provides:
  - "No vitest fixture uses Level 0"
  - "tests/engine/no-level-zero.test.ts static guard over src, tests/**/*.ts, tests/helpers"
key-files:
  created:
    - tests/engine/no-level-zero.test.ts
  modified:
    - 13 tests/engine/*.test.ts fixtures
    - tests/engine/mosje-slot-factory.test.ts
    - src/main.js
    - src/ui/actionAnimations.js
    - src/ui/modalManager.js
requirements-completed: []
duration: 8min
completed: 2026-10-11
---

# Phase 54 Plan 08: Level-0 fixtures and guard Summary

All engine-test fixtures now use Level 1 (the 2.0 bottom level) and a static guard fails if Level 0 literals or `level || 0` defaults return to src or the vitest suite.

## Commits
- 227fac2 fixture codemod (13 files changed; west-calculated-guess already used Level 1 after 54-06)
- 2e4e9ba guard test plus stale src defaults

## Fixtures
Pure `level: 0` to `level: 1`. No `expect(` line changed, so no assertion values shifted. V4 Level 0 and 2.0 Level 1 are both the bottom level (54-05 made Level 1 the bottom of the loss loops), so behaviour is identical. `npx vitest run tests/engine`: 284 green.

## Deviations
- [Rule 1] The guard found 4 stale `level || 0` defaults in src (main.js:3606, actionAnimations.js:90 and :366, modalManager.js:205). Changed to `|| 1`. The first three are comparisons where the default cancels out; modalManager only displays the level of a mosje with no level set.
- The guard supports a `level0-ok` line marker. Used once: mosje-slot-factory.test.ts:33 deliberately passes `{ level: 0 }` to prove createMosjeSlot normalises it to 1.
- STATE.md and ROADMAP.md updated by hand.

## Tests
npm test: 99 files / 1007 tests green. node --check on the CLAUDE.md list clean. Playwright and sim not run (54-16 extends the guard to tests/ui).

## Known Stubs
None.

## Self-Check: PASSED
