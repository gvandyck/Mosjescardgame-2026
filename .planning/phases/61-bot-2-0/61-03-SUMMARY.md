---
phase: 61-bot-2-0
plan: 03
requirements: [BOT-01]
commits: [be86f3b, 40cdf98]
---
# Phase 61 Plan 03: Bot value model (BOT-01 groundwork)

- Five tiny pure files in `src/bot/strategy/`, one export each: `botValues.js` (BOT_VALUES, data only: LEVEL_BONUS [0, 25, 200], SIDEWAYS_PENALTY 25, WELLOE_WORTH -145, L3_MP_CAP 95), `slotWorth`, `valueOfGain`, `valueOfLoss`, `opponentThreat`. Bot valuation only, no rule changed.
- `slotWorth(slot)` = (level - 1) * 100 + MP + level bonus - sideways penalty; null or defeated = Welloe pile (-145).
- `valueOfGain` follows the 2.0 level rule (100 MP -> next level at 0 MP, Level 3 stops at 95, amount on the 5-grid via `roundToFive`); `valueOfLoss` follows getemt (loss to 0 or below: Level 2-3 -> one level down at 50 MP, Level 1 -> sideways at 0, sideways -> Welloe). Both work on plain copies; neither imports an engine mutator (grep for the gain / getemt helpers is empty).
- `opponentThreat(state, botId)` projects with `asBotView`, sums engine `getPower` (level row, Place, boosts) over the opponent's upright, non-defeated Mosjes; a fresh one counts, a sideways one does not. Added to the BOT-04 TRAP_TABLE and to the "projects with `asBotView(`" presence check in `tests/bot/no-hidden-info.test.ts`.
- `tests/bot/bot-values.test.ts` (43 tests): every number from the plan plus extras (zero / negative amounts, off-grid rounding, defeated slot, sideways level-up, input never mutated, Gym bonus not applied to a fresh Mosje). RED commit failed on the missing modules first, then GREEN.
- Small extra, same intent: an `isDefeated` slot gains / loses nothing (mirrors the engine's own gain guard); `valueOfGain` / `valueOfLoss` of a null slot is 0.
- `npm test` 159 files / 1845 green; `node --check` clean per file; no Playwright. No KNOWN GAPs.

## Self-Check: PASSED
