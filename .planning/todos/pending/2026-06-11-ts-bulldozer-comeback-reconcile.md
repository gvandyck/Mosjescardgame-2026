---
created: 2026-06-11
title: Reconcile declarative TS Alyssa Bulldozer to "comeback" (needs scaling primitive)
area: cards / engine (declarative TS)
files:
  - src/cards/mosjes/fighting/alyssa-the-bulldozer.ts:20-38
  - src/effects/ (new scaling/derived-amount primitive)
  - src/engine/ (primitive dispatch)
  - tests/ (TS unit tests for the new primitive + Bulldozer)
---

## Problem

Alyssa "The Bulldozer" — ability **Unstoppable** — is implemented two different
ways in the two engines, and the user confirmed the IMPERATIVE version (comeback)
is canonical ("I like the way 1 works").

- **Imperative (LIVE game + cinema, canonical):** comeback —
  `bonus = Math.floor(mpLostThisTurn / 10) * 5` → +5 MP per full 10 MP lost.
  See src/abilities/mosjeAbilities.js:157-168.
- **Declarative TS (parallel, unit-tested, NOT the live game):** flat +10 every
  turn, plus a flat +25 if she lost 30+ in one turn (threshold, all-or-nothing).
  See src/cards/mosjes/fighting/alyssa-the-bulldozer.ts:20-38.

The live data description (src/data/mosjes.js) and the imperative engine were
already reconciled to comeback on 2026-06-11 (commit f6e556a). Only the
declarative TS card remains divergent.

## Why it's non-trivial

The TS baseAbility is built from fixed-amount primitives (`gainMP amount: 25`)
and a boolean condition (`checkEventLogThisTurn` with `minAmount`). There is no
primitive today that computes a *derived/scaled* amount like `floor(lost/10)*5`.
So matching comeback needs a NEW primitive (e.g. `gainMPScaled` /
`gainMPPerThreshold { per: 10, amount: 5, source: mpLostThisTurn }`), wired into
the effect dispatcher, plus unit tests.

## Solution sketch

1. Add a scaling-gain primitive that grants `floor(sourceValue / per) * amount`,
   sourcing `mpLostThisTurn` for the self Mosje.
2. Rewrite ALYSSA_THE_BULLDOZER.baseAbility.effects to use it; update the TS
   `description` to the comeback wording.
3. Tests: primitive unit tests (0/10/25/30/50 lost → 0/5/10/15/25) + Bulldozer
   card test. Keep the live-game comeback (already correct) as the reference.
4. Per CLAUDE.md (touches MP logic): re-run Ronald Kip stacking test + full sim.

## Context

- See [[two-card-systems]] memory — imperative vs declarative divergence.
- Fissa "Party Power" was reconciled the same day (hand.length x5; +15
  place-destroy passive removed). Bulldozer TS is the last Alyssa loose end.
