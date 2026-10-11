---
phase: 54-energy-levels-and-getemt
plan: 16
subsystem: tests
tags: [playwright, phase-gate, getemt, hold-level-3, no-level-zero, obby-2.0]
requires: ["54-15"]
provides:
  - "No Playwright spec seeds Level 0; tests/engine/no-level-zero.test.ts scans tests/ui/**/*.js"
  - "card-chains chain A on the 2.0 getemt rule; chain E on the 2.0 level-up rule"
  - "full-game hold-Level-3 spec on the real board"
  - "Phase 54 gate results (headless Playwright, Node smoke as sim stand-in)"
key-files:
  modified:
    - tests/engine/no-level-zero.test.ts
    - tests/ui/cards/card-chains.spec.js
    - tests/ui/full-game.spec.js
    - tests/ui/deckout-hang-repro.spec.js
    - tests/ui/cards/cardv1-board.spec.js
    - tests/ui/cards/cardv1-mosje.spec.js
    - tests/ui/cinema/arena-hover.spec.js
    - tests/ui/cinema/deckout-recycle-cinema.spec.js
    - tests/ui/deckout-banner.spec.js
    - tests/ui/onfield-ability-clamp.spec.js
    - src/main.js
requirements-completed: []
requirements-verified: [RULE-01, RULE-02, RULE-03, RULE-04, RULE-09]
completed: 2026-10-11
---

# Phase 54 Plan 16: Playwright specs on 2.0 rules and phase gate Summary

Specs no longer encode Level 0, defeat-at-0 or the instant Level 3 win, and the phase gate passes; it also caught and fixed one real UI bug (no win screen when the bot's turn hands over to a human who holds Level 3).

## Commits
- 7839641: spec migration, extended guard, main.js win-screen fix.
- e74eeee: headless race fix in deckout-hang-repro, Quest Mosje picker stage in full-game active spec.

## Spec rewrites (all to 2.0 rules, none emptied)
- 7 fixture specs: `level: 0` -> `level: 1` (cardv1-board, cardv1-mosje, arena-hover, deckout-recycle-cinema, deckout-banner, deckout-hang-repro, onfield-ability-clamp, plus card-chains fixtures). cardv1-mosje pill assertion `L2` -> `L1` (displayed level = stored level).
- card-chains chain A: Affoe at 5 MP -> sideways at 0 MP (`slot.sideways`), second hit -> `player_2.welloePile`; asserts no win overlay (opponent still has Mosjes in hand/deck), so no KNOCKOUT claim.
- card-chains chain E: was "piecie gain caps at 100, no level-up" (V4); now Level 1 / 80 MP +25 -> Level 2 / 0 MP (applyGainToSlot: one level, MP reset, no carry).
- full-game LEVEL_3 test: was instant win; now Level 3 reached via a real quest shows no overlay, and after End Turn + bot turn the overlay shows "held Level 3 until their turn". Fixed Mosje is Gandoe Destroyer (Michelle's Tough Gamble randomises quest MP), turn number set to 3 (first-turn quest lock), Mosje given entry protection so the bot cannot knock it down (deterministic), battle log `<details>` opened.
- full-game active spec and the new test: added the "Choose Mosje for Quest" picker stage (pre-existing stale flow, the old modal sequence never clicked it).
- deckout-hang-repro: added a turn-number guard plus a settle wait (headless slowMo 0 raced the bot's end-of-turn and the human's startTurn). Assertions unchanged and still strict.
- no-level-zero guard now also scans tests/ui/**/*.js.

## Deviations
**1. [Rule 1 - Bug] No end screen when startTurn ends the game (src/main.js, owned by 54-12).** Hold-Level-3 moved the win check into `startTurn`, but the offline bot->human handover and the bot-vs-bot loop only called `renderFromState`; status was FINISHED ("Game Over" header) yet no overlay appeared. Both paths now call `handleGameOver` when startTurn finishes the game. Found by the new full-game spec; commit 7839641.

## Gate results (all headless; Gandalf's screen untouched)
- `node --check` CLAUDE.md list + src/rules/abilityEnergyCosts.js + all of src/engine/{energy,mp,winLose}: clean.
- `npm test`: 103 files / 1075 tests passed.
- MP gate `ronald-kip-stacking`, `food-double-synergy`, `offlineGame.smoke`: 3 files / 20 tests passed.
- Playwright `cards` project: card-chains 12/12, cardv1-mosje 4/4, cardv1-board 2/2 (after the rewrites above; first attempt had 2 failures that were the V4 expectations fixed above plus a server hiccup on a very first run); piecie-effects sample (kannetje_melk, protein_shake, dikke_jonko, affoe, pot_of_weed) 5/5.
- Playwright `visual` project via a temporary headless config (deleted; `git status` clean of it): full-game 7/7 (passive, 3 matchups, active, hold-L3), deckout-banner 1/1, entry-protection 1/1, deckout-hang-repro 1/1, onfield-ability-clamp 1/1, arena-hover 1/1, deckout-recycle-cinema 1/1.
- No failure was left unexplained; none proven pre-existing was needed beyond the stale Quest-picker flow noted above.

## Sim stand-in
The CLAUDE.md `run-once.ts` path no longer exists. `npm run test:sim` was NOT run (about 2 h, old V4 deck ids until Phase 64, orchestrator rule). The Node Example-Deck bot-vs-bot smoke with per-turn 2.0 invariants (54-15) stands in. Playwright ran headless only; no http-server left listening.

## Requirements verified
RULE-01 (54-04), RULE-02/03/09 (54-15), RULE-04 (54-12): confirmed by npm test and the specs above.

## V4 test rewrites across the phase
Per-plan lists are in 54-01..54-15 SUMMARYs (54-15 rewrote none). This plan's rewrites are listed above. No test.fixme added; redbull-coert.spec.js remains the pre-existing KNOWN GAP (Phase 59, commit 7fa3e60).

## Known Stubs
None.

## Self-Check: PASSED
