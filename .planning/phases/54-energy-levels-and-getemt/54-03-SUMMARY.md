---
phase: 54-energy-levels-and-getemt
plan: 03
subsystem: engine
tags: [energy, obby-2.0, abilities, turn-manager]
requires: ["54-02"]
provides:
  - "ABILITY_ENERGY_COSTS map and getAbilityEnergyCost lookup"
  - "useMosjeAbility checks Energy before and pays it after a successful ability"
affects: [54-04, 58]
key-files:
  created:
    - src/rules/abilityEnergyCosts.js
    - src/engine/energy/getAbilityEnergyCost.js
    - tests/data/ability-energy-costs.test.ts
  modified:
    - src/engine/turnManager.js
    - src/abilities/mosjeAbilities.js
    - tests/engine/energy-charging.test.ts
key-decisions:
  - "Decision 4: ability Energy costs live in src/rules/abilityEnergyCosts.js, not mosjes.js (generator-owned, untouched)"
  - "In-effect Energy list for Phase 58 (EFX-01): ability_ming_predictor_future_sight (optional 1) and ability_jeffrey_gambler_high_stakes (stake 1-2); charged 0 up front"
requirements-completed: []
duration: 15min
completed: 2026-10-11
---

# Phase 54 Plan 03: Ability Energy Costs Summary

Activated Mosje abilities now cost their printed Energy: refused with 'Not enough Energy' when short, paid only after the ability succeeds (thrown or failed abilities cost nothing). Gandoe Destroyer (4), Ronald Strategic Insight (2) and Youri Speed Activate (1) no longer take MP.

## Commits
- d8e34e2 cost map, lookup, data test (Task 1)
- 9dd0c04 useMosjeAbility charging, MP payments removed (Task 2)

## Tests
- New: tests/data/ability-energy-costs.test.ts (4 cases, regex-guards map against Card List texts; no extra abilities found beyond the plan's map)
- Added 7 ability cases to tests/engine/energy-charging.test.ts
- Rewritten to 2.0: ronald-chef-lock.test.ts (no MP charged, low-MP case now succeeds), youri-chris-synergy.test.ts (no MP deducted, low MP succeeds), entry-protection.test.ts Elimination Strike case (asserts Energy untouched)
- Fixtures given `energy: 6`: entry-protection.test.ts, stub-engine-wiring.test.ts (the other listed files already passed)
- npm test: 96 files / 997 tests green; node --check list clean.

## Deviations
None. Note: canPay requires an integer `energy`, so hand-built players without `energy` now fail even cost-0 abilities; fixtures were updated.

## Self-Check: PASSED
