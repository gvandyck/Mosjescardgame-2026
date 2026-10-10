---
phase: 54
slug: energy-levels-and-getemt
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-11
---

# Phase 54 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `54-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 (node env) + Playwright 1.60.0 (headless only) |
| **Config file** | `vitest.config.ts`; `playwright.config.js` |
| **Quick run command** | `npx vitest run tests/engine tests/data` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** `node --check <touched src files>` + `npx vitest run <the plan's test files>`
- **After every plan wave:** `npm test` + the CLAUDE.md `node --check` list
- **Before `/gsd:verify-work`:** full suite green; headless Playwright subset (entry-protection, deckout-banner, cardv1-mosje, 5-card piecie-effects sample); Node bot-vs-bot smoke on the Example Decks stands in for the sim (full sim not run — old deck ids until Phase 64)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| RULE-01 (E1) | Energy 2 / +1 / cap 6 / carry-over / refuse overpay | unit | `npx vitest run tests/engine/energy.test.ts` | ❌ W0 | ⬜ pending |
| RULE-01 | Activations charge `cost`, refuse when short; free activations free | unit | `npx vitest run tests/engine/energy-charging.test.ts` | ❌ W0 | ⬜ pending |
| RULE-01 | No MP spent anywhere (guard + Welloe Force) | unit | `npx vitest run tests/data/mp-cost-tribute-audit.test.ts tests/abilities/welloe-force-tribute.test.ts` | ✅ rewrite | ⬜ pending |
| RULE-02 (E3, E7b) | Level-up at 100 → 0, any source; L3 capped at 95 | unit | `npx vitest run tests/engine/level-up.test.ts` | ❌ W0 | ⬜ pending |
| RULE-02 | Single slot factory, Level 1 at startMP | unit | `npx vitest run tests/engine/mosje-slot-factory.test.ts tests/ui/card-v1-mosje.test.ts` | ❌ W0 / ✅ | ⬜ pending |
| RULE-02 (E14) | `getPower` floor 0 | unit | `npx vitest run tests/engine/get-power.test.ts` | ❌ W0 | ⬜ pending |
| RULE-03 (E4–E6) | Getemt L2/L3 → 50; L1 sideways → Welloe; loss reduced to 0 = no getemt | unit | `npx vitest run tests/engine/getemt.test.ts` | ❌ W0 | ⬜ pending |
| RULE-04 (E7) | Win only at owner's next turn start | unit | `npx vitest run tests/engine/hold-level-3-win.test.ts` | ❌ W0 | ⬜ pending |
| RULE-04 (E8) | Lose with no Mosje outside Welloe pile | unit | `npx vitest run tests/engine/no-mosje-left-loss.test.ts` | ❌ W0 | ⬜ pending |
| RULE-09 (E27) | MP %5 ≥0, Power %10 ≥0 after all operations | unit | `npx vitest run tests/engine/mp-grid-invariants.test.ts tests/engine/mp-five-grid.test.ts` | ❌ W0 / ✅ | ⬜ pending |
| RULE-09 | Loss order base → reducers → cap → round/floor → no-loss | unit | `npx vitest run tests/engine/loss-pipeline-order.test.ts` | ❌ W0 | ⬜ pending |
| guard | No direct `.mp +=/-=` outside allow-list | unit | `npx vitest run tests/engine/no-direct-mp-writes.test.ts` | ❌ W0 | ⬜ pending |
| guard | Ronald Kip stacking stays on grid, levels up at 100 | unit | `npx vitest run tests/engine/ronald-kip-stacking.test.ts tests/engine/food-double-synergy.test.ts` | ❌ W0 / ✅ | ⬜ pending |
| smoke | Example-Deck bot games never throw; invariants hold each turn | integration | `npx vitest run tests/bot/offlineGame.smoke.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New engine test files listed above (red first)
- [ ] Shared builder `tests/helpers/makeEngineState.js` (2 players, `energy: 6`, `welloePile: []`; slots via `createMosjeSlot` from 54-05) — a `.js` file so vitest (`tests/**/*.ts`) never collects it (54-01)
- [ ] Playwright cards hook `setEnergy` + `energy: 6` default in `tests/ui/cards/card-test-runner.js`

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
