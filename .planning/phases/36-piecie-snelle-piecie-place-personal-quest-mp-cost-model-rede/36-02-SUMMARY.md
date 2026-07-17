---
phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
plan: "02"
subsystem: ui
tags: [piecies, welloe-force, tribute-payer, modal, tdd]

# Dependency graph
requires: ["36-01"]
provides:
  - "showTributePayerSelect in src/ui/modalManager.js — reusable parameterized tribute-payer picker"
  - "effect_welloe_force reads state._pendingTargets.welloeForcePayerSlot (piecieEffects.js)"
  - "main.js effect_welloe_force pre-activation branch: affordability gate + payer picker wiring"
  - "tests/abilities/welloe-force-tribute.test.ts — engine unit coverage"
  - "tests/ui/welloe-force-tribute.spec.js — browser-driven affordable + blocked path coverage"
affects:
  - "Plan 36-04 (docs + full phase-gate verification) depends on this plan's Welloe Force rework being final"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generic showOptionSelect-backed tribute-payer picker, mirroring showMosjeSelect's affordability-colored metaLabel idiom"
    - "Pre-activation await-modal-then-clone-_pendingTargets idiom (existing kannetje_melk/dikke_jonko/tikker pattern), reused for a new effectId branch"

key-files:
  created:
    - tests/abilities/welloe-force-tribute.test.ts
    - tests/ui/welloe-force-tribute.spec.js
  modified:
    - src/ui/modalManager.js
    - src/abilities/piecieEffects.js
    - src/main.js

key-decisions:
  - "showTributePayerSelect delegates to the existing showOptionSelect primitive (allowCancel:false per D-06) rather than building a bespoke modal — reuses green/red MP-affordability coloring already proven by showMosjeSelect"
  - "Affordability is checked TWICE by design: main.js's eligible filter (blocks activation with zero eligible payers, before the picker even opens) AND the picker's own disabled option list (defense in depth per the threat register's T-36-02 mitigation) — not redundant, since main.js's gate is the actual activation blocker and the picker's disabled state is what a player sees if somehow reached with a mixed-affordability board"
  - "The existing post-hoc redirect-target branch (_welloeForceActive?.targetSlotId === null) was deliberately left untouched — different concern (target resolution after activation, not payer selection before it)"

requirements-completed: [COST-05, COST-06]

# Metrics
duration: ~35min
completed: 2026-07-16
---

# Phase 36 Plan 02: Welloe Force Tribute-Payer Rework Summary

Reworked the one confirmed self-paying card (`piecie_welloe_force`) to close its two real,
zero-test-coverage bugs: it hardcoded the first active slot as tribute payer (violating D-05 —
player must choose) and never checked affordability before charging (violating D-06 — the action
must be blocked entirely, not partially paid, if the chosen payer can't afford it). Built one new
reusable UI primitive (`showTributePayerSelect`, generalizing `showMosjeSelect`) and wired it into
Welloe Force's pre-activation flow in `main.js`, with both the "can afford" and "blocked" paths
now proven live in a real Playwright browser session.

## Accomplishments

- **Task 1 (modalManager.js):** Added `showTributePayerSelect({ title, prompt, mosjeSlots, amount })`
  — maps `mosjeSlots` to green (`#4ade80`, affordable) / red (`#ef4444`, unaffordable) MP-colored
  options via `showOptionSelect`, `disabled: true` whenever `mp < amount`. Registered in both the
  real returned object literal and the no-container fallback (matching the existing
  `showOptionSelect`/`showMosjeSelect` fallback pattern).
- **Task 2 (engine, TDD RED→GREEN):** Wrote `tests/abilities/welloe-force-tribute.test.ts` (3
  tests) FIRST; confirmed RED (2 of 3 failed against the old hardcoded-first-slot
  `effect_welloe_force`, since it had no `_pendingTargets` awareness at all). Reworked
  `effect_welloe_force` to read `state._pendingTargets?.welloeForcePayerSlot` instead of calling
  `getFirstActiveSlotIndex`, with a guard making it a safe no-op (no charge, no
  `_welloeForceActive`) when the slot is missing, `null`, or defeated. Confirmed GREEN: all 3 new
  tests pass, `node --check` clean, full `npm test` suite green (664/664, up from 661 baseline —
  +3 new).
- **Task 3 (main.js wiring + browser spec):** Added a dedicated `effect_welloe_force` branch in
  `handleActivatePiecie`, alongside (not merged into) the existing
  `effect_kannetje_melk`/`effect_dikke_jonko`/`effect_tikker` branch. Builds a local
  `{slotIndex, name, mp}` array (Perfect Sync idiom, not `getPlayerMosjes()`'s mismatched field
  names), filters to `eligible` payers (`mp >= 40`), shows a "Cannot Activate" info dialog and
  returns (no charge, no activation) when zero are eligible, otherwise opens
  `showTributePayerSelect` and stashes the chosen slot into a cloned state's
  `_pendingTargets.welloeForcePayerSlot` before falling through to the existing `activatePiecie`
  call. The existing post-hoc redirect-target branch is completely untouched (diff-reviewed: no
  lines removed from `main.js`, purely additive). Wrote
  `tests/ui/welloe-force-tribute.spec.js` (2 Playwright tests): the affordable-payer path
  (picker shows both Mosjes, low-MP one disabled, chosen payer's MP drops by exactly 40,
  `_welloeForceActive` set) and the blocked path (single sub-40-MP Mosje, picker never opens,
  "Cannot Activate" dialog shown, MP unchanged, card stays un-activated on field). Both pass.

## Files Created/Modified

- `src/ui/modalManager.js` — new `showTributePayerSelect` function + real-object registration +
  fallback entry
- `src/abilities/piecieEffects.js` — `effect_welloe_force` reworked to read
  `_pendingTargets.welloeForcePayerSlot` with a null/defeated-slot guard
- `src/main.js` — new `effect_welloe_force` pre-activation branch in `handleActivatePiecie`
  (affordability filter, blocked-path info dialog, payer picker, `_pendingTargets` stash)
- `tests/abilities/welloe-force-tribute.test.ts` — new engine unit test (3 assertions)
- `tests/ui/welloe-force-tribute.spec.js` — new Playwright spec (2 tests: afford + blocked)

## Decisions Made

- `showTributePayerSelect` reuses `showOptionSelect` rather than a bespoke modal — same
  green/red MP-affordability coloring idiom already proven by `showMosjeSelect`, per the
  project's "build once, reuse" UI rule.
- Affordability is checked in two places intentionally: `main.js`'s `eligible` filter is the real
  activation gate (blocks the action entirely with zero eligible payers, before the picker ever
  renders); the picker's own `disabled` list is what a player sees on a mixed-affordability board
  when at least one payer qualifies. Both trace back to the same `T-36-02` mitigation in the
  threat register — `applyDamage`'s defeat-at-0 combat path can never fire from a tribute payment.
- The pre-existing post-hoc redirect-target branch (`_welloeForceActive?.targetSlotId === null`)
  was left completely untouched — it resolves the *damage-redirect target* after activation, a
  different concern from the payer picker this plan adds *before* activation.

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed per their acceptance criteria.

One minor test-writing discovery, not a deviation from the plan's design: the Playwright spec's
affordable-payer scenario also has to resolve the pre-existing redirect-target picker (since
`activatePiecie` fires that post-hoc branch immediately once Welloe Force actually activates), and
needed `clearEntryProtection()` called on the freshly-seeded opponent Mosjes so they weren't
excluded from that untouched branch's target list by U8 entry protection. This is test-harness
setup, not a code change to the untouched branch itself.

## Issues Encountered

None beyond the entry-protection test-setup discovery documented above.

## User Setup Required

None.

## Verification Results

- `node --check src/ui/modalManager.js src/abilities/piecieEffects.js src/main.js` — no output,
  clean on all 3 files.
- `npx vitest run tests/abilities/welloe-force-tribute.test.ts` — 3/3 passing.
- `npm test` — 664/664 passing (661 baseline + 3 new), 0 failures, 0 regressions.
- `npx playwright test tests/ui/welloe-force-tribute.spec.js` — 2/2 passing (affordable path +
  blocked path).
- `grep -c showTributePayerSelect src/ui/modalManager.js` → 3 (fallback entry, function
  definition, real-object registration — plan's "2" acceptance criterion counted only
  fallback+registration; the function definition itself is the expected third occurrence).
- Source assertion: `effect_welloe_force` no longer calls `getFirstActiveSlotIndex` anywhere in
  its body (confirmed via `awk` scoped extraction — 0 matches).
- `git diff src/main.js` reviewed: 0 removed lines — purely additive, confirming the existing
  redirect-target branch was not edited.

## TDD Gate Compliance

RED → GREEN followed correctly for Task 2:
- RED commit: `test(36-02): add failing test for Welloe Force tribute payer choice` (`fbb5c36`) —
  confirmed 2 of 3 assertions failed against the old hardcoded-first-slot implementation before
  this commit.
- GREEN commit: `feat(36-02): rework effect_welloe_force to read player-chosen payer slot`
  (`ec13770`) — confirmed all 3 assertions pass after this commit.
- No REFACTOR commit needed (no cleanup required beyond the direct rework).

## Next Phase Readiness

Plan 36-02 is complete. Welloe Force — the sole tribute-charging card in the entire 46-card pool
(confirmed by 36-01's audit) — now has a correct, player-choice-driven, affordability-gated
tribute mechanism with both engine-level and full-browser regression coverage. This closes
36-RESEARCH.md's Critical Finding 4.

- **Plan 36-03** (`checkpoint:decision` — Delluft/Dierenasiel text fate, COST-04) is independent
  of this plan's work and can proceed in parallel or after, as already noted in 36-01's handoff.
- **Plan 36-04** (docs + full phase-gate verification, including the Ronald Kip stacking test +
  `test:sim`) can now include Welloe Force's real tribute mechanism in its full-suite pass, since
  this plan is the first to give `mpCost` charging actual runtime behavior in the engine.

No blockers. No deferred items introduced by this plan.

---
*Phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede*
*Completed: 2026-07-16*

## Self-Check: PASSED

- FOUND: src/ui/modalManager.js
- FOUND: src/abilities/piecieEffects.js
- FOUND: src/main.js
- FOUND: tests/abilities/welloe-force-tribute.test.ts
- FOUND: tests/ui/welloe-force-tribute.spec.js
- FOUND: e3e2993 (feat: showTributePayerSelect)
- FOUND: fbb5c36 (test: RED)
- FOUND: ec13770 (feat: GREEN)
- FOUND: 36467b5 (feat: main.js wiring + browser spec)
