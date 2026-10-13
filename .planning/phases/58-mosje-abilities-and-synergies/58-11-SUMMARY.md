---
phase: 58-mosje-abilities-and-synergies
plan: 11
subsystem: tests/ui card-test-library
requirements-completed: []
commits: [5d5bd6a, 70f2ca0, a4192e9]
---
# Phase 58 Plan 11: Card tests for the 18 Example-Deck Mosjes Summary

All 18 Example-Deck Mosjes are proven on the real game, headless. EFX-01 stays open until 58-12 covers the other 14.

## What changed
- **Driver:** `tests/helpers/mosjeCardTest.js` (+ `mosjeCardSetup`, `mosjeCardTrigger`, `answerModals`). Registry `tests/ui/cards/mosje-registry-2-0.js` (27 cases, every number from the Card List) and spec `mosje-cards-2-0.spec.js`. Triggers go through the real UI (Activate button, Piecie Activate, Quest flow, bot attack); start/end of turn use the new testMode hook `runTurnBoundary`, FPS West's "opponent plays" uses `botPlayPiecie`.
- **Old runner replaced:** `mosje-abilities.spec.js` deleted (its job is `mosje-cards-2-0.spec.js`); `ABILITY_REGISTRY`/`ABILITY_SPECS` removed from `card-registry.js` (Amplifier, Kastelein, Binti Creator are hidden; martin_driver and ming_natural come back in 58-12).
- **Specs:** `gandoe-michelle-synergy.spec.js` rewritten to the one doubled gain (20 MP -> Level 2 / 0 MP; 10 MP -> 90, still Level 1) with no Gandoe kicker. `bulldozer-comeback` fixme re-enabled: Unstoppable fires from the bot's attack (`botAttack`), no button.
- **UI offers (from 58-10):** `offerHistorianKeep` (draw step) and `offerWestPeek` (start of the Quest flow) through the option modal, tested in `mosje-ui-offers-2-0.spec.js`.

## Deviations
- **[Rule 1 - Bug] Piecie activation never prompted a chain pick.** `handleActivatePiecie` did not settle `pendingChoice`; DDR Chris with 2 ready Piecies (and Jisca / Cless with a real choice) left the game paused with no modal. Fixed by calling `settleLocalMosjePauses()` at the end of the handler (found by the DDR 5-6 card test).
- First FPS West run passed for the wrong reason (regexes anchored, picked the first type); fixed, both cases now assert the real guess (+20 / -10).

## Gaps
- FPS West's "no card played counts as wrong" is an engine ruling flag (not in the Card List); the tests use "guess Place, opponent plays a Piecie" instead.
- Holder texts (Michelle's Bowie & Stormey, FPS West + FPS Coert, Binti + Coert) are 58-12.

## Tests
Headless Playwright (temporary config, deleted): 34 passed / 0 failed (27 Mosje cases, 4 Michelle, 1 bulldozer, 2 UI offers). `npm test` 1420 pass / 4 skipped; `node --check` clean (6 UI files + every touched src/test file). No sim run.

## Self-Check: PASSED
