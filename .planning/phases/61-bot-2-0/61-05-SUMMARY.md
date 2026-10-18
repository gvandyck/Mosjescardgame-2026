---
phase: 61-bot-2-0
plan: 05
requirements: [BOT-01, BOT-02]
commits: [a124dce, f2411c0, b8091b1, bfc1740]
---
# Phase 61 Plan 05: Sensible, legal Piecie use (BOT-01, BOT-02)

- `planPiecieActivations` keeps a ready Piecie only when `piecieActivationGate` passes (Jeffrey givesMP, Level 2, Only if / Needs), the new `isUsefulActivation` says yes, and it fits the running Energy budget (`getBotPaymentCost`, Delluft fee included, `intent.budget` or the player's Energy). The `opponentFullyProtected` hold is gone (botDriver no longer computes it); the driver re-judges `isUsefulActivation` before each call because earlier activations change the table.
- `isUsefulActivation` skips: a Power boost with no Mosje that can still attack a valid target; a plain MP gain nobody can receive (every Mosje at Level 3 / 95, or The Void on a non-fresh Mosje; draw / attack / power / pet cards are exempt); a hit with no legal non-fresh target (Harde Didde 40 MP or less, Klaar Met Jou 30 or less); a Place destroyer unless the opponent played the Place; a self-loss that would knock a Mosje out. Amounts live in `cardAmounts.js` (data).
- `comboTags.js` re-tagged from the Card List: roles `power`, `place-destroy`, `self-loss` added; stale ids `piecie_dubbele_dosis` / `piecie_shoettoe` replaced by the real ids (`piecie_quest_prep`, `piecie_energy_surge`); `piecie_chefs_special` tagged; a test asserts every key exists in `piecies.js`.
- `pickOwnSlotByRole` (new) + `pickBotOwnTarget`: Power boost to a Mosje that can still attack (real `getPower`, boosts count); self-loss to the Mosje that absorbs it (Straffoe's own 5 MP too); pet to an own Level 3; MP gain to a Level 3 at or below `opponentThreat` first, else the biggest level-up; sideways last, Void-blocked Mosjes passed over. `pickMosjeOption` answers 'mosje' pauses (opponent: the hit that hurts most, Level 3 on ties; own: self-loss or gain rule); `chooseTriggerChoice` hands them over.
- Tests: `strategy.test.ts` fixture moved to the 2.0 table, old assertions untouched, plus budget / gate / useless-card / order cases; `bot-targets.test.ts` (27) new. `isUsefulActivation`, `pickMosjeOption`, `pickOwnSlotByRole` are in the BOT-04 TRAP_TABLE. Mutations checked: no budget or no gate each fail tests.
- Deviations (no rule change): (1) `tests/engine/no-active-mosje.test.ts` "non-gain effect -> higher Power" used `effect_stripje_bennies`, which is a self-loss card in 2.0 (picking the highest Power would cost the Level 3 a level); the same fixture and `toBe(1)` now use `effect_te_hard_gaan`. (2) A quest-prep Piecie that also gains MP or draws (Controller, Skipping Rope) is no longer held back when no Quest follows. (3) botDriver `playPriority` treats `power` like `attack` for slot claiming.
- `npm test` 160 files / 1935 green; `node --check` clean per file; no Playwright, no sim. BOT-01 / BOT-02 stay unticked (61-08 / 61-09 carry them). No KNOWN GAPs.

## Self-Check: PASSED
