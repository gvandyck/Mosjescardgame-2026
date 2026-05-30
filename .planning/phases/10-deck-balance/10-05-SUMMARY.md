---
plan: 10-05
phase: 10-deck-balance
status: complete
date: 2026-05-30
---

# Plan 10-05 Summary — Deck Compositions, Tests, and Rule Docs

## What Was Built

Added 6 new Piecie cards to all 3 starter decks, promoted all 9 deck-balance test stubs to passing assertions, added 60-card-only deck construction rule to phase0-rulings.md. Verified with full test suite and simulation run.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add Piecies to starter decks + update rule docs | ✓ Done | 37978f6 |
| 2 | Fill deck-balance.test.ts + run simulation | ✓ Done | 37978f6 |

## Key Changes

**`src/data/starterDecks.js`:**
- PHYSICAL_FORCE: added `piecie_grammetje_pieter`, `piecie_tikker` → 10 piecies
- DIGITAL_CONTROL: added `piecie_keyboard`, `piecie_mouse`, `piecie_controller` → 11 piecies
- ARTISTIC_RHYTHM: added `piecie_larry_zegeltje`, `piecie_grammetje_pieter` → 10 piecies

**`tests/data/deck-balance.test.ts`:**
- 9 real assertions: 2 quest economy (failMP cap, successMP floor), 3 Digital Control, 2 Physical Force, 2 Artistic Rhythm
- All 9 pass

**`docs/phase0-rulings.md`:**
- Added "Deck Construction" section: 60-card cap, no per-card-type limits (as of Phase 10)

## Verification

- `grep -c "piecie_keyboard" src/data/starterDecks.js` → 1 ✓
- `grep -c "piecie_tikker" src/data/starterDecks.js` → 1 ✓
- `grep -c "piecie_larry_zegeltje" src/data/starterDecks.js` → 1 ✓
- `grep -c "piecie_grammetje_pieter" src/data/starterDecks.js` → 2 ✓
- `npm test` → **653 passing, 0 todo, 0 failures**
- `npx tsx src/simulation/run-once.ts` → **100 games, 0 crashes, 0 timeouts**

## Self-Check: PASSED

All must-haves verified:
- [x] Digital Control deck contains piecie_keyboard, piecie_mouse, piecie_controller
- [x] Physical Force deck contains piecie_grammetje_pieter, piecie_tikker
- [x] Artistic Rhythm deck contains piecie_larry_zegeltje, piecie_grammetje_pieter
- [x] docs/phase0-rulings.md documents 60-card-only cap
- [x] All 5 BAL requirements covered by passing tests
- [x] Full npm test suite passes (653 tests)
- [x] Simulation: 0 crashes
