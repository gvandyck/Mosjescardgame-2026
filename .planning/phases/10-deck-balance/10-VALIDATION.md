---
phase: 10
phase-slug: deck-balance
date: 2026-05-30
---

# Phase 10 — Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Quick run | `npm test` |
| Full suite | `npm test` |
| Simulation | `node --loader ts-node/esm src/simulation/run-once.ts` |

---

## Requirements → Test Map

| Req ID | Behavior Under Test | Test Type | Command | File |
|--------|---------------------|-----------|---------|------|
| BAL-01 | Equipment MP scales 15/25/40 by Mosje level; Digital Mosje required for bonus | unit (effect) | `npm test` | `tests/effects/equipment-scaling.test.ts` |
| BAL-01 | Non-Digital Mosje gets flat 5 MP from Equipment cards | unit (effect) | `npm test` | `tests/effects/equipment-scaling.test.ts` |
| BAL-02 | Physical Force deck contains `piecie_grammetje_pieter` and `piecie_tikker` | unit (data) | `npm test` | `tests/data/deck-balance.test.ts` |
| BAL-02 | `effect_tikker` gives flat +40 MP (not roll×5) | unit (effect) | `npm test` | `tests/effects/equipment-scaling.test.ts` |
| BAL-02 | `effect_tikker` sets `QUEST_BLOCKED` status on active Mosje | unit (effect) | `npm test` | `tests/effects/equipment-scaling.test.ts` |
| BAL-02 | `canAttemptGeneralQuest` returns false when QUEST_BLOCKED in statusEffects | unit (quest) | `npm test` | `tests/effects/equipment-scaling.test.ts` |
| BAL-03 | Artistic Rhythm deck contains `piecie_larry_zegeltje` and `piecie_grammetje_pieter` | unit (data) | `npm test` | `tests/data/deck-balance.test.ts` |
| BAL-04 | All 44 quests have successMP ≥ original + 20 | unit (data) | `npm test` | `tests/data/deck-balance.test.ts` |
| BAL-04 | No quest has failMP worse than -20 | unit (data) | `npm test` | `tests/data/deck-balance.test.ts` |
| BAL-05 | When deck is empty during draw, discard is reshuffled into deck | unit (engine) | `npm test` | `tests/engine/deck-out.test.ts` |
| BAL-05 | Deck-out sets `player.skipNextTurn = true` | unit (engine) | `npm test` | `tests/engine/deck-out.test.ts` |
| BAL-05 | Player with `skipNextTurn = true` has their turn skipped entirely and flag cleared | unit (engine) | `npm test` | `tests/engine/deck-out.test.ts` |

---

## Sampling Rate

| Gate | Command |
|------|---------|
| After each task commit | `npm test` |
| After each wave | `npm test` |
| Phase gate (before verify-work) | Full suite green + simulation 0 crashes |

---

## Wave 0 Gaps (new test files to create)

- [ ] `tests/engine/deck-out.test.ts` — BAL-05 draw phase + skipNextTurn behavior
- [ ] `tests/effects/equipment-scaling.test.ts` — BAL-01 Equipment MP by level and subtype; BAL-02 Tikker +40 MP + QUEST_BLOCKED + questLogic guard
- [ ] `tests/data/deck-balance.test.ts` — BAL-02 through BAL-04 data integrity checks

These are created in Plan 01 as `it.todo()` scaffolds, then filled in Plans 03 and 04.

---

## Regression Protection

The following existing tests must remain green after every change:

- Ronald Kip stacking test (quest MP changes touch the same MP reward system)
- Full suite: `npm test` — 617 tests currently passing; no regressions permitted

---

## Security Domain

This phase makes no network calls, authentication changes, input validation changes, or cryptographic operations. No ASVS categories apply.
