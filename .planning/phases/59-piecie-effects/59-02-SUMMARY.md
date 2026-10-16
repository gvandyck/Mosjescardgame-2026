---
phase: 59-piecie-effects
plan: 02
requirements: [EFX-02]
key-files:
  created: [src/abilities/piecie/mpPiecies.js, src/abilities/piecie/substancePiecies.js, src/abilities/piecie/gearPiecies.js, src/abilities/piecie/gainFromPiecie.js, src/abilities/piecie/resolvePiecieOwnSlot.js, src/engine/quests/isQuestBlockedByTikker.js, src/engine/quests/applyMomentumBoostWin.js, tests/abilities/piecies-ed-mp-substance-gear.test.ts, tests/ui/cards/piecie-registry-2-0.js, tests/ui/cards/piecie-cards-2-0.spec.js]
  modified: [src/abilities/piecieEffects.js, src/engine/quests/resolveQuestAttempt.js, src/engine/quests/checkQuestCondition.js, src/main.js, src/bot/botDriver.js]
completed: 2026-10-16
---
# Phase 59 Plan 02: Example-Deck MP / Substance / Gear Piecies Summary

16 Example-Deck Piecies run on Card List numbers from section files (piecieEffects.js re-exports them), with a 25-case headless card library and the Affoe-getemt flake closed.

## Commits
- 2ef67a9 Task 1: the 16 effects, helpers (gainFromPiecie Binti food +10, resolvePiecieOwnSlot re-checks picks against the target table), Momentum Boost win bonus, Tikker Stays + Quest block, Dikke Jonko / Larry pauses, bespoke Varkenspootjes/Affoe branches removed from main.js and the bot.
- 13335de Task 2: piecie-registry-2-0.js + piecie-cards-2-0.spec.js, Affoe flake fix, Tikker chain spec rewritten.

## Flake
Reproduced first: Affoe-getemt failed 2/8 (and 5/14 later). Cause was not a turn pass: the bot's random hand held a reaction Snelle (Phase 57 window) that changed the opponent MP. Fix is in the spec: bot hand pinned to one spare Mosje (an empty hand makes the empty-field opponent lose, which showed up as a second failure at the reward-overlay check). Now 16/16 headless. No src change.

## Deviations
- [Rule 1] 59-01 bug: resolving a Piecie pause crashed (JSON.parse(undefined)) when the opponent held a reacting Snelle. withReactionWindow gets `hold` (window keeps the finished result, no replay); resolvePendingChoice passes it. Regression test added.
- [Rule 3] Mouse rewritten as an interim +10 MP (getDigitalMP had to go); the "look at top 2" part stays for 59-05. Straffoe added to OWN_TARGET_EFFECT_IDS; no-active-mosje / own-target-choice guards now also scan piecie/*.js and accept pause results.
- Controller's +1 die and Momentum Boost's flag expire in expireThisTurnEffects; main.js Quest pill reads questExtraDice (questPrepBonus gone from main.js).
- V4 expectations rewritten to Card List numbers: equipment-scaling, physical-equipment-scaling, phase48 Varkenspootjes tests, chain-F Tikker spec (block is next turn, not same turn).
- MP Amplifier flag (x1.5) is still consumed inside gainFromPiecie until its own rewrite.

## Verification
npm test 144 files / 1484 tests green; node --check clean on the 6 UI files and touched src; headless Playwright (temporary config, deleted): card-chains, mosje-cards, mosje-chains, mosje-ui-offers, snelle-effects, piecie-cards = 91 passed, 3 pre-existing skips (before the Tikker spec rewrite, which then passed 3/3). No sim run.

## Known gaps
Unbuildable texts: none in this plan. Mouse peek -> 59-05.

## Self-Check: PASSED
