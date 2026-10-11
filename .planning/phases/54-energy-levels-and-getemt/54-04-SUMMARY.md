---
phase: 54-energy-levels-and-getemt
plan: 04
subsystem: engine-ui-bot
tags: [energy, obby-2.0, quest, guard-test]
requires: ["54-03"]
provides:
  - "Quest attempts cost no MP in UI, engine callers and bot"
  - "UI and bot judge ability affordability against player.energy"
  - "Static no-MP-currency guard test"
affects: [56, 59, 62]
key-files:
  modified:
    - src/main.js
    - src/ui/boardRenderer.js
    - src/ui/modalManager.js
    - src/bot/botDriver.js
    - src/bot/strategy/assessQuestRisk.js
    - src/bot/strategy/README.md
    - src/rules/universal-rules.js
    - src/abilities/piecieEffects.js
    - tests/bot/strategy.test.ts
    - tests/data/mp-cost-tribute-audit.test.ts
  deleted:
    - tests/engine/quest-mp-cost.test.ts
    - tests/ui/general-quest-affordability.spec.js
key-decisions:
  - "mpCost data field kept (card faces in src/ui, Phase 59 gain at piecieEffects, marker mpcost-read-ok)"
  - "abilityCost data field kept in mosjes.js (generator-owned), no consumers left"
requirements-completed: [RULE-01]
duration: 20min
completed: 2026-10-11
---

# Phase 54 Plan 04: Remove MP currency Summary

Trying a Quest costs no MP anywhere (both main.js `loseMP(..., 'QUEST_COST')` calls, the modal 20 MP gate, the bot's cost payment and cost gates are gone). Ability buttons and the bot check `getAbilityEnergyCost` against `player.energy` and label costs in Energy. A static guard test keeps MP from becoming a currency again.

## Commits
- 445004e Quest MP cost and gates removed, Energy labels (Task 1)
- ad1b3ea guard test, V4 tests deleted (Task 2)

## Tests
- Rewritten: tests/bot/strategy.test.ts. The 20 MP refusal case now asserts a 5 MP Mosje is not refused for cost; four later cases had their input MP lowered by 20 (the old "MP at roll") so they keep their intent. tests/bot/botDriver.test.ts needed no change.
- Rewritten: tests/data/mp-cost-tribute-audit.test.ts as 4-case static guard (no `.mpCost` read without marker, no `.abilityCost`, no `loseMP` COST source outside mpManager.js, `mpCost` data field still exists). Verified it fails when `.abilityCost` is injected into botDriver.js (reverted).
- Deleted: tests/engine/quest-mp-cost.test.ts and tests/ui/general-quest-affordability.spec.js (only encoded the 20 MP rule; Phase 56 adds 2.0 Quest tests).
- npm test: 95 files / 987 tests green; node --check list clean. Playwright and sim not run.

## Deviations
- [Rule 2] The guard found `src/main.js:711` (Damage Interrupt option label "Cost: N MP"); relabelled to `cost ?? 0 Energy`.
- piecieEffects.js line ~710 got the `// mpcost-read-ok:` marker as the plan allowed.
- Bot general Quest now skips with reason `no-mosje` when no living Mosje (was `cannot-afford-cost`); unused `loseMP` import removed from botDriver.js.
- `state.advance-plan` errored (STATE.md has stale "Not started" position from before Phase 54); STATE body left for the orchestrator.

## Known Stubs
None.

## Self-Check: PASSED
