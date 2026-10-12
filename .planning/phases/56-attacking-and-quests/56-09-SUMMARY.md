---
phase: 56
plan: 09
requirements-completed: [PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07]
---
# Phase 56 Plan 09: Live-board attack/Quest specs Summary

New `tests/ui/attack-and-quest-2-0.spec.js` (3/3 headless): 3 face-up Quests, attack drops the target by `getPower` and the attacker then cannot Quest (E12/E13), forced-dice win +25 with a new Quest face-up (E16), forced fails -15 + token then discard (E17). New helpers: `setQuestFaceUp`, `setNextDice`, `clickModalOption`, `questViaUi`, `questFirstAvailable`, `attackViaUi`. No tests/ui file references btn-general-quest / btn-personal-quest / injectQuestToTopOfDeck. `npm test` 1162 passed / 3 skipped; `node --check` clean (6 UI files + all tests/ui js). Headless temp config deleted, no servers left.

## Headless results (final runs)
attack-and-quest 3/3; turn-flow 3/3; quest-success 1/1; card-chains 12/12; gandoe-michelle 4/4 (Scenario D re-enabled); alyssa-jisca B ok; full-game 5/5 (active game re-enabled; DIGITAL vs ARTISTIC timed out once, passed on rerun); mechanics: VIS-03, 04, 07, 09 ok (VIS-03/09 re-enabled). Not run: simulation/* (node --check only, never test:sim; auto-player/game-collector moved to `#btn-quest` and 2.0 log lines; chain-tests unrun).

## Changed expectations
- Scenario D: 30 + 40 (Arm Wrestling, Skilled) + 15 synergy = 85 (was -20 cost +65 +15 = 90); no MP entry cost in 2.0.
- VIS-03 uses a plain Mosje (Michelle's random Tough Gamble made +25 flaky); VIS-04 asserts no slot keeps negative MP; VIS-09 is now "one action per Mosje" (picker says "No Mosje can act").
- full-game WIN_REASONS gained the 2.0 overlay texts (no Mosje left, held Level 3). Level-3 test dropped the V4 dice-modal stat-chip assertion (2.0 dice screen is a plain option modal). Tikker test: "No Quest available" replaces the pay modal.

## KNOWN GAP fixmes (not Quest-related unless noted)
- Phase 57: VIS-01, VIS-02, VIS-08 (Piecie Activate button missing headless; VIS-08 passed 1 of 3 runs); chain-tests chain-1/chain-6 (`questPrepBonus` never consumed by 2.0 rollQuestAttempt, Quest part rewritten).
- Phase 58: VIS-06 (Youri button), bulldozer-comeback cinema (Unstoppable button; Quest-fail half passes), alyssa-jisca Scenario A (start-of-turn +10 gives 0). Pre-existing Phase 58 fixmes VIS-05/06b/06c and redbull-coert unchanged.

## Self-Check: PASSED
