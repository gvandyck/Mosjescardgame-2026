---
phase: 58-mosje-abilities-and-synergies
plan: 04
subsystem: engine/mosje-abilities
requirements-completed: []
commits: [a024f74, e0884bc]
---
# Phase 58 Plan 04: Example Deck 1 Fighting Mosjes Summary

Gandoe Wizard (start-of-turn Chaos Roll), AZN Cless (end-of-turn Risk & Reward with hand-card pendingChoice), Alyssa Fissa (Place destroyed by her owner, +20 once per turn), Michelle (questWinAmount modifier, ONE gain, 5-grid half) and Parkour West (+20 on Quest win) are registered triggers in `src/abilities/mosje/*`; V4 bodies in mosjeAbilities.js are no-op stubs, the V4 Michelle block in questLogic.js is gone. Bulldozer / Strongman / Parkour have no button. All Place-destroying paths already call `triggerPlaceDestroyedEffects` (no change needed). EFX-01 stays unticked (12-plan phase, 4 of 12 done).

## Side task
smoke.spec.js now uses `GAME_URL_TEST` (testMode forces player_1 first). Headless 2x run: 10/12 pass; "end turn" and "two full turns" still timed out once on the 2nd repeat (25s wait for the bot turn to return), so the randomness was not the only cause: unresolved, flagged. The 2 old log-growth failures did not show up in this run.

## Test changes (no test weakened)
- gandoe-michelle-synergy: KNOWN GAP closed; Michelle 40 MP, die 4 -> Level 2 at 0 MP.
- Deleted (rule no longer exists): phase48 "Alyssa Bulldozer comeback math" (2 cases, V4 +5 per 10 lost; 2.0 Unstoppable is an attack trigger) and level-up "Alyssa Fissa bare ability = +10 per hand cards".
- level-up "no turn trickle", turn-steps "no MP at turn start", botDriver Cless gating: now pushTestDice([3]) because Wizard/Cless roll at turn start/end (they were random).
- New tests/abilities/mosjes-deck1.test.ts (18). `npm test` 1273 pass / 4 skipped (3 runs, stable); node --check clean. Tasks 1 and 2 landed in one commit (shared registry file).

## Self-Check: PASSED
