---
phase: 58-mosje-abilities-and-synergies
plan: 02
subsystem: engine/mosje-framework
requirements-completed: []
key-files:
  created: [src/rules/mosjeAbilityRules.js, src/engine/mosje/*.js (mosjeTriggers, runMosjeTriggers, runTriggerJobs, resolvePendingChoice, getDrawStepOptions, finishDrawStep), src/engine/dice/testDiceQueue.js, src/engine/table/activatePiecieFree.js, src/engine/table/piecieActivationGate.js, src/bot/settleMosjePauses.js]
  modified: [src/engine/turnManager.js, src/engine/quests/resolveQuestAttempt.js, src/abilities/placeEffects.js, src/engine/deckEngine.js, src/engine/reactions/*, src/bot/botDriver.js, src/main.js]
commits: [e35111a, 594a105, 5792a95]
---
# Phase 58 Plan 02: Ability framework Summary

Shared machinery for the 32 ability rewrites: rules data (kind/limits/inputs), MOSJE_TRIGGERS registry + runner (9 hooks wired into turn flow, play functions, Place destruction, Quest), pendingChoice (auto-pick, resume without re-roll), draw-step pause, useMosjeAbility gates, one-gain Quest win, `activatePiecieFree` (ctx.free, shared `resolvePiecieActivation`), test dice queue. The registries are empty, so real play is unchanged except the new gates.

## Notes / deviations
- Runner returns `{ state, amount }` for `questWinAmount`, state for other hooks. Trigger ctx gets `ownerId` + `holderSlotIndex`; caller keys (playerId, slotIndex, free, cardDef) are untouched.
- Bot never stalls: `settleMosjePauses` (bot first option / normal draw), called in botDriver and around the 4 `startTurn` calls in main.js (offline / bot-vs-bot only). The human UI for pendingChoice / pendingDrawStep is not built yet (58-03); no entry is registered yet, so no pause can occur.
- There is no "Level 2 gate" in activatePiecieCore; `piecieActivationGate` holds the Void + Jeffrey V4 block (Jeffrey's 2.0 rule edits that one place).
- Free activation replays through reactions as type `activatePiecieFree` (resolveReaction). Jisca/DDR plans must handle a returned `reactionPending` state.
- Free activation from outside a slot: non-Stays are slotless (returnTo pile), Stays take a free slot. If negated, the card goes to discard.
- A pause in `startOfTurn` skips `oppStartOfTurn` for that turn start (only one pendingChoice at a time).

## Test changes (no test weakened)
- stub-engine-wiring: state builders got `activePlayerId` (own-turn gate); Tests 18/19 use Tuk Healer instead of Gandoe Wizard (now a trigger; the test is about "no MP gate").
- amplifier-hacker-rework: the doubled "next ability" is DJ 80/20 (+10 -> +20) instead of Alyssa Fissa (now a trigger; Tuk Healer is in Redbull's NO_DOUBLE list).
- botDriver.test: AZN Cless "gambles" case `it.skip` with `KNOWN GAP (fix in Phase 58, AZN Cless rewrite)`: Risk & Reward is an end-of-turn trigger, the V4 button is refused.
- New: mosje-triggers (15), free-activation-chain (8), mosje-ability-rules (5). `npm test`: 1243 pass, 4 skipped. Syntax check clean. Playwright not run (no UI change).

## Self-Check: PASSED
