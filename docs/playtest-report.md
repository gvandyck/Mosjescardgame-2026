# Card Playtest Report

Generated: 2026-04-30

## Summary

- Total tests: 12
- ✅ Passed: 12
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
