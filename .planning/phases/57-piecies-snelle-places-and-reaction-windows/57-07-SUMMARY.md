---
phase: 57
plan: 07
requirements-completed: [SHELL-04]
key-files:
  created: [tests/meta/fixme-reasons.test.ts]
  modified: [src/abilities/piecieEffects.js, tests/ui/mechanics.spec.js, tests/ui/simulation/chain-tests.spec.js, tests/engine/v4-leftovers-removed.test.ts, tests/effects/thematic-piecies.test.ts]
---
# Phase 57 Plan 07: +1 die Piecies, VIS rewrites, SHELL-04 Summary

Dubbele Dosis, Loaded Dice, Dikke Plaat, Controller and Skipping Rope now add `questExtraDice` (the 2.0 dice source); chain-1 and chain-6 live; VIS-01/08 on 2.0 Stays rules; every fixme/skip is guarded by a meta test naming Phase 58-60.

## Flaky reaction-bot test (separate commit)
`tests/bot/reaction-bot.test.ts` "a human window pauses the bot turn" failed ~1 in 12 runs, also in isolation (not a suite-ordering issue). Cause: `createInitialGameState` deals random face-up Quests; when one was playable the bot quested (Sprint Race) instead of attacking, so no human window opened. Fix: pin the three quest stacks to an unplayable filler in that test. The assertions are unchanged (still requires the attack, the window, and the single replay). 40/40 passes afterwards.

## Verification
- `npm test` twice: 128 files, 1221 passed, 3 skipped. Syntax loop clean (7 files, each separately).
- Headless Full HD (temp config deleted, server stopped): piecie-activate, snelle-reaction, place-play, attack-and-quest-2-0, turn-flow-2-0 13/13. chain-1, chain-6 4/4 (x2); VIS-01, VIS-08 pass (x2 and in the gate run); VIS-07, chain-3 pass. cards project piecie-effects for the 5 converted Piecies 6/6.
- Meta guard shown failing on 14 offenders before fixes, passes now.

## Deviations / audit (old -> new)
- Silent `test.skip(); return;` bail-outs (VIS-05/06/07 setup, chain-3/4/7, card-test-runner) became hard `throw`s. This exposed that chain-4 (Youri -20 MP, V4) and chain-7 (Eendjes Voeren) were never running: now fixme Phase 58 / Phase 60 with reasons.
- VIS-01: "stays until end of turn" -> discarded at once, Energy -1, questExtraDice 1. VIS-08: "removed at end of this turn" -> stays through opponent turn, leaves at end of owner's next turn, lands in graveyard.
- VIS-02: revert assertion -> swap kept; remains fixme (Phase 59); run un-fixme'd it failed (own MP 30, not 70).
- thematic-piecies / equipment-scaling unit tests: questPrepBonus 1/2 -> questExtraDice exactly 1 (Jeffrey/DJ reroll halves are KNOWN GAP Phase 59). chain-6 asserts only an MP gain (engine gives 15, Card List says 10: Phase 59).
- Deleted unreferenced V4 `tests/ui/simulation/chain-specs.js`. Larry/Zegeltje effect still writes questPrepBonus (text mismatch, Phase 59). Remaining questPrepBonus in tests: Mosje abilities (Phase 58) and fixture fields. successMP/failMP/persist hits are 2.0 quest data or absence checks.
- V4 guard extended (persistUntilEoT, showDamageInterruptModal, humanTakesDamageOrElimination; no persistUntilEndOfTurn in src/data).
- Playwright needs 1920x1080; at 1280 the hand overlay blocks the Activate click in place-play.

## Self-Check: PASSED
