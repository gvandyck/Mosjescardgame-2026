---
phase: 56
plan: 05
requirements-completed: []
---
# Phase 56 Plan 05: Bot attack-or-Quest Summary

Minimal 2.0 bot: botDriver Phase E loops over own Mosjes; `chooseMosjeAction` picks attack or Quest by expected MP swing (attack = min(Power, target MP) +20 on getemt; Quest = p*(win+jab) - (1-p)*(lose, +20 if it getemts itself) - cost rank; null if swing <= 0). New: `questWinChance` (exact binomial, `questNeeds`), `chooseQuestCostChoice`, `chooseQuestChoices` (jab lowest-MP, Vraag Aad, Parkeren Delft). Legality is delegated to the engine (`canMosjeTakeAction`, `isValidAttackTarget`, dry-run `rollQuestAttempt`). Deleted `questOdds.js`, `rollBotQuestDice.js`; `assessQuestRisk.js` keeps only `classifyLossSeverity`/`getRequiredConfidence` (still used by Risk and Reward). botDriver imports none of the V4 Quest API; Personal Quest placement removed.

## Bot-vs-bot (Example Decks, new smoke tests, seeded)
All finish by LEVEL_3: TAKSEN v REGELAARS 38 bot turns, CREATIEVELINGEN v TAKSEN 13, REGELAARS v CREATIEVELINGEN 111. Per-turn invariants hold.

## Changed expectations (no assertion weakened)
- strategy.test.ts: dropped the `estimateQuestOdds`/`assessQuestRisk` describes (V4 models deleted; replaced by `questWinChance`/`chooseMosjeAction` cases in bot-actions-2-0.test.ts). `getRequiredConfidence`/`classifyLossSeverity` cases kept. The "Level 3 never wins the game" case went with `assessQuestRisk` (no winsGame signal exists now; Phase 61 BOT-01).
- botDriver.test.ts: mock state now has `questStacks`. The "mp=10 / mp=15 attempts the Quest" cases flip to "does not Quest": a fail (-15) reaches 0 = getemt, so the swing is negative. mp=40/50 still Quest. Test 4 now asserts the attempt counter plus `actedThisTurn`.

## Deviations / gaps
- KNOWN GAP (fix in Phase 61): no profile risk tolerance, no table-knowledge guard, no combos (Debug System reorder, Form Alliance target, Improvise energy/Strategy Puzzle dice choices unused).
- Attack swing ignores card attack triggers/reactions (Phases 57-60).
- PLAY-01..03 stay open (human UI in 56-06+). `npm test` 124 files / 1238 green, node --check clean.

## Self-Check: PASSED
