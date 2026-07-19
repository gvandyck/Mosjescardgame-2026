# 40-01 Summary - Deck Mosje Ability Reconciliation

**Status:** COMPLETE
**Date:** 2026-07-18
**Branch:** `plan/phase-40-deck-ability-reconciliation`
**Commit/push:** Not performed.

## Outcome

Phase 40's three player-facing deck abilities are verified and documented:

- **Chris All-Rounder - Perfect Setup:** once per turn, 3+ face-down Piecies
  are required; the player chooses one to activate for free; no MP is gained.
- **Jisca - Perfect Combo:** once per turn roll 1d6; 1-4 has no effect; 5-6
  activates or re-triggers any chosen field Piecie for free.
- **Coert KasteLuck - Morning Luck:** passive turn-start d6 roll; 4-6 grants
  one same-turn activation to the next Piecie played that turn.

No gameplay source change was needed during Plan 40-01. The roadmap had been
generated from a stale todo line, while the correct implementations already
existed in ancestor commits:

- `56fc3b4` - Chris All-Rounder
- `1de1ee5` - Jisca
- `a28edce` - Coert KasteLuck

The plan synchronized `docs/card-reference.md`, corrected the stale todo status,
and added the Phase 40 GSD context and closeout records.

## Verification

- Runtime `node --check` - passed for `mosjeAbilities.js`, `turnManager.js`,
  `main.js`, and `mosjes.js`.
- Focused Vitest - 2 files, 50/50 tests passed.
- Focused live Playwright card chains - 3/3 passed:
  - Chris Perfect Setup activated Kannetje Melk (+25 MP).
  - Jisca roll 6 activated Kannetje Melk (+25 MP).
  - Coert Morning Luck granted real same-turn activation (+25 MP).
- `npm run validate` - passed; lint exited successfully with the existing
  warning baseline and all 71 files / 676 tests passed.
- `npm run test:cards` - baseline result: 57 passed, 9 skipped, 2 known
  unrelated failures (`mosje_amplifier`, `mosje_binti_creator`). Ronald Kip
  stacking passed at +50 MP. Output:
  `.planning/audits/phase40-test-cards-output.txt`.

## Simulation

A fresh `npm run test:sim` attempt exceeded the command's 15-minute ceiling and
was terminated after 15 scenarios: 11 passed, 4 hit existing timeout-style
failures, and 0 crashes were observed. Partial output:
`.planning/audits/phase40-test-sim-output.txt`.

No Phase 40 gameplay source changed, so the completed Phase 39 run remains the
broad simulation baseline for the same runtime source state: 154/160 passed,
6 timeout/click-overlay failures (3.75%), and 0 crashes. Its 100-game deck
matrix reported CY 50%, JA 65%, and CB 40%; JA and CB remain balance-review
candidates rather than silent rebalance targets.

## Safety

All work stayed on `plan/phase-40-deck-ability-reconciliation`. Existing Phase
39 and user working-tree changes were preserved. No commit, push, merge, rebase,
branch deletion, PR, or `main` update was performed.

