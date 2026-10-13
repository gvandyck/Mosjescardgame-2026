---
phase: 58-mosje-abilities-and-synergies
plan: 07
subsystem: engine/mosje-abilities
requirements-completed: []
commits: [b6c9bbd, eb2fa28b]
---
# Phase 58 Plan 07: Tuk, Binti, DJ 80/20 Summary

Example Deck 3 is complete in the engine. Tuk: +20 to one own Mosje (herself by default), 1 Energy. Binti: 1 Energy + a Piecie from hand, owner-chosen non-fresh target loses 10, the opponent picks their own discard (a `bintiDiscard` pendingChoice; bot settles it right after its ability in botDriver). DJ 80/20: Lucky Beats is a reaction at the Quest after-roll window of either player's roll, once per turn (slot flag `djRerollTurn` = "round:active player"), upright DJ only, band re-checked. EFX-01 stays unticked (7 of 12 plans).

## Choices / deviations
- Reaction entries are strings `djReroll:<dieIndex>` (one per die) instead of `{kind, mosjeId}` objects, so `eligible.includes`, the bot and the prompt keep working unchanged. `getEligibleReactions` got an optional 4th arg `{ dice }`; later windows read `state.pendingQuestRoll.dice`.
- DJ rule keeps `ownTurnOnly:false` (guard test) and gets `reactive:true` + no inputs: boardRenderer shows no Activate button. The manual `ability_dj_8020_lucky_beats` throws.
- The human DJ owner is prompted at every Quest roll while the reroll is unused (it is an optional reaction).
- Extra files: `bintiDiscardChoice.js` (trigger entry), `canDjReroll.js`, `pickDjRerollDie.js`.
- binti-creator-quick-sketch.test.ts left alone (hidden Mosje, still passes).

## Tests (none weakened)
- New: mosjes-deck3-rest (18). Rewritten to 2.0: Tuk +20 (ability-text-reconciliation), Binti input in entry-protection, own-target-choice (Tuk replaces V4 DJ), amplifier-hacker (Martin Driver replaces V4 DJ as the doubled ability), phase48 DJ passive describe replaced by a "no manual activation" case. Tuk UI spec tightened to exactly +20 (headless run: 3 passed).
- `npm test` 1346 pass / 4 skipped; node --check clean (6 UI files + touched src).

## Self-Check: PASSED
