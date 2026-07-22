---
phase: 39-gandoe-michelle-synergy
plan: 01
subsystem: card-engine-tests
tags: [mosjes, synergy, quests, mp, playwright, vitest, repro-first]

provides:
  - "Repro-first browser spec for DUO_GANDOE_MICHELLE two-way synergy"
  - "Fast engine unit spec for resolveQuest-driven Gandoe/Michelle synergy behavior"
affects: ["39-02 (questLogic.js wiring)"]

key-files:
  created:
    - tests/ui/cards/gandoe-michelle-synergy.spec.js
    - tests/engine/gandoe-michelle-synergy.test.ts
  modified: []

requirements-completed: [D-01, D-02, D-03, D-04, D-05]
completed: 2026-07-18
---

# Phase 39 Plan 01: Gandoe/Michelle Synergy Repro-First Summary

Plan 39-01 is complete. It adds RED-first browser and engine coverage for the DUO_GANDOE_MICHELLE
headline synergy without touching production source.

## Accomplishments

- Created `tests/ui/cards/gandoe-michelle-synergy.spec.js`, driving the real browser game through
  `window.__testHooks` and the full General Quest modal flow.
- Created `tests/engine/gandoe-michelle-synergy.test.ts`, calling exported `resolveQuest` and
  `getPartnerSynergyQuestBonus` with deterministic `Math.random` stubs.
- Covered Michelle -> Gandoe roll-5 +10, roll-4 threshold guard, Gandoe Wizard recipient guard,
  D-03 no-level-up behavior, and Gandoe -> Michelle Physical Quest +15.

## Decisions

- Used `quest_shotje_obby` for the browser repro instead of the plan's candidate
  `quest_leap_of_faith`, because `quest_leap_of_faith` is Resilient, not Physical. `quest_shotje_obby`
  is a Physical General Quest with a 4+ threshold and +65 MP reward, so roll 4 and roll 5 both
  succeed while still isolating the synergy deltas.
- The browser helper clicks the full modal path: pay intent, Mosje picker, `#modal-attempt`,
  `#modal-roll`, and `#modal-done`. This keeps the RED failures about missing synergy wiring, not
  an unfinished modal interaction.
- No `src/` files were modified in this plan.

## Verification

- `node --check tests/ui/cards/gandoe-michelle-synergy.spec.js` passed.
- `npm test -- gandoe-michelle-synergy` is RED as expected: 3 failed, 2 passed.
  - Missing Michelle roll-5 +10 to Gandoe Destroyer: expected 50, received 40.
  - Missing D-03 no-level-up kicker effect: expected 100, received 95.
  - Missing Gandoe/Michelle partner synergy row: expected 15, received 0.
- `npx playwright test tests/ui/cards/gandoe-michelle-synergy.spec.js` is RED as expected:
  2 failed, 2 passed.
  - Scenario A: Gandoe delta after Michelle roll 5 expected 10, received 0.
  - Scenario D: Gandoe Physical Quest with Michelle present expected 90, received 75.

## Next

Proceed to `39-02-PLAN.md`: wire the Gandoe/Michelle `PARTNER_QUEST_SYNERGIES` row and the
Michelle Tough Gamble roll-5 Gandoe kicker in `src/abilities/questLogic.js`, then flip these tests
GREEN and run the MP-touching verification gate.
