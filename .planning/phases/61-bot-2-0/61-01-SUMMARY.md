---
phase: 61-bot-2-0
plan: 01
requirements: [BOT-04]
commits: [649fc4d, d0dada8]
---
# Phase 61 Plan 01: Table view for the bot (BOT-04)

- `getBotView(state, botId)` + `asBotView`: opponent hand (except this turn's reveals), both decks, Quest stack decks, opponent face-down Piecie ids, `revealed[opponent]`, the opponent's pending options / eligible list and `_pendingTargets` are hidden; counts and positions stay; the input is never touched. A face-down opponent slot keeps its `type` (`isPiecieReady` needs it). Hardening beyond the plan: the opponent's `pendingChoice.after.p.eligible` is blanked, and `revealed` is always an object (`{}` when empty) so a missing key tells nothing.
- The 9 choosers (chooseMosjeAction, chooseQuestChoices, chooseQuestCostChoice, chooseReaction, chooseTriggerChoice, defaultAbilityInputs, pickBotOwnTarget, pickDjRerollDie, planPiecieActivations) project with `asBotView` first; all bot / driver / smoke / bot-vs-bot tests unchanged and green.
- `tests/helpers/hiddenTrap.js` (`makeTrapState`; the file already sat untracked and matched the plan, kept), `tests/bot/bot-view.test.ts` (10 cases incl. a "no secret string leaks" scan), `tests/bot/no-hidden-info.test.ts` (44: TRAP_TABLE per seat, source scan with stale-entry check, view and decision invariance, "retrofitted choosers contain `asBotView(`"). Verified by hand: a probe `export function probe(state)` fails the scan; dropping a projection fails the trap run (chooseMosjeAction, chooseQuestCostChoice) or the presence check (the others never read hidden data themselves). Probes removed.
- Test change named in the plan: `tests/engine/hidden-info.test.ts` "never reads the opponent hand" swapped the throwing getter on the whole `hand` for a hand whose card reads throw (the hand COUNT is table information); `toBeNull()` kept.
- `npm test` 157 files / 1736 green; `node --check` clean per file; no Playwright. No KNOWN GAPs.

## Self-Check: PASSED
