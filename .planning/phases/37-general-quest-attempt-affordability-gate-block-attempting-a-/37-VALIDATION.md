---
phase: 37
slug: general-quest-attempt-affordability-gate-block-attempting-a
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-16
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (`tests/ui/`) |
| **Config file** | `vitest.config.js` / `playwright.config.js` |
| **Quick run command** | `node --check src/main.js src/ui/modalManager.js src/abilities/questLogic.js` |
| **Full suite command** | `npm test` (unit) then `npm run test:sim` (sim gate; `src/simulation/run-once.ts` is gone post-SSOT — use `npm run test:sim`) |
| **Estimated runtime** | ~5s unit / ~25-40min sim (redirect sim output to a file, never pipe through `tail -N` per STATE.md) |

---

## Sampling Rate

- **After every task commit:** `node --check` on touched files + targeted `npm test` file
- **After every plan wave:** full `npm test`
- **Before `/gsd:verify-work`:** full suite green; the browser repro spec (single-Mosje < 20 MP attempting a General Quest) must fail on pre-fix code and pass after — the core proof per CLAUDE.md's reproduce-first rule
- **Max feedback latency:** ~10 seconds (unit tier)

---

## Per-Task Verification Map

*Filled in by the planner per task — see individual PLAN.md files for the concrete Task ID / Requirement / Automated Command mapping.*

---

## Wave 0 Requirements

- Existing infrastructure (vitest + Playwright `tests/ui/`) covers all phase requirements — no new framework needed. The new work is: a browser repro spec proving the General-Quest single-Mosje self-destruct (make-it-fail-first), a passing post-fix version of that spec, and a Personal-Quest regression check confirming its picker still gates. Extend `tests/ui/` (real-engine, Playwright) per this project's "tests that matter test the REAL engine" rule.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The General-Quest attempt control is visibly greyed/disabled when the sole Mosje has < 20 MP (D-02) | TBD (gate UI task) | Disabled visual state on the attempt trigger requires a live browser render | Seed a game (Playwright + `window.__testHooks`) with one Mosje at 10 MP, reach a General Quest, confirm the attempt control is disabled and no 20 MP is charged / no defeat occurs |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s (unit tier; the ~25-40min sim gate in 37-02 Task 2 is the mandated MP-touching-change gate per CLAUDE.md, not a per-task loop)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-16 (gsd-plan-checker verification pass — Dimension 8 checks green across 37-01/37-02)
