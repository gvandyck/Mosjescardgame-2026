# Card Playtest Report

Generated: 2026-05-01

## Summary

- Total tests: 21
- ✅ Passed: 21
- ❌ Failed: 0
- ⚠️  Not played: 0

🎉 **All cards executed as expected!** No issues detected.

---

## Results

### ✅ kannetje-melk — Kannetje Melk

**Status:** Passed

> Gains 25 MP on the active Mosje

**Expectations:**

- ✅ Card resolves successfully
- ✅ Emits mp_gained event with amount=25
  > Found 2 matching event(s)

### ✅ pot-of-weed — Pot of Weed

**Status:** Passed

> Draws 2 cards

**Expectations:**

- ✅ Card resolves successfully
- ✅ Emits at least one card_drawn event for player1
  > Found 3 matching event(s)
- ✅ Hand size increases by at least 2 cards
  > State change verified

### ✅ te-hard-gaan — Te Hard Gaan

**Status:** Passed

> Costs 15 MP; makes opponent lose 25 MP

**Expectations:**

- ✅ Card resolves successfully
- ✅ Opponent loses MP
  > Found 2 matching event(s)
- ✅ Player loses at least 15 MP to cost
  > State change verified

### ✅ snoeiertje — Snoeiertje

**Status:** Passed

> Free attack that damages opponent for 15 MP and applies a buff to self for 15 MP loss at end of turn

**Expectations:**

- ✅ Card resolves successfully
- ✅ Opponent loses MP
  > Found 2 matching event(s)
- ✅ Applies buff to self
  > Found 2 matching event(s)

### ✅ momentum-diefje — Momentum Diefje

**Status:** Passed

> Costs 15 MP; drains up to 20 MP from opponent to self

**Expectations:**

- ✅ Card resolves successfully
- ✅ Drains MP from opponent
  > Found 2 matching event(s)

### ✅ grammetje-pieter — Grammetje Pieter

**Status:** Passed

> Gains MP and loses MP (net effect depends on implementation)

**Expectations:**

- ✅ Card resolves successfully

### ✅ varkenspootjes — Varkenspootjes

**Status:** Passed

> Conditional effect based on hand size or other criteria

**Expectations:**

- ✅ Card resolves (may be success or partial depending on conditions)

### ✅ tikker — Tikker

**Status:** Passed

> Gains MP and applies a buff to self

**Expectations:**

- ✅ Card resolves successfully
- ✅ Gains MP
  > Found 2 matching event(s)

### ✅ nature-s-gift — Nature's Gift

**Status:** Passed

> Conditional effect: gains MP if hand size meets condition, else draws

**Expectations:**

- ✅ Card resolves (may be success or partial based on hand condition)

### ✅ shoettoe — Shoettoe

**Status:** Passed

> Gains 20 MP (requires active Mosje MP <= 29)

**Expectations:**

- ✅ Card resolves successfully
- ✅ Gains 20 MP
  > Found 1 matching event(s)
- ✅ Active Mosje MP increases by at least 20
  > State change verified

### ✅ warm-kannetje-melk — Warm Kannetje Melk

**Status:** Passed

> Loses MP to draw cards

**Expectations:**

- ✅ Card resolves successfully
- ✅ Draws cards
  > Found 3 matching event(s)

### ✅ dikke-taks — Dikke Taks

**Status:** Passed

> Costs 25 MP, level 2+ requirement; complex effect with for-each loop

**Expectations:**

- ✅ Card resolves (may be rejected due to level requirement if not met)

### ✅ bagga-of-greed — Bagga of Greed

**Status:** Passed

> Draws cards and discards cards (hand cycling)

**Expectations:**

- ✅ Card resolves successfully
- ✅ Draws at least one card
  > Found 5 matching event(s)

### ✅ keyboard — Keyboard

**Status:** Passed

> Gains MP and draws cards (conditional or direct)

**Expectations:**

- ✅ Card resolves successfully
- ✅ Gains MP
  > Found 2 matching event(s)

### ✅ mouse — Mouse

**Status:** Passed

> Gains MP with conditional logic

**Expectations:**

- ✅ Card resolves successfully

### ✅ controller — Controller

**Status:** Passed

> Gains MP based on game state

**Expectations:**

- ✅ Card resolves successfully

### ✅ afblijven — Afblijven!

**Status:** Passed

> Costs 10 MP; applies buff for defense/utility

**Expectations:**

- ✅ Card resolves successfully
- ✅ Applies buff
  > Found 2 matching event(s)

### ✅ dubbele-dosis — Dubbele Dosis

**Status:** Passed

> Complex multi-effect card (likely chain/conditional)

**Expectations:**

- ✅ Card resolves (outcome varies by conditions)

### ✅ mp-amplifier — MP Amplifier

**Status:** Passed

> Modifies MP gains (multiplier or boost)

**Expectations:**

- ✅ Card resolves successfully

### ✅ f1-telemetry-data — F1 Telemetry Data

**Status:** Passed

> Gains information or MP based on game state

**Expectations:**

- ✅ Card resolves successfully

### ✅ redbull — Redbull

**Status:** Passed

> Substance card (likely MP-related effect)

**Expectations:**

- ✅ Card resolves successfully
