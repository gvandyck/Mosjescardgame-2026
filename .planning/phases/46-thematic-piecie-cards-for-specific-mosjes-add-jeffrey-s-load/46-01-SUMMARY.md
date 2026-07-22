---
phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
plan: 01
subsystem: cards
tags: [piecies, boosters, quest-bonus, draw, mosje-tags]
requires:
  - phase: 41-coert-s-caravan-binti-discount-text-engine-mismatch-fix-stan
    provides: capped Piecie MP-gain and Coert-family conventions
provides:
  - four booster-only thematic UTILITY Piecies
  - tag-family kicker lookup with an exact DDR Chris exception
  - turn-scoped one-shot Piecie-activation draw
affects: [booster-pool, piecie-activation, card-reference]
tech-stack:
  added: []
  patterns: [canonical tag-family lookup, turn-scoped one-shot activation flag]
key-files:
  created:
    - tests/effects/thematic-piecies.test.ts
  modified:
    - src/data/piecies.js
    - src/abilities/piecieEffects.js
    - src/engine/turnManager.js
    - tests/ui/cards/card-registry.js
    - docs/card-reference.md
key-decisions:
  - JEFFREY, COERT, and DJ kickers inspect live slot tags with canonical Mosje data as fallback.
  - Perfect Rhythm checks exact mosje_chris_ddr and consumes its draw after a later activation resolves.
patterns-established:
  - Booster-only thematic items remain generically useful and add only a small named-family kicker.
requirements-completed: [THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08]
duration: 58 min
completed: 2026-07-19
---

# Phase 46 Plan 01: Thematic Piecie Cards Summary

**Status:** COMPLETE
**Branch:** `card/phase-46-thematic-piecies`
**Commit/push:** Not performed.

## Outcome

Added four free, booster-only UTILITY Piecies with placeholder art:

- Loaded Dice: next Quest roll this turn gets +1, or +2 with a JEFFREY Mosje.
- Boosterpackkie: draw 1, roll once for another draw on 5-6, and gain 10 MP
  with a COERT Mosje.
- Perfect Rhythm: the next later Piecie activation this turn draws 1, and
  exact DDR Chris grants 10 MP.
- Dikke Plaat: next Quest roll this turn gets +1, or +2 with a DJ Mosje.

The shared family helper reads active slot tags and falls back to canonical
Mosje data. MP kickers use the existing capped gain path without leveling.
Perfect Rhythm does not consume itself, consumes exactly once even if the deck
is empty, and is cleared at end of turn when unused.

The browser registry tracks all four cards, the card reference now lists the
live 74-card Piecie pool, and the thematic notes record that Keyboard already
belongs to Coert Hawaiian Tech Savant. Coert Kast-elein remains hidden and
Chris All-Rounder intentionally receives no dedicated item.

## Verification

- Runtime `node --check` passed for all touched JavaScript files.
- Focused Vitest passed: 20/20.
- Targeted Playwright coverage for the four new cards passed: 4/4.
- `npm run validate` passed: lint exited with the existing 263 warnings,
  source typecheck passed, and 72 files / 698 tests passed.
- Full card suite: 60 passed, 9 skipped, 3 failed. The two known baseline
  failures remained `mosje_amplifier` and `mosje_binti_creator`; Ming Natural
  had a transient modal timeout and passed its isolated rerun. All four new
  cards and Ronald Kip's +50 MP stacking check passed.
- Full simulation: 153/160 passed in 39 minutes. The seven failures were
  timeout-only reward-overlay waits (4.4%, below the 25% gate), and completed
  results reported zero crashes.
- `git diff --check` passed apart from Git's line-ending notices.

## Deviations

The card-reference header was already stale at 68/64, so it was corrected to
the live 74-card registry while adding the four required rows. A transient Ming
Natural browser timeout was rerun in isolation to distinguish it from a
Phase 46 regression.

## Safety

Existing working-tree planning changes were preserved. No commit, push, merge,
rebase, branch deletion, PR, or `main` update was performed.

## Self-Check

PASSED. All planned source, test, registry, documentation, and closeout
artifacts exist, and the Phase 46 acceptance gates are satisfied with the
baseline timeout caveats documented above.
