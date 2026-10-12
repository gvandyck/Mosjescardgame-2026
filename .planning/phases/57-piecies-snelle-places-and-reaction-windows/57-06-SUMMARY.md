---
phase: 57
plan: 06
requirements-completed: [TABLE-04, TABLE-05]
key-files:
  created: [src/ui/actions/promptReaction.js, src/ui/actions/settleReactions.js, tests/helpers/reactionUi.js, tests/ui/snelle-reaction.spec.js, tests/ui/place-play.spec.js]
  modified: [src/main.js, src/ui/handRenderer.js, src/ui/actions/runAttackFlow.js, src/ui/actions/runQuestFlow.js, tests/ui/action-flows.test.ts, .planning/REQUIREMENTS.md]
---
# Phase 57 Plan 06: Human reaction prompts, U6/U7 Summary

Human reaction prompt ('Reaction' modal on showOptionSelect: eligible Snelle + Pass, plain-words moment text for all 10 moments); UI `settleReactions` (human prompted, bot answers at once, remote online responder auto-passed with a KNOWN GAP log). Attack/Quest flows take an injected `settle`; main.js settles after human Piecie activation and Snelle play, and playBotSteps prompts the human then resumes `driveBotTurnSteps(..., { humanIds })`. V4 showDamageInterruptModal/humanTakesDamageOrElimination deleted. TABLE-04 and TABLE-05 ticked.

## Verification
- `npm test`: 127 files / 1215 passed. All UI files pass `node --check` separately.
- Headless (temp config, deleted) `--repeat-each=2`: snelle-reaction (a Protector played, b no slot, c no Energy, d Pass, e Sleutelpuntje +1 die / Pass / 0 Energy) and place-play (U7) 12/12 passed. Server stopped.

## Deviations / notes
- Hand Place play button now disabled with title "A Place is already in play" (left over from 57-04); asserted in U7.
- testMode-only hook `botAttack` (runs the real playBotSteps path) added in the existing __testHooks block.
- U6(c) uses Perfect Dodge (cost 2, Energy 1): The Protector costs 0 Energy so an "Energy 0" case cannot exist for it.
- KNOWN GAP (fix in Phase 60): Drain Zone text says "+10 Power" but the engine only adds +10 to DRAIN losses; U7 asserts placement, Energy, block, destroy-to-discard, not a Power change.
- tests/bot/reaction-bot.test.ts failed once in one full run (random bot choice, passes 3/3 in isolation); not touched by this plan.
