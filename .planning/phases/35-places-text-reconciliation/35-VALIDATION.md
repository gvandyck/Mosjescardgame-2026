---
phase: 35
slug: places-text-reconciliation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.4 (unit) + Playwright 1.60 (browser/card-behavior/sim) |
| **Config file** | `vitest.config.js` (unit), `playwright.config.*` (browser projects: `visual`, `sim`, `cards`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run test:cards && npm run test:sim` |
| **Estimated runtime** | ~90s unit + ~3-5min cards/sim (workers=1) |

**Correction to CLAUDE.md:** the `node --loader ts-node/esm src/simulation/run-once.ts` command referenced in CLAUDE.md's MP-caution section no longer exists (directory removed in the SSOT migration). Use `npm run test:sim` instead — this is a stale-doc correction, not a new discovery to re-verify.

---

## Sampling Rate

- **After every task commit:** `node --check` on touched files (extend CLAUDE.md's list with `src/abilities/placeEffects.js`, `src/data/places.js`, and any touched Piecie/quest file) + `npm test`
- **After every MP-touching card (PLACE-01, 02, 03, 04, 05, 08, 09, 11):** additionally `npm run test:cards` (Ronald Kip stacking entry) + `npm run test:sim`
- **After every plan wave:** full suite (`npm test && npm run test:cards && npm run test:sim`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~300 seconds (sim run is the slow path)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 0 | PLACE-01 | — | N/A | engine unit + card-registry | `npm test` + `npm run test:cards` | ❌ Wave 0 — no `place_bank_chilling` entry in `card-registry.js` | ⬜ pending |
| 35-01-02 | 01 | 0 | PLACE-02 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-03 | 01 | 0 | PLACE-03 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-04 | 01 | 0 | PLACE-04 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-05 | 01 | 0 | PLACE-05 | — | N/A | engine unit (dead-code removal + pool-visibility check) | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-06 | 01 | 0 | PLACE-06 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-07 | 01 | 0 | PLACE-07 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-08 | 01 | 0 | PLACE-08 | — | N/A | engine unit through dispatcher | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-09 | 01 | 0 | PLACE-09 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-10 | 01 | 0 | PLACE-10 | — | N/A | engine unit + dice-bonus check | `npm test` (+ manual/Playwright for main.js dice flow) | ❌ Wave 0 | ⬜ pending |
| 35-01-11 | 01 | 0 | PLACE-11 | — | N/A | engine unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 35-01-12 | 01 | 0 | PLACE-12 | — | N/A | engine unit (dead-code removal + pool-visibility check) | `npm test` | ❌ Wave 0 | ⬜ pending |

*Task IDs above are placeholders — actual IDs assigned by the planner once plans are split into waves.*

**Post-revision note (this session):** plans 35-06 (PLACE-11, Synergy Chamber) and 35-07 (PLACE-05
Drain Zone, PLACE-12 The Void) are confirmed MP-touching and now carry the mandatory
`npm run test:cards` (Ronald Kip stacking) + `npm run test:sim` gates on every task that changes
live MP behavior, matching the pattern already used in 35-01/35-02/35-04/35-05. See 35-06-PLAN.md
Tasks 1-2 and 35-07-PLAN.md Task 1.

---

## Wave 0 Requirements

- [x] `tests/ui/cards/card-registry.js` — add entries for the 10 in-scope Place cards (PLACE-01 through 04, 06-11) so card-behavior tests can drive them through the real dispatcher (`resolvePlaceEffect`/`startTurn`/`endTurn`), per CLAUDE.md's "test the REAL engine" rule and Success Criterion 5's dispatcher-level proof requirement. Planner may choose engine-unit tests instead per-card where dispatcher coverage isn't the natural shape (see RESEARCH.md "Wave 0 Gaps").
- [x] Pool-visibility test for PLACE-05 (Drain Zone) and PLACE-12 (The Void) confirming both are unreachable from deck-building, boosters, and starter decks after the hide.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skiffa dice-roll UI bonus display | PLACE-10 | Dice-roll UI feedback for the +2 bonus is a main.js DOM flow not easily asserted via Playwright selectors per existing patterns | Play a Social quest with Skiffa active, confirm dice roll UI shows +2 applied for all players |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 300s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-07-14, post-revision — Ronald Kip stacking gates confirmed wired into every MP-touching plan, including 35-06 and 35-07)
