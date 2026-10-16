---
phase: 59-piecie-effects
verified: 2026-10-16T00:00:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 59: Piecie Effects Verification Report

**Goal:** Every Piecie does what its Card List text says (EFX-02). Re-verification: No.

| # | Success criterion | Status | Evidence |
|---|---|---|---|
| 1 | Example Deck Piecies + all 73 have card tests | VERIFIED | tests/abilities/piecies-coverage.test.ts (73 Piecies, registry case per Piecie, effectId exported and defined) passes |
| 2 | "This turn" boosts, reductions, dice cap | VERIFIED | piecies-* section tests pass in npm test; 59-VALIDATION/summaries consistent (not individually re-read) |
| 3 | Level 2+ gate; 1-per-deck limits | VERIFIED | levelGate: 2 on piecie_dikke_taks, piecie_harde_didde, piecie_klaar_met_jou in src/data/piecies.js; coverage test asserts five-star + Mosje Reborn limit 1 |
| 4 | Ronald Kip / Amplifier / Leipe Swap | VERIFIED | piecies-sections-rest.test.ts: Ronald Kip with Master Chef = 60 + draw 1; MP Amplifier + Ronald Kip = 90, flag cleared. piecies-chain-swap.test.ts: Leipe Swap permanent, levels unchanged, onto 0 MP no getemt |

## Checks run
- `npm test`: 149 files, 1598 passed, 2 skipped, 0 failed
- `node --check` on the 6 CLAUDE.md UI files: all clean
- Not run (per instruction): test:sim, headed browser, full Playwright (59-08 ran it; VIS-02/VIS-08 fixed in f515de9)

## Requirements
EFX-02: SATISFIED.

## Notes
The Redbull/Coert fixme specs and the Affoe flaky case in ROADMAP are known gaps for later phases, not Phase 59 gaps.
The Protector is not a Piecie in the data, so its 1-per-deck limit is outside the Piecie guard.
