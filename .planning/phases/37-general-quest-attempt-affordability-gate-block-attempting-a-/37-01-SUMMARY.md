---
phase: 37-general-quest-attempt-affordability-gate
plan: 01
subsystem: quest-attempt-affordability-gate
tags: [quest, mp-cost, ui-modal, bugfix, playwright]
dependency-graph:
  requires: []
  provides:
    - general-quest-single-mosje-affordability-gate
    - general-quest-affordability-spec
  affects:
    - src/main.js (general-quest attempt handler)
tech-stack:
  added: []
  patterns:
    - "Reused showMosjeSelect's existing mp>=20 disabled-picker convention (D-02/D-03) instead of building a new gate"
key-files:
  created:
    - tests/ui/general-quest-affordability.spec.js
  modified:
    - src/main.js
decisions:
  - "Collapsed the gqSlots.length>1/else branch so single-Mosje General Quests always route through showMosjeSelect (planner's D-06 discretion call, confirmed correct in execution)"
  - "Left getGeneralQuestBlockReason/canAttemptGeneralQuest (questLogic.js) untouched — an upstream mp<20 check there would wrongly block the whole quest based on the FIRST slot's MP, regressing D-04's multi-Mosje picker"
  - "Both General-Quest repro tests needed an endTurnAndWait() before the attempt — the pre-existing U2 first-turn-lock (P1 cannot General Quest on turn 1) was otherwise silently eating the click, discovered live while running the spec"
metrics:
  duration: "~55 min"
  completed: 2026-07-16
---

# Phase 37 Plan 01: General Quest Attempt Affordability Gate Summary

One-liner: Closed the Michelle Phase-36-UAT self-destruct by routing the single-Mosje General-Quest attempt through the existing `showMosjeSelect` mp>=20 disabled-picker convention — no new gate code, no charge, no defeat.

## What was built

- **`tests/ui/general-quest-affordability.spec.js`** (new, 3 Playwright tests):
  1. **Unaffordable single Mosje** (Test A) — Michelle at 10 MP, sole active Mosje,
     attempts `quest_leap_of_faith`. Proven to FAIL on pre-fix code (make-it-fail-first
     per CLAUDE.md): expected `mp === 10` / not defeated, actual `mp === 0` (MP clamped
     at the defeat floor) — the live browser repro of the Phase 36 UAT knockout.
  2. **Affordable single Mosje** (Test B) — Michelle at 40 MP; attempt proceeds, 20 MP
     is charged (`mp === 20` after `QUEST_COST`), proving the gate doesn't block a Mosje
     that can afford the fee.
  3. **Personal Quest regression** (Test C, D-05) — Michelle at 10 MP attempts
     `quest_personal_kickboxing_bootcamp`; the already-correct single-Mosje
     `showMosjeSelect` picker (main.js:2701, untouched) renders the sole Mosje disabled,
     no charge occurs. This test passed on both pre- and post-fix code — it's a
     regression guard, not a repro.

- **`src/main.js`** (~1525-1531): collapsed the `if (gqSlots.length > 1) { showMosjeSelect }
  else { showQuestPreviewThenRoll(gqSlots[0]) }` branch into a single unconditional
  `modal.showMosjeSelect(gqSlots, showQuestPreviewThenRoll, questDef)` call. Because
  `showMosjeSelect` always shows its modal regardless of Mosje count and already disables
  options with `mp < 20` for quest attempts (the existing green/red convention), the sole
  Mosje now renders as a disabled picker option when unaffordable — the player can never
  reach the `loseMP(..., 'QUEST_COST')` charge.

## How it works

Before: with exactly one active Mosje, the General-Quest attempt handler skipped the
picker entirely and called `showQuestPreviewThenRoll` directly, which deducts 20 MP
unconditionally at `main.js:1511`. A Mosje with < 20 MP was driven below 0, which is
lethal at Level 0 (`docs/phase0-rulings.md:126`) — the exact Michelle knockout from the
Phase 36 UAT.

After: the single-Mosje case is now indistinguishable from the multi-Mosje case — both
go through `showMosjeSelect`, which sets `disabled: mosjeSlot.disabled || (isQuestAttempt
&& mp < 20)` per option (`modalManager.js:748-758`, unchanged). An unaffordable sole Mosje
renders as a greyed, unselectable option (D-02's preventive disabled control), so
`showQuestPreviewThenRoll` — and its 20 MP charge — is never invoked. A Mosje at exactly
20 MP stays enabled (D-03: pays to exactly 0, survives).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - blocking issue] Added `endTurnAndWait()` before General-Quest test attempts**
- **Found during:** Task 1, first spec run — `#modal-yes` never appeared after clicking
  `#btn-general-quest`.
- **Issue:** the pre-existing U2 "first-turn quest lock" (`questLogic.js:160`) silently
  blocks the game's literal P1 from attempting a General Quest on turn 1 (no modal, just
  a log line + early return). The test's `waitForBoard` leaves the game on turn 1.
- **Fix:** call `endTurnAndWait(page)` once (advances to turn 2, where the human is P1
  again after the bot's turn) before seeding the Mosje and attempting the quest, in both
  Test A and Test B.
- **Files modified:** `tests/ui/general-quest-affordability.spec.js`
- **Commit:** `1c647b9` (folded into the Task 1 repro-spec commit, discovered during that
  task's own verification loop, before the fix in Task 2 was applied)

Task 3 (Personal-Quest regression test) was written together with Tasks 1's spec file in
a single commit rather than a separate one — all three tests were authored in the same
pass since they share the same file and helper functions; Test C required no `src/`
change and was already green pre-fix, confirming D-05 without any additional work.

### No production-code deviations

`src/abilities/questLogic.js` (`getGeneralQuestBlockReason` / `canAttemptGeneralQuest`)
is byte-for-byte unchanged — confirmed via `git diff --stat`. The 20 MP fee amount, its
lethality, the upstream `showConfirm` intent dialog, and the multi-Mosje/Personal-Quest
pickers are all untouched.

## Verification

- `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` — clean.
- `git diff --stat -- src/abilities/questLogic.js` — empty (no changes).
- `npx playwright test tests/ui/general-quest-affordability.spec.js` — 3/3 passing after the fix (was 2/3 before, Test A failing as the make-it-fail-first proof).
- `npm test` — 664/664 passing, 0 regressions.

## Threat Flags

None — no new network surface, no auth path, no schema change. The only surface touched
is the existing in-app `showMosjeSelect` modal, reused verbatim.

## Self-Check: PASSED

- FOUND: `tests/ui/general-quest-affordability.spec.js`
- FOUND: commit `1c647b9` (test(37-01): failing-first repro)
- FOUND: commit `0701c79` (fix(37-01): route single-Mosje General Quest through showMosjeSelect)
