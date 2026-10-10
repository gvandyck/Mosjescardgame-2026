---
phase: 54-energy-levels-and-getemt
plan: 01
subsystem: engine
tags: [energy, obby-2.0, turn-manager, test-helpers]
requires: []
provides:
  - "payEnergy/canPay/gainEnergy pure-ish Energy functions (src/engine/energy/)"
  - "player.energy (start 2) and player.welloePile on every player"
  - "setEnergy/getEnergy Playwright test hooks; makeEngineState vitest builder"
affects: [54-02, 54-03, 54-04, 54-05]
tech-stack:
  added: []
  patterns: ["in-place mutation on an already-cloned state (engine JSON-clone pattern)"]
key-files:
  created:
    - src/engine/energy/energyRules.js
    - src/engine/energy/canPay.js
    - src/engine/energy/payEnergy.js
    - src/engine/energy/gainEnergy.js
    - tests/engine/energy.test.ts
    - tests/helpers/makeEngineState.js
  modified:
    - src/engine/gameState.js
    - src/engine/turnManager.js
    - src/main.js
    - tests/helpers/testHelpers.js
    - tests/ui/helpers.js
    - tests/ui/cards/card-test-runner.js
key-decisions:
  - "Energy is granted in startTurn BEFORE the V4 skipNextTurn branch, so a cooldown/skipped turn still gets +1 (Core Numbers 1a)"
requirements-completed: []
duration: 10min
completed: 2026-10-11
---

# Phase 54 Plan 01: Energy Pool Summary

Energy pool (start 2, +1 per own turn, cap 6, carry-over) with safe payEnergy/canPay/gainEnergy, plus the test builder and setEnergy hook later plans need. Nothing is charged yet.

## Tasks
1. Energy rules, state fields, turn-start refill, E1 test (10 cases) - deed64a
2. makeEngineState builder, energy in createEngineState, setEnergy/getEnergy hooks, card runner seeds 6 Energy - fc9a440

## Deviations from Plan
- The E1 test was written after the implementation in the same task, not as a separate red commit (it passed on first run). No behavior impact.
- RULE-01 is deliberately not ticked (completes in 54-04).

## Verification
- node --check list clean; `npm test`: 94 files / 978 tests pass.
- Playwright card tests were not run in this plan (setEnergy only wired, no charging yet).

## Known Stubs
None. V4 6-card opening hand and summon cost untouched (Phase 55).

## Self-Check: PASSED
