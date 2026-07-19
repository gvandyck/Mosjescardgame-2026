---
phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
plan: 02
subsystem: cards
tags: [piecies, boosters, quest-bonus, draw, mosje-tags, uat-gap-closure]
requires:
  - phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
    provides: the four booster-only thematic Piecies (Loaded Dice, Boosterpackkie, Perfect Rhythm, Dikke Plaat) from 46-01
provides:
  - Boosterpackkie's 5-6 bonus draw gated behind a COERT-family Mosje (matches the existing +10 MP gate)
  - Perfect Rhythm's later-Piecie draw made repeating (every activation this turn, not one-shot)
  - Dikke Plaat's +2 bonus extended to exact mosje_alyssa_fissa, named on card text
affects: [booster-pool, piecie-activation, card-reference]
tech-stack:
  added: []
  patterns: [exact-cardId exception mirrors the existing mosje_chris_ddr pattern, turn-persistent activation flag instead of one-shot consumption]

key-files:
  created: []
  modified:
    - src/abilities/piecieEffects.js
    - src/engine/turnManager.js
    - src/data/piecies.js
    - tests/effects/thematic-piecies.test.ts
    - docs/card-reference.md

key-decisions:
  - "Boosterpackkie: hasCoert is now computed before the roll block so the bonus-draw condition can gate on it; the +10 MP kicker line is otherwise untouched."
  - "Perfect Rhythm: removed only the flag-clearing line inside the consumption block; the no-self-trigger guard and the end-of-turn clear at turnManager.js are both preserved verbatim."
  - "Dikke Plaat: mirrors the existing exact-cardId kicker pattern (mosje_chris_ddr in effect_perfect_rhythm) for mosje_alyssa_fissa, using the same active/non-defeated slot check shape."

patterns-established:
  - "UAT-driven design changes get gated conditions moved above their consumption point rather than duplicated, keeping the kicker and gate logic reading the same boolean."

requirements-completed: [THEME-02, THEME-03, THEME-04, THEME-05]

duration: 35 min
completed: 2026-07-19
---

# Phase 46 Plan 02: Thematic Piecie UAT Gap Closure Summary

**Closed 3 UAT design-change gaps: Boosterpackkie's bonus draw now requires COERT, Perfect Rhythm now draws on every later Piecie activation, and Dikke Plaat's DJ bonus now also matches exact Alyssa Fissa Fissa.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-19T20:35:00Z
- **Completed:** 2026-07-19T21:10:00Z
- **Tasks:** 3
- **Files modified:** 5 (piecieEffects.js, turnManager.js, piecies.js, thematic-piecies.test.ts, card-reference.md)

## Accomplishments

- **Boosterpackkie** (gap 1): the 5-6 bonus draw now requires `hasActiveMosjeTag(player, 'COERT')` — without a COERT Mosje on field, Boosterpackkie always draws exactly 1 card regardless of the die roll. The `hasCoert` lookup was hoisted above the roll block so both the bonus draw and the +10 MP kicker share the same gate; the kicker itself is byte-for-byte unchanged.
- **Perfect Rhythm** (gap 2): removed the single line in `turnManager.js` that cleared `perfectRhythmDrawNextPiecie` after the first later Piecie activation drew a card. The flag now persists for the rest of the turn, so every subsequent later Piecie activation also draws 1. The no-self-trigger guard (`slotCardId !== 'piecie_perfect_rhythm'`) and the end-of-turn clear are both untouched.
- **Dikke Plaat** (gap 3): `effect_dikke_plaat`'s +2 condition now also matches an active, non-defeated slot with `cardId === 'mosje_alyssa_fissa'`, mirroring the exact-id kicker pattern already used for `mosje_chris_ddr` in `effect_perfect_rhythm`. Alyssa Bulldozer (`mosje_alyssa_bulldozer`) does not qualify. The exception is named on the card's own description text and in `docs/card-reference.md`, per the user's explicit "don't hide it" instruction.
- All three `piecies.js` descriptions and the corresponding `docs/card-reference.md` rows were rewritten to describe the new designs; a new thematic note records the Alyssa Fissa/DJ pairing.
- `tests/ui/cards/card-registry.js` needed no changes — its default (no-COERT, no-Fissa) setups already produce the correct new-design outcomes (Boosterpackkie handDelta 1, Perfect Rhythm/Dikke Plaat field-effect flags unchanged).

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate Boosterpackkie's 5-6 bonus draw behind a COERT Mosje** - `8cfa9da` (fix)
2. **Task 2: Make Perfect Rhythm's draw repeat on every later Piecie activation** - `545c4ad` (feat)
3. **Task 3: Dikke Plaat — Alyssa Fissa Fissa counts as a DJ** - `78239fe` (feat)

**Plan metadata:** SUMMARY commit (this file), committed separately per `commit_docs=false` config.

## Files Created/Modified

- `src/abilities/piecieEffects.js` - `effect_boosterpackkie` gates the bonus draw on COERT; `effect_dikke_plaat` adds the exact `mosje_alyssa_fissa` exception
- `src/engine/turnManager.js` - Perfect Rhythm's later-activation draw hook no longer clears its flag on consumption
- `src/data/piecies.js` - updated descriptions for all three reworked cards
- `tests/effects/thematic-piecies.test.ts` - Vitest coverage for all three new designs (23 tests total, up from 20)
- `docs/card-reference.md` - updated the three card rows and added the Alyssa Fissa/Dikke Plaat thematic note

## Decisions Made

- Kept the `hasCoert`/kicker split exactly as the plan's interface spec prescribed (only `hasCoert` moves above the roll; `applyMPGain` stays where it was) to minimize the diff and keep the MP-kicker code path untouched.
- Left `tests/ui/cards/card-registry.js` unedited after confirming its existing default setups (no COERT Mosje, no Alyssa Fissa) still produce the correct new-design assertions — no comment referenced the old wording either.

## Deviations from Plan

None — plan executed exactly as written. All three tasks matched their `<action>` blocks precisely; no Rule 1-4 auto-fixes were needed.

## Issues Encountered

`git add -p` hunk boundaries did not align 1:1 with task boundaries in three shared files (`piecieEffects.js`, `piecies.js`, `docs/card-reference.md`, `thematic-piecies.test.ts`) since the Boosterpackkie/Dikke Plaat/Perfect Rhythm edits sit close together in each file. Resolved by splitting hunks (`s` in interactive add) and verifying each task's staged diff with `git diff --cached` before each task commit — final per-task commits are scoped correctly (verified via `git diff --cached` review, not merely trusted).

## User Setup Required

None - no external service configuration required.

## Verification

- `node --check` on `src/abilities/piecieEffects.js`, `src/engine/turnManager.js`, `src/data/piecies.js`: clean, no output.
- `npx vitest run tests/effects/thematic-piecies.test.ts`: **23/23 passed** (20 baseline + 3 new: no-COERT-no-bonus-draw, Alyssa Fissa +2, Alyssa Bulldozer stays +1).
- `npm test` (full unit suite): **701/701 passed**, 72 test files, 0 regressions (baseline from 46-01 was 698/698; +3 net new from this plan).
- Focused browser card tests (Playwright, `--project=cards`, real engine) for all 4 Phase 46 cards, filtered via `-g`: **4/4 passed** — `piecie_boosterpackkie` (DRAW, handDelta 1 confirmed with the registry's default no-COERT setup), `piecie_loaded_dice`, `piecie_dikke_plaat`, `piecie_perfect_rhythm` (all FIELD_EFFECT flags confirmed unchanged).
- Ronald Kip +50 MP stacking check (browser card test, precautionary since these changes touch `applyMPGain` call sites indirectly): **1/1 passed**, `ownΔ=50`.
- Full `npm run test:sim` was **not** run. Per the plan's `<verification>` reasoning: none of the three changes touch MP math, MP costs, level thresholds, or Quest-completion logic — Boosterpackkie/Perfect Rhythm are draw-gating changes and Dikke Plaat's change only widens an existing quest-roll-bonus condition, with all `applyMPGain`/`questPrepBonus` call sites and their values left untouched. This reasoning held throughout execution — no MP amount or level logic ended up changed, so the escalation-to-full-simulation trigger in the plan was never hit.

## Next Phase Readiness

Phase 46 (Thematic Piecie Cards) is now fully complete across both plans — all 6 original UAT tests pass (3 clean from 46-01, 3 gap-closed by this plan). No blockers for future phases. `.planning/todos/pending/` items remain the queue for subsequent work.

---
*Phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load*
*Completed: 2026-07-19*
