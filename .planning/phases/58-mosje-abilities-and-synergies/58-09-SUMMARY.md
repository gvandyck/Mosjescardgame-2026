---
phase: 58-mosje-abilities-and-synergies
plan: 09
subsystem: engine/mosje-abilities
requirements-completed: []
commits: [b7d1a46, 7d5c275]
---
# Phase 58 Plan 09: Ming x2, Jeffrey Gambler, Youri, Ronald Mastermind Summary

Five Mosjes on the 2.0 Card List (EFX-01 stays unticked, 9 of 12 plans). Ming Natural and Master Plan go through `activatePiecieFree` (chain-safe); Future Sight takes the player's chosen stack, shows its top Quest, and pays 1 Energy inside the effect (can't pay -> stays); High Stakes pays a 1-2 stake inside the effect (refused if short), d6 1-2 / 3-4 / 5-6, and arms `player.gamblerQuestBonusTurn` read by a `questSuccess` trigger (+15 once); Speed Activate = 1 Energy, per turn, no cap, makes a Piecie placed this turn ready and draws 1; Master Plan is once per turn, not per game.

## Choices / deviations
- Master Plan input is a discard-pile index: `buildAbilityInputOptions` and the bot's `defaultAbilityInputs` `discardCard` now read the graveyard (they read the hand before). Future Sight's yes/no names the top Quest (`peekStack` on the rule input). The bot always answers "no" for the bottom (smarter use is Phase 61); no new pauses.
- `QUEST_BLOCKED` is NOT removed from src: Tikker (Phase 59) and `checkQuestCondition` still use it; only the Gambler no longer applies it. The acceptance grep for it is therefore not empty by design.
- Youri/Gambler added to NO_DOUBLE_ABILITIES (once per turn); `setYouriUses` hook, `youriAbilityUses` and the V4 `masterPlanUsed` are gone.
- Stays Piecie via Master Plan / Ming Natural takes a free slot (existing activatePiecieFree rule), so it stays on the field rather than returning to discard; no slot = refused. Card List is silent on this: flagged for Gandalf.
- Old V4 unit cases for these five (ability-text-reconciliation, dead-flag-mosje, youri-chris-synergy, energy-charging Youri) were rewritten into `mosjes-rest-b.test.ts` (27 new) / adjusted to the new input. Stale Playwright specs (redbull-youri x2, redbull-gambler x2, gambler cinema x2) are `test.fixme` with a Phase 58 note; 58-12 re-covers them. No Playwright or sim run.
- Not buildable-as-written: none.

## Tests
`npm test` 1394 pass / 4 skipped; node --check clean (6 UI files + every touched src file).

## Self-Check: PASSED
