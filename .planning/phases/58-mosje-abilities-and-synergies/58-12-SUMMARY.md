---
phase: 58-mosje-abilities-and-synergies
plan: 12
subsystem: tests/ui card-test-library + tests/meta
requirements-completed: [EFX-01, TEST-01]
---
# Phase 58 Plan 12: Other 14 Mosjes, section 6b chain + Chamber, fixmes closed, E-index guard Summary

All 32 Mosjes now have a headless card test on the real game; the Phase 58 fixmes are resolved or re-pointed to Phase 59; the TEST-01 guard checks E1-E30 + E7b. EFX-01 and TEST-01 ticked.

## What changed
- **14 non-deck Mosjes** in `tests/ui/cards/mosje-registry-2-0-rest.js` (26 cases, numbers from the Card List), spread into the registry after the 18 deck ones. New testMode hook `setDeckTop`; setup options `deckTop`, `graveyard`, `noUnlock`; trigger `playFromHand`.
- **Section 6b** `mosje-chains-2-0.spec.js`: Jisca + DDR Chris on one paid activation = two free (Energy dropped once, `ddrChainsThisTurn` 1, opponent -15); Synergy Chamber makes Binti's Coert text work without Coert (55), and not without the Chamber (45).
- **Senor West holder peek** was already built in 58-11 (`offerWestPeek`, tested in `mosje-ui-offers-2-0.spec.js`); `runQuestFlow.js` needed no change.
- **Fixmes:** Youri (mechanics VIS-05/06/06b/06c, chain-4) rewritten to the 2.0 Energy rule; KasteLuck and DDR card-chains rewritten; gambler cinema scene 1 rewritten; AZN Cless bot skip turned into a live test (the bot never presses an end-of-turn trigger). Re-pointed to Phase 59 with a real reason: redbull-youri x2, redbull-gambler x2, gambler cinema scene 2, chain-5, Battle Concert skip (all Redbull / Battle Concert are Piecies). `fixme-reasons.test.ts` now accepts only Phase 59/60. New `tests/meta/e-tests-index.test.ts` (ids in titles or header comments; ids only under a skip fail).

## Deviations
- **[Rule 1] Stale V4 specs removed/fixed:** six card-chains specs (Tuk Healer, Tactician, Ming Natural x2, Chris All-Rounder, Jisca) encoded V4 rules and failed; deleted, each Mosje is covered by the 2.0 registry. chain-6 used Coert Tech, whose Extra Resources draw-step prompt blocks the hand: now Ming Predictor. chain-2 pinned its hand. Affoe-getemt opponent pinned to a plain Mosje.
- Chain-rule test cannot prove "no third roll" independently (only 3 Piecie slots; the counters match either way); the rule is unit-tested in `mosjes-deck3-chain.test.ts`.

## Known gaps
- `card-chains` "Affoe getemt" is flaky (about 3 in 8 fail, also on the untouched HEAD version: the turn sometimes passes to the bot mid-test). Not caused by this plan; needs a Piecie-phase look.

## Tests
Headless Playwright (temporary config, deleted, no leftover processes): full run 82 passed / 8 failed / 8 skipped; after fixes the 6 stale specs are gone, chain-6 and chain-2 pass, only the flaky Affoe-getemt remains failing intermittently; mosje-cards 60+ cases, chains 3, mechanics 10 pass. `npm test` 1453 pass / 3 skipped; `node --check` clean. No sim run.

## Self-Check: PASSED
