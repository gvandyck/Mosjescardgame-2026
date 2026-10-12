---
phase: 56-attacking-and-quests
verified: 2026-10-12T18:10:00Z
status: passed
score: 5/5 success criteria verified
---

# Phase 56: Attacking and Quests Verification

**Goal:** Each Mosje takes one action per turn: attack with Power or try one of 3 typed Quests.

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Attack by Power, fresh/levelled untargetable, triggers | VERIFIED | tests/engine/attack.test.ts, attack-triggers.test.ts |
| 2 | Attack and Quest mutually exclusive | VERIFIED | one-action.test.ts; canMosjeAct (src/engine/mp/canMosjeAct.js) enforced in turnManager and botDriver (engine-level gate, closes 54-11 gap) |
| 3 | 3 face-up typed Quests, dice by stars, bands, Trained | VERIFIED | quest-stacks, quest-dice, quest-bands, quest-attempt (Trained E18) tests |
| 4 | Costs before roll, tokens, replace/reshuffle | VERIFIED | quest-costs.test.ts, quest-stacks.test.ts |
| 5 | Jab and extras | VERIFIED | quest-jab.test.ts, quest-extras.test.ts |

Requirements PLAY-01..PLAY-07: all covered by the above; no orphans.

## Spot-checks
- `npm test`: 121 files, 1162 passed, 3 skipped.
- `node --check` on all 6 CLAUDE.md UI files: clean.
- Playwright spec tests/ui/attack-and-quest-2-0.spec.js exists (not run: headless/headed browser out of scope here; relied on 56-09 summary).
- No TBD/FIXME/XXX in src/engine/quests or canMosjeAct.

## Test-count drop (1237 to 1162, commit 065393b)
Deleted quest-threshold -> quest-dice/quest-bands (exist, 17 cases); quest-haven-double-quest -> one-action.test (6 cases, exist); first-turn-quest-lock -> v4-leftovers-removed.test (rule removed in 2.0, banned-literal guard); phase48 quest_req_* -> quest-costs "E20 - conditions" (exists). Rewritten files (phase-22-quest-gates, momentum-master, etc.) moved to the 2.0 API. Counterparts are real; drop is V4 removal, not weakening.

## Gaps
None for Phase 56. Browser spec not re-run by the verifier (low risk).
