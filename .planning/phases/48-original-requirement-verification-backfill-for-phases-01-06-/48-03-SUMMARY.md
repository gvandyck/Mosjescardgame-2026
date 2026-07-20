---
phase: 48-original-requirement-verification-backfill-for-phases-01-06
plan: 03
subsystem: requirement-traceability
tags: [snelle-piecies, requirement-verification, testing]
dependency-graph:
  requires: []
  provides:
    - "48-FRAGMENT-03-snelle.md (8-row Snelle Piecie evidence matrix)"
    - "tests/effects/phase48-snelle-verification.test.ts (gap-fill coverage)"
  affects:
    - ".planning/REQUIREMENTS.md (IMPL-PF-S1..S4, IMPL-AR-S1..S4 traceability)"
tech-stack:
  added: []
  patterns:
    - "Two-pronged evidence discovery (id-string grep + effect-function-name grep) reused from 48-01/48-02"
    - "D-02 false-green guard: gap-fill tests assert a concrete field delta on the real returned state"
key-files:
  created:
    - tests/effects/phase48-snelle-verification.test.ts
    - .planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-FRAGMENT-03-snelle.md
  modified: []
decisions:
  - "snelle_lucky_coin (IMPL-PF-S4/IMPL-AR-S3) classified VERIFIED using the existing BUG-04 slot-guard regression test (tests/engine/snelle-piecie-full-slots.test.ts) rather than GAP, per the plan's own interfaces pre-classification — the coin-flip effect body itself has no dedicated unit test beyond that regression, noted explicitly in the fragment rather than silently claimed as fully covered"
  - "snelle_negate_elimination checked against chain-tests.spec.js before concluding GAP (per RESEARCH.md's skipReason anti-pattern warning) — confirmed VERIFIED via the chain-3 live browser assertion"
metrics:
  duration: "~25 min"
  completed: "2026-07-20"
---

# Phase 48 Plan 03: Snelle Piecie Requirement Verification Summary

Mapped and verified the 8 Snelle Piecie requirements (IMPL-PF-S1..S4, IMPL-AR-S1..S4) — 4 unique
cards, each filed twice (once per deck bucket) — to real test evidence, closing the 2 confirmed
gaps (`effect_snelle_bijna_welloe`, `effect_snelle_dubbele_temminks`) with new false-green-guarded
unit tests. Zero `src/` files touched.

## Tasks Completed

### Task 1: Two-pronged evidence map for all 8 Snelle rows
Grepped `tests/` for both the card id string and the `effect_snelle_*` function name for each of
the 4 unique Snelle Piecie cards. `snelle_jensen` and `snelle_lucky_coin` had existing
outcome-asserting evidence (`tests/ui/cards/card-registry.js` + `card-test-runner.js` for Jensen's
+20 MP gain; `tests/engine/snelle-piecie-full-slots.test.ts`'s BUG-04 slot-guard regression for
Lucky Coin). `snelle_negate_elimination` was checked against `tests/ui/simulation/chain-tests.spec.js`
before concluding anything (per RESEARCH.md's Anti-Pattern warning that skipReason rows in
`card-registry.js` can still have real coverage elsewhere) — confirmed VERIFIED via the chain-3
live browser assertion (`expect(mpAfter).toBeGreaterThan(0)` + battle-log match). `snelle_bijna_welloe`
and `snelle_dubbele_temminks` had zero hits under either grep prong — confirmed GAPs, handed to
Task 2. Wrote `48-FRAGMENT-03-snelle.md` with all 8 rows.

**Commit:** `0a3345a` — `docs(48-03): map 8 Snelle Piecie requirement rows to real evidence`

### Task 2: Gap-fill unit tests for confirmed Snelle effect gaps
Created `tests/effects/phase48-snelle-verification.test.ts` importing
`effect_snelle_bijna_welloe` and `effect_snelle_dubbele_temminks` from
`src/abilities/snelleEffects.js` via `// @ts-expect-error`, reusing the trimmed
makeState/makePlayer/makeMosje fixture pattern from `tests/effects/thematic-piecies.test.ts`.
4 new tests, each asserting a concrete field delta on the actual returned state (D-02 guard —
deleting the effect body would fail these):
- `effect_snelle_bijna_welloe`: heals the active Mosje +20 MP at/below 10 MP; no-op above 10 MP.
- `effect_snelle_dubbele_temminks`: sets `_snelleFlags.doubleNextPiecie[playerId]` for the acting
  player only, confirmed the opponent's flag stays unset.

**Commit:** `62ec876` — `test(48-03): close 2 confirmed Snelle Piecie gaps with field-delta assertions`

## Deviations from Plan

None — plan executed exactly as written. Task 1's evidence classification for
`snelle_lucky_coin` follows the plan's own interfaces section (which pre-cited the BUG-04
regression as the intended evidence, not a gap), so no deviation was needed there either.

## Verification

- `npx vitest run tests/effects/phase48-snelle-verification.test.ts` — **4/4 green**
- Full `npm test` — **716/716** (712 baseline + 4 new, 0 regressions)
- `git status --short` after both commits — clean; only the 2 planned files touched across the
  whole plan, zero `src/` changes (D-04 preserved)

## Self-Check: PASSED

- `tests/effects/phase48-snelle-verification.test.ts` — FOUND
- `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-FRAGMENT-03-snelle.md` — FOUND
- Commit `0a3345a` — FOUND in `git log`
- Commit `62ec876` — FOUND in `git log`
