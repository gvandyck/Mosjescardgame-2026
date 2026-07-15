---
phase: 35-places-text-reconciliation
plan: 05
subsystem: engine
tags: [places, place-effects, main-js, dice-roll, mp, tdd]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-10) that this plan implements"
provides:
  - "Skiffa grants +2 to the dice roll for any player attempting a Social-category quest, replacing the old never-built discard/-15 theme entirely"
  - "The undocumented getSkiffaRerolls (ARTISTIC-creative-Mosje reroll bonus, zero textual basis) fully removed"
  - "Tweede Kans's reroll grant, which shared the modal's skiffaRerolls parameter with the deleted getSkiffaRerolls, is preserved via its own tweedeKansReroll-only source"
affects: [35-06, 35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "main.js is not vitest-importable (browser-only entry point per CLAUDE.md) — verified its changes via source-assertion tests (fs.readFileSync + string/regex checks against src/main.js), the same established pattern already used for the stub-engine-wiring.test.ts artifact checks"

key-files:
  created:
    - tests/engine/place-skiffa.test.ts
  modified:
    - src/data/places.js
    - src/abilities/placeEffects.js
    - src/main.js

key-decisions:
  - "effect_skiffa deleted outright with no replacement dispatcher body — the new mechanic lives entirely as an inline main.js dice-bonus term, mirroring how Synergy Chamber's own dice bonus is already handled outside the placeEffects.js dispatcher"
  - "Caught and fixed a real bug during implementation: naively deleting the 'skiffaRerolls: skiffaRerolls + tweedeKansReroll' field (as a literal reading of the plan's action text might suggest) would have silently dropped Tweede Kans's reroll grant, since showDiceRoll's skiffaRerolls parameter is the ONLY reroll-count input the modal reads. Fixed by keeping the field under its existing modal-parameter name but sourcing it purely from tweedeKansReroll now that getSkiffaRerolls is gone."
  - "skiffaDiceBonus is computed once per quest-attempt (from the outer questDef.category) and reused at all 4 dice-bonus-sum combination sites, matching the plan's explicit instruction rather than recomputing per Mosje-specific previewQuestDef"

requirements-completed: [PLACE-10]

# Metrics
duration: ~45min
completed: 2026-07-15
---

# Phase 35 Plan 05: Skiffa Rework — Social-Quest Dice Bonus Summary

**Skiffa's "discard 1 OR lose 15 MP" text was never actually built as a choice (the engine always applied -15 to non-SUBSTANCE Mosjes) — replaced entirely with a flat +2 dice-roll bonus for Social-category quests, and the undocumented getSkiffaRerolls mechanic (zero textual basis) is gone.**

## Accomplishments
- Changed `place_skiffa.trigger` from `"END_PHASE"` to `"ON_QUEST"`; rewrote its description to `"Social Quests: all players get +2 to the dice roll."`
- Deleted `effect_skiffa` (the old discard/-15 body) and its `case 'place_skiffa':` dispatcher block entirely — confirmed via `grep -c "effect_skiffa"` returning 0.
- Added a `skiffaDiceBonus` term (`gameState.activePlace === 'place_skiffa' && questDef.category === 'Social' ? 2 : 0`) to the existing dice-bonus stacking sum at both quest-attempt call sites (General Quest and Personal Quest) and all 4 places that sum is combined and passed to the dice-roll UI.
- Deleted the `getSkiffaRerolls` function (zero textual basis, sitting undetected next to the old Skiffa code) and its 2 `const skiffaRerolls = getSkiffaRerolls(...)` declarations.
- Preserved the Tweede Kans reroll mechanic, which shared the modal's `skiffaRerolls` parameter name with the deleted function — re-sourced that field to `tweedeKansReroll` alone at both `showDiceRoll` call sites.

## Files Created/Modified
- `src/data/places.js` — `place_skiffa.trigger` → `"ON_QUEST"`, description rewritten
- `src/abilities/placeEffects.js` — `effect_skiffa` and its dispatcher case removed
- `src/main.js` — `skiffaDiceBonus` term added at both quest-attempt sites and all 4 dice-bonus-sum combination points; `getSkiffaRerolls` and its 2 declarations removed; `skiffaRerolls: skiffaRerolls + tweedeKansReroll` corrected to `skiffaRerolls: tweedeKansReroll` at both `showDiceRoll` call sites
- `tests/engine/place-skiffa.test.ts` — new: Task 1 behavioral tests (import-based, against `places.js`/`placeEffects.js`), Task 2 source-assertion tests (against `main.js`, since it's not vitest-importable)

## Decisions Made
- Followed the established source-assertion test pattern (`fs.readFileSync` + string/regex checks) for verifying `main.js` changes, since CLAUDE.md explicitly states the unit suite never imports `main.js` — the same pattern already used (and recently trimmed of one obsolete case) in `stub-engine-wiring.test.ts`.
- Caught my own near-miss: the plan's action text described removing the `skiffaRerolls: skiffaRerolls + tweedeKansReroll` field, which read literally would mean dropping the field entirely — but `showDiceRoll`'s `skiffaRerolls` parameter (`modalManager.js:71`) is Tweede Kans's only reroll-count input too. Verified this before finalizing and kept the field, re-sourced from `tweedeKansReroll` alone.

## Deviations from Plan
None affecting requirement scope. One test in my own first draft (`expect(mainJsSource).not.toContain("skiffaRerolls")`) was too strict given the Tweede Kans fix above — corrected to check for `getSkiffaRerolls` absence specifically, plus a positive assertion that the modal's `skiffaRerolls` field is now sourced only from `tweedeKansReroll`.

## Issues Encountered
None beyond the Tweede Kans near-miss described above, caught and fixed before any test ran green.

## User Setup Required
None — no external service configuration required. Per 35-VALIDATION.md, a live Playwright/manual check ("play a Social quest with Skiffa active, confirm the dice roll UI shows +2 applied") is recommended but was not performed this session — the source-assertion + full regression + sim suite gate (items 1-5 of the plan's own `<verification>` block) is what's covered here; flagging this explicitly per CLAUDE.md rather than claiming full UI verification.

## Verification Results
- `node --check src/data/places.js src/abilities/placeEffects.js src/main.js` (+ core UI files) — clean, no output
- `npm test -- tests/engine/place-skiffa.test.ts` — 5/5 passing
- `npm test` (full suite) — 640/640 passing (0 regressions)
- `npm run test:cards` (solo) — Ronald Kip stacking entry passes; 51 passed / 9 skipped / 2 failed (same 2 pre-existing unrelated failures as every prior wave)
- `npm run test:sim` (solo) — 155/160 passed, 5 failures (3.1%, all `TimeoutError`s from `playAutoTurn`, the same pre-existing UI-timeout class documented since wave 1) — 0 crashes, well under the 25% timeout-rate target

## TDD Gate Compliance
Both tasks followed RED → GREEN: `place-skiffa.test.ts` was written first (4 of the eventual 5 test cases existed at that point) and confirmed 3/4 failing against pre-fix code, then the source changes made them pass; a 5th test (Tweede Kans preservation check) was added after discovering and fixing the near-miss described above.

## Next Phase Readiness
- PLACE-10 is fully reconciled; ready for 35-06 (PLACE-11 — Synergy Chamber, which has a `checkpoint:human-verify` gate).
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
