---
status: complete
phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
source:
  - 36-01-SUMMARY.md
  - 36-02-SUMMARY.md
  - 36-03-SUMMARY.md
  - 36-04-SUMMARY.md
started: 2026-07-16T17:35:00Z
updated: 2026-07-17T00:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Start the game fresh in a browser (offline vs bot). Game loads with no console errors, board renders, you can play a turn — cards playable, MP shows, nothing throws.
result: pass
note: |
  Game booted clean and played a full offline-vs-bot match to a KNOCKOUT win with no console
  errors and no throws. Cold start itself passed. User raised two separate gameplay observations
  during the game, both investigated and both confirmed PRE-EXISTING (not Phase 36 regressions —
  the match never activated Welloe Force, and the mpCost:0 corrections are runtime no-ops):
  (1) Dice "+2 didn't work / showed 1+1" → NOT a bug. Sleutelpuntje is +1 (not +2). Dice showed
      "Rolled 2 (1+1)" = base d6 of 1 + Sleutelpuntje +1 = 2; still failed vs threshold 4. The
      confusing console "Rolled d6: 6" was Michelle's Tough Gamble ability's separate, unrelated
      d6. Working as designed.
  (2) Michelle (10 MP) could attempt a 20-MP General Quest and was knocked out → the 20 MP quest-
      attempt fee is a real canonical rule (phase0-rulings.md:126, 2026-07-12, pre-Phase-36), and
      that ruling explicitly says paying a cost below 0 at Level 0 = defeat. So the lethality is
      per-ruling. BUT the same ruling permits EITHER "let the payment through → defeat" OR "block
      the attempt when unaffordable"; the human general-quest path (main.js:1511 showQuestPreview-
      ThenRoll) chose the former with NO affordability gate. Whether a Mosje should be ALLOWED to
      attempt a quest it can't afford is an open DESIGN decision for Gandoe — out of Phase 36 scope.

### 2. Cost chips now read "Free" on corrected cards
expected: Look at any Piecie or Snelle Piecie in your hand that previously showed an MP cost (e.g. Kannetje Melk, Affoe, Redbull, Dubbele Dosis, a Snelle like Jensen!/Lucky Coin). Its cost chip now reads "Free" (or 0 MP) instead of a nonzero number. Playing it does NOT deduct MP from any Mosje.
result: pass
note: |
  Verified live in a headed browser session. Preview-modal cost chip read "Free" on Affoe (was 5 MP
  pre-Phase-36), Redbull (was 20 MP), and Snelle Jensen! — all three asserted /Free/. Playing Affoe
  left Coert at 20 MP → 20 MP (no cost deducted).

### 3. Welloe Force — tribute-payer picker appears
expected: With 2+ of your own Mosjes on the field (at least one holding ≥40 MP), activate Welloe Force. Before the effect resolves, a picker modal appears asking which of your on-field Mosjes should pay the 40 MP tribute — listing your Mosjes, with each one's MP shown (green if it can afford 40, red/greyed if it can't). You choose the payer; you are NOT auto-charged on the first slot.
result: pass
note: |
  Verified live in a headed browser session. Picker opened on Welloe Force activation with 2 Mosje
  options and exactly 1 disabled (Gandoe @20 MP greyed, Michelle @80 MP selectable). Matches the
  passing welloe-force-tribute.spec.js regression assertions.

### 4. Welloe Force — chosen payer's MP drops by exactly 40
expected: After picking a payer in test 3, that specific Mosje's on-field MP number ticks down by exactly 40, and Welloe Force's redirect effect activates. No other Mosje loses MP. The chosen Mosje is not defeated by paying (paying tribute is never lethal).
result: pass
note: |
  Verified live (user watched Michelle 80 → 40 after picking her as payer). Also guarded by the
  passing welloe-force-tribute.spec.js assertion payerSlot.mp === 40 and _welloeForceActive
  { turnsRemaining: 3 }; no other Mosje lost MP.

### 5. Welloe Force — blocked when nobody can afford it
expected: With NO on-field Mosje holding ≥40 MP, try to activate Welloe Force. A "Cannot Activate" dialog appears explaining no Mosje can afford the 40 MP tribute. The card is NOT activated, no MP is charged to anyone, and no redirect is granted.
result: pass
note: |
  Verified live in a headed browser session. Single Mosje Michelle @20 MP; activating Welloe Force
  showed picker options=0, a "Cannot Activate" dialog, Michelle unchanged at 20 MP, and
  _welloeForceActive undefined (no redirect granted). Matches the passing welloe-force-tribute.spec.js
  blocked-path assertions.

### 6. Delluft / Dierenasiel text no longer promises a vacuous cost-0 clause
expected: View the Delluft and Dierenasiel Place cards (in a deck/booster viewer or on the field). Delluft's text reads as its real draw-1 effect only ("End Phase: All players draw 1 card.") with no "SUBSTANCE Piecies cost 0 MP" clause. Dierenasiel's text is an honest "no current effect" statement, not a "PET Piecies cost 0 MP" promise.
result: pass
note: |
  Verified live in a headed browser session. Delluft preview modal read "End Phase: All players draw
  1 card." (tags SUBSTANCE/DRAW) with no cost-0 clause. Dierenasiel card data confirmed
  "Passive: currently no mechanical effect." (honest no-op; real mechanic deferred to a future phase
  via tracked todo 2026-07-16-dierenasiel-real-mechanic-needed.md).

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
