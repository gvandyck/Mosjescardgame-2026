---
phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
plan: "01"
subsystem: data
tags: [piecies, snelle-piecies, mp-cost, tdd, audit]

# Dependency graph
requires: []
provides:
  - ".planning/audits/2026-07-16-piecie-snelle-cost-audit.md — full ruling table for all 46 nonzero-mpCost Piecies/Snelle Piecies + Personal Quest closure + reverse-direction check"
  - "src/data/piecies.js and src/data/snellePiecies.js with mpCost corrected to match each card's printed text"
  - "tests/data/mp-cost-tribute-audit.test.ts — durable regression guard (exactly 1 nonzero-mpCost card allowed)"
affects:
  - "Plan 36-02 (Welloe Force rework + tribute-payer picker) depends on this plan's finished ruling table"
  - "Plan 36-03 (Delluft/Dierenasiel checkpoint:decision) depends on this plan's Piecie ruling being final"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Text-wins audit ruling table (same format as 2026-07-14-places-text-audit.md), reused for a second card-type audit"

key-files:
  created:
    - .planning/audits/2026-07-16-piecie-snelle-cost-audit.md
    - tests/data/mp-cost-tribute-audit.test.ts
  modified:
    - src/data/piecies.js
    - src/data/snellePiecies.js

key-decisions:
  - "snelle_blensen ruled mpCost:0 (not kept nonzero) — its 'Free if countering a Frenssen' text implies but never states a self-paid cost; flagged explicitly for Gandoe to override if original intent was a real conditional cost"
  - "piecie_welloe_force is the sole exception, keeping mpCost:40 — the only card in the entire 46-card pool with explicit first-person self-payment language ('Pay 40 MP...')"
  - "Personal Quest audit (COST-03) closed as a documentation-only no-op — zero cost/pay/tribute language found across all 6 Personal Quests' description and requirementDescription fields"
  - "Delluft/Dierenasiel's own card-text decision is explicitly NOT resolved by this plan — deferred to Plan 36-03's checkpoint:decision, now unblocked since this plan confirms all 7 referenced SUBSTANCE/PET Piecies rule to mpCost:0"

requirements-completed: [COST-01, COST-02, COST-03, COST-07, COST-08]

# Metrics
duration: ~40min
completed: 2026-07-16
---

# Phase 36 Plan 01: Piecie/Snelle Piecie mpCost Audit + Data Correction Summary

Full text audit of all 46 currently-nonzero-`mpCost` Piecies (36) and Snelle Piecies (10),
ruled against the project's "text wins" convention (D-01/D-02): 45 of 46 correct to `mpCost: 0`
(no first-person self-payment language in their printed description), and
`piecie_welloe_force` ("Pay 40 MP...") is confirmed as the sole card that keeps a nonzero cost.
Personal Quest audit closed as a no-op (zero tribute language found across all 6). A TDD
regression test now guards against future drift back to a large uncharged-cost surface.

## Accomplishments

- **Task 1 (audit ruling doc):** Created `.planning/audits/2026-07-16-piecie-snelle-cost-audit.md`
  following the 2026-07-14 Places audit's exact structure. Ruled all 36 nonzero Piecies + all 10
  nonzero Snelle Piecies, gave `piecie_welloe_force` its keep-40 rationale, gave `snelle_blensen`
  its own explicit judgment-call rationale (ruled 0, flagged for Gandoe), closed the Personal
  Quest audit (6 quests, zero tribute language found via grep + direct read), ran a
  reverse-direction spot-check (5 zero-cost Piecies + 5 zero-cost Snelle Piecies, no unstated
  costs found), and left a closing note pointing Delluft/Dierenasiel's text decision to Plan
  36-03.
- **Task 2 (TDD RED):** Created `tests/data/mp-cost-tribute-audit.test.ts` with 4 assertions
  (every Piecie except Welloe Force is 0; Welloe Force is 40; every Snelle Piecie is 0; exactly 1
  nonzero-cost card across both arrays). Confirmed RED: 3 of 4 tests failed against the
  uncorrected data (Test 2, Welloe Force's existing `mpCost: 40`, passed immediately since it was
  already correct).
- **Task 3 (TDD GREEN):** Corrected `mpCost` to `0` for the 35 named Piecie IDs (leaving
  `piecie_welloe_force` untouched at 40) and all 10 named Snelle Piecie IDs — 45 single-field
  edits total, one `mpCost:` numeric literal per card, no other field touched. Confirmed GREEN:
  all 4 new tests pass, `node --check` clean on both files, full `npm test` suite green
  (661/661).

## Files Created/Modified

- `.planning/audits/2026-07-16-piecie-snelle-cost-audit.md` — new ruling doc (46-card table +
  Personal Quest closure + reverse-direction check + Delluft/Dierenasiel closing note)
- `tests/data/mp-cost-tribute-audit.test.ts` — new regression test (4 assertions)
- `src/data/piecies.js` — 35 `mpCost` fields corrected to 0; `piecie_welloe_force` untouched at 40
- `src/data/snellePiecies.js` — 10 `mpCost` fields corrected to 0

## Decisions Made

- `snelle_blensen` ruled `mpCost: 0` despite its conditional "Free if countering a Frenssen" text
  implying an otherwise-real cost — applying the same strict "text must explicitly state a
  self-paid cost" standard used for all 45 other cards. Flagged explicitly in the audit doc as a
  judgment call Gandoe may want to revisit if the original design intent was a real conditional
  price.
- Personal Quest audit (COST-03) closed with no code change — confirmed via a fresh grep +
  direct read this session that none of the 6 `questType: "PERSONAL"` quests mention any
  cost/pay/tribute language.
- Delluft/Dierenasiel's own "cost 0" text promise is left untouched by this plan on purpose —
  the decision of whether to rewrite it (now that all 7 referenced Piecies rule to `mpCost: 0`
  unconditionally) belongs to Plan 36-03's `checkpoint:decision`, not this audit.

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed per their acceptance criteria.

## Issues Encountered

None.

## User Setup Required

None.

## Verification Results

- `.planning/audits/2026-07-16-piecie-snelle-cost-audit.md` exists: `grep -c "piecie_"` → 44,
  `grep -c "snelle_"` → 17 (both counts include every required ID plus header/section
  occurrences, confirming full coverage of all 36 Piecie + 10 Snelle Piecie rulings).
- `npx vitest run tests/data/mp-cost-tribute-audit.test.ts` — 4/4 passing (GREEN).
- `node --check src/data/piecies.js src/data/snellePiecies.js` — no output, clean.
- `npm test` — 661/661 passing, 0 failures.
- `git diff src/data/piecies.js src/data/snellePiecies.js` reviewed line-by-line: only `mpCost:`
  numeric literals changed on the 45 corrected card objects — `description`, `tags`, `effectId`,
  `rarity`, `requirement`, and every other field byte-identical to before this plan.

## TDD Gate Compliance

RED → GREEN followed correctly:
- RED commit: `test(36-01): add failing test for mpCost tribute audit ruling` (`2c0c1f3`) —
  confirmed 3 of 4 assertions failed against uncorrected data before this commit.
- GREEN commit: `feat(36-01): correct mpCost to 0 for 45 Piecies/Snelle Piecies per audit`
  (`341c0c7`) — confirmed all 4 assertions pass after this commit.
- No REFACTOR commit needed (no cleanup required beyond the direct data correction).

## Next Phase Readiness

Plan 36-01 is complete. The finished ruling table unblocks:
- **Plan 36-02** (Welloe Force rework + tribute-payer picker + affordability gate, COST-05/06) —
  can now proceed knowing `piecie_welloe_force` is confirmed as the sole tribute card in scope.
- **Plan 36-03** (`checkpoint:decision` — Delluft/Dierenasiel text fate, COST-04) — can now
  proceed with the actual Piecie ruling in hand (all 7 referenced SUBSTANCE/PET Piecies
  confirmed `mpCost: 0`), rather than a prediction.

No blockers. No deferred items introduced by this plan.

---
*Phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede*
*Completed: 2026-07-16*

## Self-Check: PASSED

- FOUND: .planning/audits/2026-07-16-piecie-snelle-cost-audit.md
- FOUND: tests/data/mp-cost-tribute-audit.test.ts
- FOUND: .planning/phases/36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede/36-01-SUMMARY.md
- FOUND: e33707b (docs: audit ruling doc)
- FOUND: 2c0c1f3 (test: RED)
- FOUND: 341c0c7 (feat: GREEN)
