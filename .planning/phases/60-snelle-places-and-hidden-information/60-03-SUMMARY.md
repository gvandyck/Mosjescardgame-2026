---
phase: 60-snelle-places-and-hidden-information
plan: 03
requirements: [EFX-03]
commits: [e13fb54, 66ef60c]
---
# Phase 60 Plan 03: Cancel / redirect / copy Snelle

- Bodies in `snelle/snelleCancelEffects.js` (Jensen!, Frenssen!, Blensen!, Counter Strikka, Jammertje) and `snelleCopyEffects.js` (Dubbele Temminks, Gevalletje); they only queue `reactionMods` (cancel / retarget / double / copy). `resolveReaction` sets `state.replayingHeld` so only the held action consumes them (`takeHeldMod`); cancel = `cancelHeldCard` (discard or deck bottom, Energy stays spent).
- A Piecie/Snelle paused on a pick is now the held action too (`resumePiecie` / `resumeSnelle`, replaces the `hold` result), so Jensen! can cancel it. Frenssen! removes the Jensen! cancel, drains 10, and opens a targeted window for the Jensen! player. `getSnelleCost` (Blensen! 0 after Jensen!/Frenssen!, else 4), Blensen! shield in `piecieTargetOptions` / `pickMosje` / `resolveOppTargetSlot`, held hit cancelled. Dubbele/Gevalletje refuse five-star Piecies (`heldPiecieDef`); a copy runs `copyHeldPiecie` (no chain, no Place hook).
- V4 flags gone (negateNextPiecie/Search, counterChain, doubleNextPiecie, copyLastPiecie, _lastPiecieEffect). Tests: `snelle-cancel-copy.test.ts` (12), 8 registry cases + `snelle-chains-2-0.spec.js` (5: Jensen->Frenssen->Blensen, Harde Didde / Klaar Met Jou vs Not Today!/Jensen!). 20/20 Snelle have a registry entry. npm test 153 files green, snelle specs 36 green headless, node --check clean.
- Deviations: (1) V4-flag tests rewritten to the new entries (phase48 Dubbele, stub-engine-wiring negateNextSearch removed, reaction-windows Dubbele tests use one-star Affoe since Klaar Met Jou is five-star). (2) Not Today! now also saves a Mosje a Piecie sends to the Welloe pile (`preview.welloeSlots`; before: sideways only). (3) Bot now Jensen!s a targeted loss and Frenssen!s a Jensen! (test hook `botActivatePiecie`, `_testNoBotResume`). (4) Piecie targets are pre-chosen in `state._pendingTargets`, so Counter Strikka moves that pick; a card with one legal target (or an auto-picked one) can't be moved (Energy still spent).
- Unbuildable texts: none. Gaps: Blensen! only stops pickers/single-target resolvers; "each opponent Mosje" Piecies (Straffoe) still hit; UI cost label for Blensen! stays "4 or free".

## Self-Check: PASSED
