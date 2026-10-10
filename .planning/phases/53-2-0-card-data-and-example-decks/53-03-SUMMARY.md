---
phase: 53-2-0-card-data-and-example-decks
plan: 03
subsystem: data
tags: [obby-2.0, card-data, tests, name-parsing]
requires: [53-02]
provides:
  - parseMosjeName handles bracket and 2.0 comma name forms
  - V4 Mosje-text tests rewritten to Card List 2.0 data; npm test green
affects: [53-04, 53-05, 53-06]
key-files:
  modified:
    - src/ui/cardV1/parseMosjeName.js
    - tests/ui/card-v1-mosje.test.ts
    - tests/data/synergy-text-clarity.test.ts
    - tests/abilities/fps-west-guess.test.ts
    - tests/abilities/ronald-chef-lock.test.ts
    - tests/abilities/ability-text-reconciliation.test.ts
    - tests/ui/cards/cardv1-mosje.spec.js
key-decisions:
  - "Only src change: parseMosjeName. No engine/ability/bot/data change."
requirements-completed: [DATA-02]
duration: 15min
completed: 2026-10-10
---

# Phase 53 Plan 03: parseMosjeName comma form + V4 test rewrites Summary

`parseMosjeName` now splits "Alyssa, The Bulldozer" at the first ", " (and still handles `[First] Nick` and `[...], The Hacker`); the 11 tests broken by 53-02 are rewritten against the 2.0 text and the suite is green (87 files, 841 tests).

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. parseMosjeName comma form | 5ab2674 | 1 exported function; new unit cases (Alyssa, `[...], The Hacker`, Tuk quotes, DJ 80/20, FPS Coert); byName lookups use 2.0 names |
| 2. Rewrite V4 tests | 3dd1101 | see edit list |

## Test edits (file, assertion, reason)

- `tests/ui/card-v1-mosje.test.ts`: 6 `byName` lookups to 2.0 names (old bracket names); added comma-form parse test.
- `tests/data/synergy-text-clarity.test.ts`: `REQUIRED_PARTNER_MENTIONS` replaced with the 5 2.0 holders (Martin Historian->Cless, The Teacher; Senor West->AZN Cless; Youri->Dancing/DDR Chris; Binti->Coert, The Hawaiian Tech Savant; FPS West->FPS Coert). `mosje_coert_kastelein` (not in Card List 2.0, still V4 text) kept in the table so the honesty test passes. "While ... on your field" rule kept.
- `tests/abilities/fps-west-guess.test.ts`: description test now asserts the 2.0 Tactical Analysis text (was "Guess"/"70"). Engine behaviour tests untouched.
- `tests/abilities/ronald-chef-lock.test.ts`: description test now asserts 2.0 Strategic Insight text (was "lock"/"20 mp"). Engine tests untouched.
- `tests/abilities/ability-text-reconciliation.test.ts`: Chris description test (was "not 15 mp", 2.0 text contains it) now asserts Perfect Setup + face-down Piecies; FPS Coert description phrase updated to "succeeds at a physical or technical quest".
- `tests/ui/cards/cardv1-mosje.spec.js`: names to 2.0 forms, nickname helper handles comma form. Run: 4/4 Playwright pass.
- `offlineGame.smoke.test.ts`, `youri-chris-synergy.test.ts`: needed no change (passed).

No extra files beyond the plan's frontmatter list.

## Deviations from Plan

None.

## Divergences to track (not fixed here)

- Chris, The All-Rounder: 2.0 text says "gain 15 MP"; engine still grants no MP (existing engine test asserts that). Text<->engine gap, outside this plan's scope.
- FPS West engine still has the V4 guess-the-card +70/-20 behaviour; 2.0 text says +20/-10 with Energy cost. Same kind of gap.

## Verification

- `node --check` list (incl. parseMosjeName.js): clean.
- `npm test`: 87 files / 841 tests pass.
- `git diff` on src/engine, src/abilities, src/bot, src/data: empty.
- DATA-02 ticked; DATA-01 left pending (finishes in 53-06).

## Self-Check: PASSED
