---
phase: 35-places-text-reconciliation
plan: 04
subsystem: engine
tags: [places, place-effects, turn-manager, mp, dead-code, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-08/D-09) that this plan implements"
provides:
  - "Coert's Caravan fires through the real END_PHASE dispatch path (was dead code — same TURN_START trigger-string bug as Bank Chilling); all Mosjes lose 10 MP at end of turn, Coert-family Mosjes immune"
  - "The orphaned freePiecieActivationAvailable consumer removed from activatePiecie (its only writer no longer exists)"
  - "Digital Gaming Stop grants +10 MP to the questing Mosje when a DIGITAL-EQUIPMENT Piecie is active on that player's field, replacing the dead questAutoSuccess flag"
  - "Dispatcher-level regression tests (place-coerts-caravan.test.ts, place-digital-gaming-stop.test.ts) closing the Wave-0 test gap for both cards"
affects: [35-05, 35-06, 35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pre-clone slot-index resolution: when a dispatcher passes a live object reference (e.g. `mosje`) alongside the state it was read from, resolve its index via `activeSlots.indexOf(mosje)` BEFORE calling cloneState — mutating the passed reference after cloning silently loses the change, since cloneState (JSON round-trip) produces a disconnected object graph"

key-files:
  created:
    - tests/engine/place-coerts-caravan.test.ts
    - tests/engine/place-digital-gaming-stop.test.ts
  modified:
    - src/data/places.js
    - src/abilities/placeEffects.js
    - src/engine/turnManager.js

key-decisions:
  - "Coert's Caravan replaced entirely (not trigger-fixed-in-place) per the locked ruling — old '+15 Coert MP' bonus never fired in live play (dead TURN_START trigger), so there was no working old behavior being changed from a player's perspective"
  - "Digital Gaming Stop's effect function gained a 4th playerId parameter; the dispatcher call site in resolvePlaceEffect's switch statement was updated in the same commit to avoid a silent undefined-argument regression (RESEARCH.md Pitfall 4)"
  - "Caught and fixed a self-introduced clone-graph bug during implementation: the plan's suggested body mutated the passed-in `mosje` reference directly, but that reference points into the pre-clone state — cloneState's JSON round-trip disconnects it from the returned state, so the MP gain would have been silently lost. Fixed by resolving the slot index via indexOf() before cloning, then mutating the cloned copy at that index."

requirements-completed: [PLACE-08, PLACE-09]

# Metrics
duration: ~50min
completed: 2026-07-15
---

# Phase 35 Plan 04: Coert's Caravan Replacement + Digital Gaming Stop Rework Summary

**Coert's Caravan had the same dead TURN_START trigger bug as Bank Chilling (never fired in live play) and is replaced entirely with an end-of-turn drain; Digital Gaming Stop's dead auto-succeed flag is replaced with its real "+10 MP for an active DIGITAL-EQUIPMENT Piecie" text.**

## Accomplishments
- Fixed Coert's Caravan's dead-dispatch bug: `trigger: "TURN_START"` (never matched any real dispatch call) corrected to `"END_PHASE"`.
- Replaced `effect_coerts_caravan` entirely: old dead "+15 MP + free Piecie activation for Coert Mosjes" logic removed; new behavior drains 10 MP from every active Mosje at end of turn, skipping any Mosje whose id contains "coert" (all 4 live Coert-family ids confirmed: `mosje_coert_tech`, `mosje_fps_coert`, `mosje_coert_kasteluck`, `mosje_coert_kastelein`).
- Removed the orphaned `freePiecieActivationAvailable` consumer block from `activatePiecie` in `turnManager.js` — its only writer was deleted along with the old Caravan logic, leaving only the `startTurn` reset occurrence.
- Reworked `effect_digital_gaming_stop`: dropped the dead `questAutoSuccess` flag (zero consumers anywhere in `src/`) entirely; new body checks the questing player's `piecieSlots` for an activated DIGITAL-EQUIPMENT Piecie (`piecie_keyboard`/`piecie_mouse`/`piecie_controller`) and grants +10 MP to the questing Mosje if found.
- Updated the `resolvePlaceEffect` dispatcher's `case 'place_digital_gaming_stop':` call site to pass the new 4th `playerId` argument in the same change.
- Added 2 new dispatcher-level regression test files (6 tests total).

## Files Created/Modified
- `src/data/places.js` — `place_coerts_caravan.trigger` → `"END_PHASE"`, description rewritten; `place_digital_gaming_stop.description` rewritten to drop the auto-succeed sentence
- `src/abilities/placeEffects.js` — `effect_coerts_caravan` replaced entirely; `effect_digital_gaming_stop` reworked with new `playerId` parameter and pre-clone slot-index resolution; dispatcher call site updated
- `src/engine/turnManager.js` — orphaned `freePiecieActivationAvailable` consumer block removed from `activatePiecie`
- `tests/engine/place-coerts-caravan.test.ts` — new: both-Mosjes-drained-10, Coert-immunity, dispatcher-proof (`_lastPlaceEffect.placeId`)
- `tests/engine/place-digital-gaming-stop.test.ts` — new: active-Piecie-grants-+10, inactive-Piecie-grants-nothing, `questAutoSuccess` string no longer present in the function body

## Decisions Made
- Kept the plan's exact replacement shape for Coert's Caravan (loop all active slots, skip Coert-family via `id.includes('coert')`, `applyDamage(mosje, 10)` for everyone else) — mirrors the established `effect_the_void` loop-shape precedent.
- Fixed a bug in my own first-draft implementation of `effect_digital_gaming_stop`: the plan's interface text said to mutate the passed `mosje` parameter directly, but `mosje` is a reference into the state *before* `cloneState`'s JSON round-trip, so a direct mutation after cloning would not appear in the returned (cloned) state — a real, silent MP-not-actually-applied bug. Resolved by capturing `preClonePlayer.activeSlots.indexOf(mosje)` before cloning, then mutating `state.players[playerId].activeSlots[slotIndex]` in the clone.

## Deviations from Plan
None affecting scope. The clone-graph fix above was a self-caught correctness issue during implementation (not a plan error — the plan's illustrative code was directionally correct but glossed over the clone-identity subtlety), resolved before any test ran green.

### Issues Encountered
- Ran `npm run test:cards` and `npm run test:sim` concurrently during first-pass verification — the same "not parallel-safe" mistake flagged in 35-01's Issues Encountered. The concurrent `test:cards` run showed a 3rd failure (`chain: Ming Natural Lucky Draw`, unrelated to any file this plan touches) beyond the 2 known pre-existing failures. `test:sim` came back clean (6/6, 0 crashes) from the concurrent run. A clean solo re-run of `test:cards` afterward confirmed exactly the same 2 pre-existing failures as every prior wave (51 passed / 9 skipped / 2 failed) — the 3rd failure was concurrency-induced flakiness, not a regression.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check src/data/places.js src/abilities/placeEffects.js src/engine/turnManager.js` (+ core UI files) — clean, no output
- `npm test -- tests/engine/place-coerts-caravan.test.ts tests/engine/place-digital-gaming-stop.test.ts` — 6/6 passing
- `npm test` (full suite) — 635/635 passing (0 regressions)
- `npm run test:cards` (solo, clean re-run) — Ronald Kip stacking entry passes; 51 passed / 9 skipped / 2 failed (same 2 pre-existing unrelated failures as every prior wave)
- `npm run test:sim` — 6/6 spec files passed, 0 crashes
- `grep -c "freePiecieActivationAvailable" src/engine/turnManager.js` — reduced to the single `startTurn` reset occurrence (plus 1 unrelated comment mention), confirming the orphaned consumer is gone

## TDD Gate Compliance
Both tasks followed the mandatory RED → GREEN sequence: `place-coerts-caravan.test.ts` (3 tests) and `place-digital-gaming-stop.test.ts` (3 tests) were written first and confirmed failing against pre-fix code, then the source changes made them pass.

## Next Phase Readiness
- PLACE-08 and PLACE-09 are fully reconciled; ready for 35-05 (PLACE-10 — Skiffa rework).
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
