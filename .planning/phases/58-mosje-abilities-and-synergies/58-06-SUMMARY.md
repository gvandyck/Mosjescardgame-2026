---
phase: 58-mosje-abilities-and-synergies
plan: 06
subsystem: engine/mosje-abilities
requirements-completed: []
commits: [a772efb]
---
# Phase 58 Plan 06: Deck 3 chain Mosjes Summary

Jisca (Perfect Combo), Dancing/DDR Chris (Perfect Combo Chain) and Cless, The Teacher (Teaching Moment) are `piecieActivated` triggers in registry order Jisca, DDR, Cless. Free activations go through `activatePiecieFree` (new helper `readyPiecieSlots` lists the ready Piecies); a `ctx.free` activation starts no roll. V4 `maybeChainChrisDdrCombo` (hand chain) and the V4 Jisca / Cless / DDR bodies are gone (manual entries are passthroughs). EFX-01 / EFX-05 stay unticked (6 of 12 plans).

## Choices (planner's ambiguity notes)
- Jisca "once per turn" = first paid activation (`jiscaRolledThisTurn`); DDR "up to 2" counts successful free activations (`ddrChainsThisTurn`); both reset in startTurn.
- Nested free activations use `skipReactions`: the outer activation's reaction window covers the whole chain, so the bot has nothing extra to settle.
- Jisca asks slot then foe target up front (pendingChoice), then activates, then the -15; with no legal foe the activation still happens. Per-trigger roll keys (`jiscaRoll`, `ddrRoll`, `clessRoll`) because a resumed pendingChoice ctx is shared by later jobs (found as a bug: DDR reused Jisca's roll).

## Tests (none weakened)
- New: mosjes-deck3-chain (13), three §6b cases in free-activation-chain incl. leftover-dice proof.
- Rewritten to 2.0 (V4 hand-chain / Jisca button gone): ability-text-reconciliation (Jisca, DDR), thematic-piecies (Perfect Rhythm + DDR), energy-charging (DDR free chain), free-activation-chain (DDR never chains on free).
- KNOWN GAP: tests/ui/cards/card-chains.spec.js DDR spec is `test.fixme` (V4 hand chain), rewritten in plan 58-12 (not run: headless Playwright not required here).
- `npm test` 1323 pass / 4 skipped; node --check clean (6 UI files + touched src).

## Not done
- Acceptance grep also matches Jeffrey Gambler's `questPrepBonus + 3` (a later plan's Mosje, left alone).

## Self-Check: PASSED
