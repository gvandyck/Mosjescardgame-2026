---
phase: 48
slug: original-requirement-verification-backfill-for-phases-01-06
status: signed-off
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-20
signed_off: 2026-07-20
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
| 48-gapfill | 48-05 | 1 | BUG-05 / IMPL-AR-M1 | `ability_dj_8020_lucky_beats` observable effect asserted; fails if ability deleted | unit | `npm test` | ✅ `tests/abilities/phase48-mosje-ability-verification.test.ts` | ✅ green |
| 48-gapfill | 48-01..48-05 | 1 | ~40 confirmed gaps across all buckets (effect_snoeiertje, effect_dikke_taks, effect_warm_kannetje_melk, effect_dubbele_ding, effect_bijna_welloe, effect_dubbele_temminks, Alyssa/Jeffrey Mosje abilities, 10 Place/Quest rows, etc.) | each effect's MP/lifecycle/quest outcome asserted; false-green guard (D-02) | unit / browser card test | `npm test` | ✅ 5 new gap-fill test files | ✅ green (745/745) |
| 48-map | 48-01..48-05 | 1 | all 64 rows (Piecies/Snelle/Places/Quests/cross-cutting/Mosje/BUG) | two-pronged grep (card-id string AND effect/ability fn name) locates qualifying test or confirms GAP | evidence-map | grep + read | ✅ existing | ✅ complete — see `48-VERIFICATION.md` |
| 48-consolidate | 48-06 | 2 | all 64 rows | consolidated 1:1 traceability matrix, honest dispositions, REQUIREMENTS.md ticks match | doc | grep unique-id count, `npm test`, `node --check`, Ronald Kip Playwright check | ✅ `48-VERIFICATION.md` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Confirm existing vitest + Playwright infra runs green (`npm run validate` = 705/705) before mapping begins — baseline for "no regressions introduced by new tests."
- [x] New gap-fill tests land in the existing `tests/` tree (no new framework/config).

*Existing infrastructure covers all phase requirements — no install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Honest disposition judgement (VERIFIED / SUPERSEDED / GAP-DESCOPED) | all 64 rows | Requires human/tester judgement of whether cited evidence is truly qualifying (D-01/D-02) and whether a diverged card's current behavior fulfills original intent (D-08) | Reviewer reads each `48-VERIFICATION.md` row; confirms cited test asserts the outcome (not just card-loads) and would fail if mechanic broke |
| BUG-01 residual runtime claim ("stale activeMosje") | BUG-01 | Ledger cites a runtime symptom; confirm existing `quest-threshold.test.ts` covers the assertion or flag as FINDING | Read `main.js:541` debug-log context + git history before ticking |

---

## Validation Sign-Off

- [x] Every VERIFIED row in `48-VERIFICATION.md` cites `file::test` (or `file:line` for browser card-registry rows) with a real behavioral assertion
- [x] Every new gap-fill test fails if its target effect/ability is deleted (D-02 false-green guard) — confirmed per-fragment during Waves 1-5
- [x] `npm test` stays green (745/745 — 705 baseline + 40 Phase-48 gap-fill tests) after all new tests land; `node --check` clean; Ronald Kip Playwright stacking check (`piecie_ronald_kip`) re-run live, 1 passed (ownΔ=50)
- [x] No src/ runtime changes (D-04) — `git diff --stat -- src` confirmed empty; the two residual coverage notes (Varkenspootjes MP-swing, BUG-01 rationale) are flagged, not silently claimed closed
- [x] `nyquist_compliant: true` set once sign-off complete

**Approval:** signed off 2026-07-20 — Phase 48 Plan 06 (consolidation + phase-gate verification)
