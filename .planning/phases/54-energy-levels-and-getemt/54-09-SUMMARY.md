---
phase: 54-energy-levels-and-getemt
plan: 09
subsystem: engine
tags: [mp-loss, pipeline, obby-2.0]
requires: ["54-07"]
provides:
  - "LOSS_STEPS registry + resolveMpLoss (base -> reducers -> caps -> round 5, floor 0)"
  - "loseMP: reduced-to-0 = no loss; tracking uses the final amount"
key-files:
  created:
    - src/engine/mp/lossSteps.js
    - src/engine/mp/resolveMpLoss.js
    - src/engine/mp/lossSteps/ (7 step files)
    - tests/engine/loss-pipeline-order.test.ts
  modified:
    - src/engine/mpManager.js
    - tests/engine/mp-level-regression.test.ts
requirements-completed: []
duration: 10min
completed: 2026-10-11
---

# Phase 54 Plan 09: Loss pipeline Summary

Every MP loss now resolves through an ordered, registrable pipeline in handoff §2g order, with the Momentum Stabilizer cap applied after the reducers.

## Commit
- 5499cbc: steps, registry, resolver, loseMP rewired, tests (Tasks 1 and 2 in one commit; the loseMP-level test was seen red first, the resolver tests were red while the modules did not exist).

## Step contract for Phases 58-60
A step is `(ctx) => number`, `ctx = { state, playerId, slot, slotIndex, amount, source, placeId }`. Register with `LOSS_STEPS.reducers.push(fn)` (or `base`, `caps`). `beforeLoss` steps are `(ctx) => void` (Emergency Healings hook, empty). Final clamp `Number.isFinite ? max(0, roundToFive) : 0` means no step can heal or break the grid (T-54-20).

## Resolved: research Open Question 8
Strict §2g order followed. Behaviour change: halved + Stabilizer, 80 loss: now 80 -> 40 -> cap 30 (V4 gave cap 30 -> halved 15). This is correct under 2.0 because shields reduce first, the cap is the last limit.

## Deviations / notes
- Drain Reversal reflect now uses the raw incoming amount (previously the post-Drain-Zone/cap/Zo value). KNOWN GAP (fix in Phase 60, with the Snelle rewrite).
- Snelle interception early returns still run before the pipeline (unchanged V4 effects); the Protector flag is now consumed inside the pipeline.
- tests/engine/mp-level-regression.test.ts: tracking test names say "final amount"; added a reducer case (30 halved -> 15 tracked). Existing values unchanged since no reducers were active.
- STATE.md and ROADMAP.md updated by hand.

## Tests
npm test: 100 files / 1019 tests green. node --check (CLAUDE.md list plus new files) clean. Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
