---
phase: 57-piecies-snelle-places-and-reaction-windows
verified: 2026-10-12T00:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 57 Verification

**Goal:** Piecies, Snelle, Places and the Welloe pile follow the 2.0 table rules; the engine pauses to offer reaction Snelle.

| # | Success criterion | Status | Evidence |
|---|---|---|---|
| 1 | Piecie readiness, 3 slots, Stays lifecycle | VERIFIED | tests/engine/piecie-timing.test.ts, stays.test.ts |
| 2 | Snelle slot rule, immediate discard, Blensen!, cooldown | VERIFIED | tests/engine/snelle-slot.test.ts, snelle-piecie-full-slots.test.ts |
| 3 | 7 reaction moments, pause and offer (human and bot) | VERIFIED | src/engine/reactions/*, src/bot/settleReactions.js, src/ui/actions/promptReaction.js, tests/engine/reaction-windows.test.ts, tests/ui/snelle-reaction.spec.js (spec present, not run: no browser) |
| 4 | Places from hand, one in play, no slot; activatePlace gone | VERIFIED | tests/engine/place-play.test.ts; no `activatePlace` hits in src/ |
| 5 | Welloe pile separate, exit gate; no V4 test; npm test green | VERIFIED | tests/engine/welloe-pile.test.ts; npm test run twice: 128 files, 1221 passed, 3 skipped, identical both runs |

**SHELL-04:** tests/meta/fixme-reasons.test.ts exists and passes. It requires every fixme/skip to name Phase 58-60 with a reason. It also checks the card-registry skipReasons.

**Syntax:** node --check was clean on all 6 UI files. Each file was checked separately.

**Requirements:** TABLE-02..06 and SHELL-04 are covered by plans 57-01..07, with no orphaned requirements.

**Not run:** Playwright specs, per instruction (no headed browser). No human items are required. Known gaps for Phases 58-63 are out of scope.
