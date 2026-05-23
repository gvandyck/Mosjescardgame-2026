---
phase: 08-complete-partial-cards
plan: 05
status: complete
commit: 5e6f2d3
---

## Summary

Verification checkpoint passed. Ran test suite (588/588) and simulation (100 games, 0 crashes). Updated `docs/card-reference.md`: 22 cards upgraded from `partial` to `implemented`, 4 snelles reclassified to `advanced`, deferred notes added to all remaining partial cards.

## Automated Checks

- `npm test`: 588/588 — zero failures, no regressions from plans 01–04
- Simulation (`run-once.ts`): 100 games, **Crashes: 0, Timeouts: 0**
- Human gate: **approved**

## card-reference.md Changes

### Upgraded to `implemented` (22 cards)

**Mosjes (15):**
- binti-the-creator — quick sketch (draw 1) works
- binti-the-sharp-tongue — cutting words (discard + opponent -10 MP) works
- cless-the-teacher — +3 questPrepBonus works
- mosje_amplifier — all Mosjes +10 MP works
- mosje_chris_ddr — +5 MP per Piecie played works
- mosje_coert_kastelein — immuneThisTurn flag set (same pattern as afblijven)
- mosje_martin_driver — level-scaled MP gain (15/25/35) works
- mosje_tuk_architect — two-call deck reorder works (plan 08-01)
- ronald-the-mastermind — peek + rotate-to-top works (plan 08-01)
- tuk-the-healing-spirit — all Mosjes +15 MP works
- chris-the-all-rounder — instantPiecieThisTurn flag read in turnManager
- jeffrey-the-strongman — brute force + FOOD/RESTORE block both wired (plan 08-01)
- martin-senor-west — Calculated Guess works end-to-end
- mosje_fps_coert — headshot -25 MP direct works
- the-hacker — exposes + moves top deck card to opponent hand works

**Piecie (1):**
- zie-je-die-dingetjes — two-call peek+keep pattern (plan 08-03)

**Snelle Piecie (6):**
- snelle_blensen — free-cost flag for Frenssen counter (plan 08-02)
- snelle_counter_strikka — DRAIN negate in loseMP (plan 08-04)
- snelle_drain_reversal — reflect to opponent in loseMP (plan 08-04)
- snelle_jantje_jantje_jantje — const→let crash fixed, steal works (plan 08-02)
- snelle_perfect_dodge — ATTACK negate + +15 MP in loseMP (plan 08-04)

### Reclassified to `advanced` (4 snelles)

- snelle_frenssen — counter-chain push implemented; caller targetRef resolution deferred to UI
- snelle_jammertje_gepakt — send-to-bottom primitive not yet implemented
- snelle_jensen — source-card discard deferred; +20 MP is approved Phase 5 simplification
- snelle_jeweetniet — forceReroll flag set; interception in questLogic deferred to UI layer

### Updated notes (still `partial` with narrowed scope)

- mosje_fps_west — deferred note: opponentHandPeeked flag set; full reveal requires UI layer
- ronald-the-master-chef — deferred note: _ronaldPeek+metadata set; full reveal requires UI layer
- place_dierenasiel — 25% MP loss reduction now wired in loseMP (08-04); PET cost-waiver still UI-only
- place_synergy_chamber — all three helpers exported + JSDoc'd; dice bonus consumed in questLogic; cost/duration callers deferred

### Deferred Features section updated

- Phase 4 and Phase 5 entries marked ✅ where resolved in Phase 8
- Phase 8 Questions updated to list remaining partial cards with specific reasons
- Quest audit forwarded to plan 08-06

## key-files

created:
  - .planning/phases/08-complete-partial-cards/08-05-SUMMARY.md

modified:
  - docs/card-reference.md
