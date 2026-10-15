---
phase: 58-mosje-abilities-and-synergies
verified: 2026-10-15T00:00:00Z
status: human_needed
score: 5/5 must-haves verified (automated)
---

# Phase 58 Verification

**Goal:** Every Mosje does what its Card List text says, activated abilities paid in Energy.

| # | Success criterion | Status | Evidence |
|---|---|---|---|
| 1 | 32 Mosjes have real-game card tests | VERIFIED (static) | mosje-registry-2-0.js (30 ids) + -rest.js (29 ids); mosje-cards-2-0.spec.js, mosje-chains-2-0.spec.js. Browser specs not run (no headed browser). |
| 2 | Activation costs Energy, refused if unaffordable | VERIFIED | turnManager.js:900-931 canPay then payEnergy; energy-charging.test.ts |
| 3 | Synergy w/ and w/o partner, Chamber, free-activation no chain | VERIFIED | synergy-2-0.test.ts, place-synergy-chamber.test.ts, mosje-chains-2-0.spec.js; Michelle one gain (80, Level 2 / 0 MP) asserted in gandoe-michelle-synergy.test.ts:76 |
| 4 | Tactician 10-75 snap back | VERIFIED | tests/engine/tactician.test.ts (E26) |
| 5 | E1-E30 pass | VERIFIED | tests/meta/e-tests-index.test.ts passes |

`npm test` run twice: 143 files, 1453 passed, 3 skipped, 0 failed both times. `node --check` clean on all 6 UI files. No ability found spending MP as a cost (energy paths only).

## Human verification
- Run the Playwright mosje-*-2-0 specs (card tests boot the real game; not run here).
- Known flaky Affoe-getemt spec is tracked for Phase 59, not a Phase 58 gap.
