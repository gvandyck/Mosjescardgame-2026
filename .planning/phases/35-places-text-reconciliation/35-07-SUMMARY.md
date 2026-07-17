---
phase: 35-places-text-reconciliation
plan: 07
subsystem: engine+data
tags: [places, drain-zone, the-void, mp, deck-builder, boosters, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-05/D-12) that this plan implements — both cards locked DESCOPED this phase"
provides:
  - "Drain Zone no longer grants an untexted +5 bonus to ALL MP gains while active"
  - "The Void's redundant quest-MP-nullify gate removed from questLogic.js (mpManager.js's own gates already fully cover blocking)"
  - "Drain Zone and The Void both unreachable from deck-building, boosters, and starter decks via a new getPlayerFacingPlaces() whitelist filter — card data/effect code untouched"
  - "A full design ruling for The Void's real mechanic, captured for a future phase (replaces the current blanket MP-block with a precise FOOD/RESTORE-MP-gain Piecie activation block; quests/abilities/other Piecies unaffected)"
affects: [35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Player-facing pool hiding: getPlayerFacingPlaces() copies the exact whitelist/blacklist-filter shape already established by getPlayerFacingDecks() — card data stays fully defined and resolvable for in-play instances; only deck-building/booster card-pool construction filters it out"

key-files:
  created:
    - src/data/playerFacingPlaces.js
    - tests/engine/place-drain-zone-cleanup.test.ts
    - tests/engine/place-the-void-cleanup.test.ts
    - tests/data/player-facing-places.test.ts
  modified:
    - src/engine/mpManager.js
    - src/abilities/questLogic.js
    - src/deck-builder.js
    - src/data/boosterEngine.js

key-decisions:
  - "Task 2's removal proceeds exactly as originally locked-planned despite a deeper design flaw surfacing during implementation (mpManager.js's blanket Void-blocks-everything gate is itself wrong per a fuller design ruling from Gandoe — see below) — safe because Task 3 (this same wave) hides The Void from every player-facing pool, so the current imperfect behavior becomes unreachable in real play regardless"
  - "Full Void ruling captured 2026-07-15 (Gandoe, live during this wave): The Void should NOT block Quests, Mosje abilities, Snelle Piecies, or quest-arming Piecies (Battle Concert, Snoeiertje-family) at all — it should ONLY block ACTIVATION (not placement) of FOOD-tagged Piecies that actually GAIN/RESTORE MP. This is a full reversal of the current mpManager.js blanket block and a narrowing of turnManager.js's current tag-only (RESTORE/FOOD, any effect) activation check. Deferred to a future phase per explicit decision, since Void is being hidden this same wave anyway — captured in `.planning/todos/pending/2026-07-15-the-void-real-implementation-ruling.md` with a starting per-card MP-direction classification table (including 2 genuinely ambiguous cards: Varkenspootjes' target-dependent gain/loss, and Momentum Boost's split immediate-MP-vs-quest-arming effect)"

requirements-completed: [PLACE-05, PLACE-12]

# Metrics
duration: ~1hr (including the Void design-ruling detour)
completed: 2026-07-15
---

# Phase 35 Plan 07: Drain Zone + The Void Dead-Code Cleanup & Hide Summary

**Both descoped cards' untexted extras are removed and both are now unreachable from deck-building/boosters — plus a full design ruling for The Void's eventual real implementation was captured live with Gandoe, replacing the current (overly broad, soon-to-be-unreachable) blanket MP-block.**

## Accomplishments
- Removed Drain Zone's untexted `+5`-to-ALL-MP-gains bonus from `mpManager.js`'s `gainMP` — its only remaining behavior is the already-correct `-10`-to-lowest-MP-Mosje drain in `placeEffects.js` (untouched).
- Removed the redundant `baseQuestMpBlocked` gate (1 declaration + 3 consumer clauses) from `questLogic.js`'s `resolveQuest` — `mpManager.js`'s own `place_the_void` gates in `gainMP`/`loseMP` already unconditionally block every quest MP change, making this a provably safe, zero-observable-change removal at the automated-test level.
- Created `src/data/playerFacingPlaces.js` (`getPlayerFacingPlaces()`), copying the exact whitelist-filter shape already established by `getPlayerFacingDecks()`. Swapped `deck-builder.js` and `boosterEngine.js`'s raw `PLACES` imports for this filtered accessor; left `turnManager.js`, `placeEffects.js`, `cardIndex.js`, `modalManager.js`, and `botDriver.js` untouched (still importing the raw, unfiltered list) so any already-in-play Drain Zone/Void instance still resolves correctly.
- **Design detour (live with Gandoe):** while verifying Task 2's "zero observable behavior change" claim, traced a real nuance — removing `baseQuestMpBlocked` lets 2 quest-arming charges (the generic `questBonusMP` mechanism behind Snoeiertje/Super Saiyan Mos/Momentum Boost/F1 Telemetry, and Battle Concert's redirect flag) get silently consumed during a Void-active quest attempt, even though the MP they'd apply is still blocked one layer deeper — previously these charges survived a Void turn untouched. Flagged this to Gandoe rather than assuming it was fine; Gandoe used the moment to give a full, clear ruling for The Void's actual intended mechanic (see key-decisions above) — a complete reversal of the current implementation. Captured as a detailed future-phase todo rather than expanding this wave's scope, since Task 3's hiding makes the current gap unreachable in practice either way.

## Files Created/Modified
- `src/engine/mpManager.js` — Drain Zone's `+5` bonus block removed from `gainMP`
- `src/abilities/questLogic.js` — `baseQuestMpBlocked` declaration + all 3 consumer clauses removed from `resolveQuest`
- `src/data/playerFacingPlaces.js` — new: `getPlayerFacingPlaces()`, blacklists `place_drain_zone`/`place_the_void`
- `src/deck-builder.js` — `PLACES` import/usage swapped for `getPlayerFacingPlaces()`
- `src/data/boosterEngine.js` — same swap
- `tests/engine/place-drain-zone-cleanup.test.ts` — new: 2 tests (exact-amount grant, parity with no-Place-active)
- `tests/engine/place-the-void-cleanup.test.ts` — new: 3 tests (source-assertion, Void-active MP-invariance, no-Place-active normal behavior)
- `tests/data/player-facing-places.test.ts` — new: 6 tests (filter correctness, raw-data-intact regression guard, engine-importer-unfiltered regression guard)
- `.planning/todos/pending/2026-07-15-the-void-real-implementation-ruling.md` — new: full design ruling + per-card classification starting point for a future phase

## Decisions Made
See `key-decisions` above. The core judgment call: proceed with the locked plan's Task 2 exactly as written (not add a narrower guard to preserve charge-survival-through-Void) because the affected behavior becomes unreachable to real players the moment Task 3 hides Void from every player-facing pool in this same wave — deferring the real fix avoids scope creep on an already-large session while losing nothing in practice.

## Deviations from Plan
None affecting the plan's locked scope — Tasks 1-3 executed exactly as written. The Void design-ruling work is *additional*, not a deviation, and was explicitly captured as out-of-scope-for-this-wave per Gandoe's own direction.

## Issues Encountered
`test:sim` briefly appeared to produce no output for an extended period — root cause was piping through `tail -20`, which buffers all output until the process exits rather than streaming incrementally, not an actual hang. No process issue; confirmed via `tasklist` that node/browser processes were alive and consistent with genuine progress. Noted for future long-running background commands to avoid the same confusion.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check` on all touched files — clean, no output
- `npm test` (full suite) — 657/657 passing (0 regressions)
- `npm run test:cards` — Ronald Kip stacking entry passes; 51 passed / 9 skipped / 2 failed (same 2 pre-existing unrelated failures as every prior wave)
- `npm run test:sim` — 152/160 passed, 8 failures (5%, pre-existing `TimeoutError` class, 0 crashes) — under the 25% target
- `grep -c "place_drain_zone" src/engine/mpManager.js` → 0
- `grep -c "baseQuestMpBlocked" src/abilities/questLogic.js` → 0
- `getPlayerFacingPlaces()` returns exactly 19 of 21 `PLACES` entries; both hidden cards remain fully defined in raw `PLACES`

## TDD Gate Compliance
All 3 tasks followed RED → GREEN: each new test file was written first and confirmed failing/partially-failing against pre-fix code (source-assertion tests genuinely RED; MP-invariance tests already passed pre-fix as expected, confirming the "provably safe" framing), then the source changes made everything pass.

## Next Phase Readiness
- PLACE-05 and PLACE-12 are fully reconciled (dead code removed, both cards hidden pending a future proper implementation); ready for 35-08 (docs update + full phase-gate verification — the final wave of Phase 35).
- New future-phase todo captured: `2026-07-15-the-void-real-implementation-ruling.md`.
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
