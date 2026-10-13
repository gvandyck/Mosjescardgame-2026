---
phase: 58-mosje-abilities-and-synergies
plan: 10
subsystem: engine/mosje-abilities
requirements-completed: [EFX-05]
commits: [82fa854]
---
# Phase 58 Plan 10: Ronald Chef, Martin Historian, Senor West, Coert KasteLuck, Tuk Architect Summary

The last five Mosjes are on the 2.0 Card List (EFX-05 ticked; EFX-01 stays open until 58-12 re-covers the browser specs). One code commit for both tasks (the two tasks share `mosjeAbilities.js` / `mosjeTriggers.js`).

## What changed
- **Ronald Chef:** 2 Energy, once per turn, no cooldown. The chosen card moves to `opponent.setAside`; `armSetAside` (their start of turn) and `returnSetAside` (their end of turn) bring it back after their next turn. `_lockedCard`, `isHandCardLocked` and `strategicInsightCooldown` are gone.
- **Coert KasteLuck:** `startOfTurn` trigger, 4-6 draw 1 (no reshuffle) and +5 MP. `kasteLuckSameTurnActivation` removed from turnManager.
- **Tuk Architect:** inputs `pick` (2 indices of the top 5) and `order` (order of the rest, indices into the remaining cards); 1 Energy. The UI order step and the bot defaults now size `order` after the pick (`afterPick`).
- **Martin Historian:** draw-step option (no Activate button). Time Control reorders the top 5 of either deck, +15 MP, replaces the draw; `martinHistorianEndDraw` draws 2 at end of turn only on Time Control turns. Holder (Cless, The Teacher / Chamber): `keepCardId` puts 1 of the 5 from your own deck into hand.
- **Senor West:** guess Mosje / Piecie / Snelle / Place (Quest and anything else is refused), reveal top of either deck, correct draw 2 + 10 MP, wrong -10 through the loss funnel. Holder peek is `senorWestPeekQuestStack` (once per turn, returns `{ success, state, cardId }`).
- Tests: new `mosjes-rest-c.test.ts` (15), rewritten ronald / kasteluck / west tests, energy-charging and dead-flag inputs updated. Settled for the bot: no new pauses (bot draws normally at the draw step; Tuk/Ronald/West use default inputs).

## Gaps / for Gandalf
- UI offers for the two holder extras are not built yet (engine only): Historian `keepCardId` pick and Senor West's Quest-stack peek. West's peek is meant for the Quest flow in 58-12.
- Tony's "Morning Luck works on a 3-6" is a Piecie holder text (Phase 59); KasteLuck uses 4-6 always.
- Set-aside cards are not drawn on the board yet (no face-down tile); they just leave the hand.
- The bot guesses West's type blindly (first option, own deck); smarter play is Phase 61.
- Browser spec `card-chains` KasteLuck is `test.fixme` (Phase 58 plan 12 rewrite). No Playwright or sim run.

## Tests
`npm test` 1420 pass / 4 skipped; `node --check` clean (6 UI files + every touched src file).

## Self-Check: PASSED
