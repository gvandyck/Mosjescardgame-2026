---
phase: 48
slug: original-requirement-verification-backfill-for-phases-01-06
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-20
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 48 is a tests-only verification-backfill phase: its "validation" is that
> every requirement disposition in `48-VERIFICATION.md` is backed by a real,
> qualifying passing test (D-01/D-02), and that every newly written gap-fill test
> genuinely fails if the mechanic is deleted.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit: `tests/effects`, `tests/abilities`, `tests/engine`, `tests/data`) + Playwright (browser card-test-library: `tests/ui/cards`) |
| **Config file** | `vitest.config.*` / `playwright.config.*` (existing — no Wave 0 install) |
| **Quick run command** | `npm test` (unit suite) |
| **Full suite command** | `npm run validate` (currently 705/705 green) |
| **Estimated runtime** | ~unit seconds; full validate longer (see project scripts) |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (or the targeted new test file).
- **After every plan wave:** Run `npm run validate` — must stay 705/705 + new tests green.
- **Before `/gsd:verify-work`:** Full `npm run validate` green; new gap-fill tests all pass.
- **Max feedback latency:** unit-suite runtime (seconds).

---

## Per-Task Verification Map

Because this phase's deliverable is a traceability matrix (not runtime features),
each requirement row is "validated" by citing a qualifying test OR by adding one.
The per-requirement map lives in `48-VERIFICATION.md`; this table captures the
**gap-fill test tasks** that must produce a new green test.

| Task ID | Plan | Wave | Requirement | Secure/Correct Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-------------------------|-----------|-------------------|-------------|--------|
| 48-gapfill | (per plan) | ≥1 | BUG-05 / IMPL-AR-M1 | `ability_dj_8020_lucky_beats` observable effect asserted; fails if ability deleted | unit | `npm test` | ❌ W0 (new) | ⬜ pending |
| 48-gapfill | (per plan) | ≥1 | ~9 confirmed gaps (effect_snoeiertje, effect_dikke_taks, effect_warm_kannetje_melk, effect_dubbele_ding, effect_bijna_welloe, effect_dubbele_temminks, Alyssa/Jeffrey Mosje abilities) | each effect's MP/lifecycle/quest outcome asserted; false-green guard (D-02) | unit / browser card test | `npm test` / card-test-library | ❌ W0 (new) | ⬜ pending |
| 48-map | (per plan) | 1 | remaining ~34 rows (Places/Quests) | two-pronged grep (card-id string AND effect/ability fn name) locates qualifying test or confirms GAP | evidence-map | grep + read | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm existing vitest + Playwright infra runs green (`npm run validate` = 705/705) before mapping begins — baseline for "no regressions introduced by new tests."
- [ ] New gap-fill tests land in the existing `tests/` tree (no new framework/config).

*Existing infrastructure covers all phase requirements — no install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Honest disposition judgement (VERIFIED / SUPERSEDED / GAP-DESCOPED) | all 64 rows | Requires human/tester judgement of whether cited evidence is truly qualifying (D-01/D-02) and whether a diverged card's current behavior fulfills original intent (D-08) | Reviewer reads each `48-VERIFICATION.md` row; confirms cited test asserts the outcome (not just card-loads) and would fail if mechanic broke |
| BUG-01 residual runtime claim ("stale activeMosje") | BUG-01 | Ledger cites a runtime symptom; confirm existing `quest-threshold.test.ts` covers the assertion or flag as FINDING | Read `main.js:541` debug-log context + git history before ticking |

---

## Validation Sign-Off

- [ ] Every VERIFIED row in `48-VERIFICATION.md` cites `file::test` with a real behavioral assertion
- [ ] Every new gap-fill test fails if its target effect/ability is deleted (D-02 false-green guard)
- [ ] `npm run validate` stays green (≥705 + new tests) after all new tests land
- [ ] No src/ runtime changes (D-04) — any defect recorded as a FINDING, not patched
- [ ] `nyquist_compliant: true` set once sign-off complete

**Approval:** pending
