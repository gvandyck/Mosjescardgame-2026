---
phase: 58-mosje-abilities-and-synergies
plan: 03
subsystem: ui/bot
requirements-completed: []
commits: [a0a4f1c, d9342b5]
---
# Phase 58 Plan 03: Ability UI flow + bot defaults Summary

One data-driven path: `runMosjeAbilityFlow` reads `MOSJE_ABILITY_RULES` inputs, asks only for inputs not preset in `_pendingTargets` (generic `showOptionSelect`), then `useMosjeAbility`, reactions and pauses. The ~780 lines of V4 per-ability prompts in main.js are gone. Human prompts for `pendingChoice` / draw step (`settlePendingChoice`, `runDrawStepPrompt`); ability button comes from the rules (activated, not draw-step; disabled off-turn / used / unaffordable); hook `setNextAbilityDice`. Bot: `defaultAbilityInputs` (opponent hand only for Ronald Chef), `chooseTriggerChoice`.

## Notes
- Extra file `collectAbilityInputs.js` (shared by ability flow and draw step). Values: slot index, `{playerId, slotIndex}` (anyMosje), hand/opp-hand index, index arrays for top-N picks. Later ability plans read these from `_pendingTargets`.
- Bot Binti: the V4 `binti_discard` special case is removed; until the 58-07 rewrite reads `hand_card`, V4 Binti throws "needs input" and is skipped (smoke test still green).
- FPS West asks a card TYPE (not a hand card), so only Ronald Chef has an `oppHandCard` input; the test guards that.
- Changed test: `onfield-ability-clamp.spec.js` uses Ronald Chef instead of Parkour West (now passive, no button). No bot test needed changing.
- Verification: `npm test` 1253 pass / 4 skipped; node --check clean; headless mosje-ability-flow spec 3/3. smoke.spec "end turn" / "two full turns" flake on a random first player (the first passes alone; known pre-existing smoke flakiness).

## Self-Check: PASSED
