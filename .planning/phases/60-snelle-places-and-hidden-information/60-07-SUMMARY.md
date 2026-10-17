---
phase: 60-snelle-places-and-hidden-information
plan: 07
requirements: [EFX-07]
commits: [99a9705, 83b7fa1, c9523b0]
---
# Phase 60 Plan 07: Hidden information

- Pre-task: `fresh-ignores-places.test.ts` rewritten on the 2.0 Place code (20 Places, Power / dice / Quest MP / start-of-turn / loss / gain probes, non-fresh must differ from baseline, no floors). It found a real bug: Momentum Stabilizer and Zo is Natuur affected fresh Mosjes; both loss steps now skip fresh. `loss-pipeline-order` setup made non-fresh (its slots were fresh by default).
- `src/engine/hidden/revealCards.js` + `getRevealedFor.js`: `state.revealed[viewerId] = [{source, cardIds, turnNumber}]`, stale turns filtered/dropped; all 3 `revealedHandTo` writes replaced (FPS West ability + holder, Ronald), plus Stookerino, Jantje, Chef's Special (with Ronald only).
- Bot: `defaultAbilityInputs` 'oppHandCard' reads the opponent hand only via a reveal or the peek ability itself; none = skipped, hand never touched (tested with a throwing getter). Those Eyelashes already gave the pick to the hand owner (tested both directions + `_snelleBlocked`).
- UI: `src/ui/showNewReveals.js` (called from `renderFromState`) shows new entries of the LOCAL viewer on the existing read-only hand viewer; skipped when a pick modal for that player is already open (Stookerino). Removed `_snelleFlags` pills / animations and `freePiecieActivationAvailable`; the Caravan hand hint now uses `getEffectiveCost`.
- Deviation: `getRevealedFor` is used in `showNewReveals.js`, not literally in main.js. Test hooks: new `botUseAbility`; `botActivatePiecie` now settles a human pause afterwards.
- Tests: hidden-info.test.ts (11), hidden-info.spec.js (4 headless) + snelle-reaction.spec.js green; npm test 154 files / 1666 green; node --check clean.

## Self-Check: PASSED
