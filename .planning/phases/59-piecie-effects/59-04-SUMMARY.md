---
phase: 59-piecie-effects
plan: 04
requirements: [EFX-02]
key-files:
  created: [src/abilities/piecie/utilityDrawPiecies.js, src/abilities/piecie/utilityDicePiecies.js, src/abilities/piecie/utilityChainPiecies.js, src/abilities/piecie/utilityPlacePiecies.js, src/engine/quests/piecieRerollGrant.js, src/engine/quests/findRerollGrant.js, src/engine/quests/useRerollGrant.js, src/engine/energy/getCardEnergyCost.js, tests/abilities/piecies-ed-utility.test.ts]
  modified: [src/abilities/piecieEffects.js, src/engine/reactions/getEligibleReactions.js, src/engine/reactions/resolveReaction.js, src/engine/piecies/afterPiecieEffect.js, src/engine/turnManager.js, src/engine/turn/expireThisTurnEffects.js, src/engine/quests/rollQuestAttempt.js, src/engine/quests/resolveQuestAttempt.js, src/engine/gameState.js, src/data/piecies.js, src/ui/actions/promptReaction.js, src/bot/strategy/chooseReaction.js, src/bot/strategy/pickDjRerollDie.js, tests/ui/cards/piecie-registry-2-0.js]
completed: 2026-10-16
---
# Phase 59 Plan 04: Example-Deck Utility Piecies Summary

The last 8 Example-Deck Piecies run on the Card List (34 of 34), with a reusable Quest reroll grant and the Chain Reaction free-activation offer.

## Commits
- 26e5f27 All 8 effects, reroll grant, Chain Reaction offer, unit tests (shared machinery, one commit).
- Second commit: 14 headless card-library cases (55 in the spec, all green in the final run).

## What changed
- Boosterpackkie / Zie je die Dingetjes (pick, then order pause) / Stookerino (pick from the opponent's hand, 10 per Energy max 30, Binti +10) on `drawFromEffect` and pendingChoice pauses.
- Reroll grant: `player.rerollGrants` { scope ownQuest | anyQuest }, offered as `piecieReroll:<i>` next to the DJ entry at the after-roll pause; consumed before the reroll; Dubbele Dosis grant tied to the next own Quest, expires with the turn. Human prompt and bot (`pickDjRerollDie` with prefix) both handle it. Reusable in 59-06.
- Chain Reaction: arms `chainReactionFree`; `afterPiecieEffect` turns it into `chainReactionOffer` after a paid, non-Chain-Reaction activation; `activatePiecieCore` makes that activation free (ctx.free, so no Jisca / DDR chain roll); cleared at end of turn. `chainReactionActive` removed.
- Slecht Gezet, Shhh popo komt!, Huisbaas (destroy, optional deck search for an affordable Place, played via playPlace, deck shuffled). V4 graveyard recovery removed.

## Deviations
- [Rule 1] Data: Zie je die, Chain Reaction, Stookerino had a `requirement: level1` chip; Card List has no Needs, set to "any".
- V4 expectations rewritten: deck-balance (Slecht Gezet takes playerId; Huisbaas graveyard recovery replaced by a "no longer recovers" guard), thematic-piecies Boosterpackkie (rolls only with a Coert).
- Plan said "delete main.js _dingetjesPeek": already gone (59-01); nothing left to delete.
- Coert / Binti detected by MOSJES tags (COERT / BINTI).
- "Look at the opponent's hand" is the pick list in Stookerino's pause (Phase 60 audits hidden info for all pause option lists).

## Verification
npm test 146 files green; node --check clean (6 UI files + touched src, each separately); headless Playwright via a temporary config (deleted): piecie-cards-2-0 55/55. No sim run.

## Known gaps
Unbuildable texts: none. Zie je die puts the chosen card in hand without a draw count (not a draw), but the hand-size diff still fires on-draw Place effects (Bank Chilling); revisit in Phase 60.

## Self-Check: PASSED
