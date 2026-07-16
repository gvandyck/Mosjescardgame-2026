---
phase: 36
slug: piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-16
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (`tests/ui/`) |
| **Config file** | `vitest.config.js` / `playwright.config.js` |
| **Quick run command** | `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` |
| **Full suite command** | `npm test` (unit) then `npm run test:sim` (sim gate — `src/simulation/run-once.ts` no longer exists post-SSOT-migration, per 36-RESEARCH.md) |
| **Estimated runtime** | ~5s unit / ~25-40min sim (per STATE.md note: never pipe through `tail -N`, redirect to a file) |

---

## Sampling Rate

- **After every task commit:** `node --check` on touched files + targeted `npm test` file
- **After every plan wave:** Full `npm test` run
- **Before `/gsd:verify-work`:** Full suite green + simulation run (0 crashes, timeout rate < 25%)
- **Max feedback latency:** ~10 seconds (unit); simulation is a separate end-of-phase gate, not per-task

---

## Per-Task Verification Map

*Filled in by the planner per task — see individual PLAN.md files for the concrete Task ID / Requirement / Automated Command mapping.*

---

## Wave 0 Requirements

- Existing infrastructure (vitest + Playwright `tests/ui/cards/` card-test-library) covers all phase requirements — no new framework needed. New tests for the tribute-charging mechanism and the ~44 corrected `mpCost: 0` cards should extend `tests/ui/cards/` (real-engine assertions) per this project's "tests that matter test the REAL engine" rule.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tribute payer-picker modal (D-05) shows correct on-field Mosje list and blocks on insufficient MP (D-06) | TBD (payer-picker UI task) | Modal interaction requires a live browser session; `showMosjeSelect`-style pickers are not exercised by vitest unit tests | Seed a game via Playwright + `window.__testHooks`, activate a ruled tribute card with 2+ Mosjes on field, confirm picker lists all eligible Mosjes, confirm activation blocked when the only Mosje can't afford the amount |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s (unit tier)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-16 (gsd-plan-checker verification pass — all Dimension 8 checks green across 36-01 through 36-04)
