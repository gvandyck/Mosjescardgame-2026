# Phase 3 Report — Card Loader and Executor

## Overview

Phase 3 bridges Phase 2 (effect primitives) and Phase 4 (real card library).
It delivers a type-safe, data-driven card definition schema, a mutable-then-
freezable registry, and a pure function executor that turns card data into
game-state transitions. Three proof cards validate the pipeline end-to-end.

---

## File Tree

```
src/cards/
├── schema/
│   ├── card-definition.ts         # CardDefinition interface
│   ├── card-definition-types.ts   # CardCategory, Rarity, TriggerType, DurationType
│   ├── card-id.ts                 # Re-exports CardId brand type
│   ├── cost-definition.ts         # CostDefinition + Trait
│   ├── effect-expression.ts       # EffectExpression (key serializable type)
│   ├── pet-synergy-definition.ts  # PetSynergyDefinition
│   ├── requirement-definition.ts  # RequirementDefinition
│   ├── synergy-definition.ts      # SynergyDefinition
│   ├── target-definition.ts       # TargetDefinition union
│   └── index.ts                   # Barrel
├── registry/
│   ├── card-registry.ts           # registerCard, getCard, hasCard, getAllCards, etc.
│   ├── freeze-after-boot.ts       # freezeRegistry() — call before first game
│   └── index.ts                   # Barrel
├── executor/
│   ├── execute-card.ts            # executeCard() — main entry point
│   ├── resolve-effect-expression.ts  # '$'-prefix substitution
│   ├── resolve-target-reference.ts   # TargetDefinition → MosjeRef
│   └── index.ts                   # Barrel
└── proof/
    ├── proof-simple-gain.ts       # Mimics Kannetje Melk (gain 25 MP, free)
    ├── proof-conditional-drain.ts # Mimics Chef's Special (ifThenElse drain)
    ├── proof-synergy-buff.ts      # Mimics partner synergy + buff
    └── index.ts                   # Barrel

tests/cards/
├── schema.test.ts                 # 6 tests — type shape validation
├── registry.test.ts               # 15 tests — register/get/freeze/clear
├── executor.test.ts               # 9 tests — core executor behavior
├── executor-branch-coverage.test.ts  # 16 tests — branch hardening
├── proof-cards.test.ts            # 6 tests — proof card execution
└── expression-resolver.test.ts   # 15 tests — '$'-placeholder coverage

tests/integration/
└── phase3-executor.test.ts        # 6 tests — scripted mini-scenario
```

---

## Coverage Numbers (combined src/effects + src/cards)

| Scope              | Statements | Branches | Functions |
|--------------------|-----------|----------|-----------|
| **All files**      | **99.39%** | **93.50%** | **100%** |
| cards/executor     | 97.54%    | 93.67%   | 100%     |
| cards/proof        | 100%      | 100%     | 100%     |
| cards/registry     | 100%      | 100%     | 100%     |
| effects (Phase 2)  | 99.87%    | 92.37%   | 100%     |

> Schema files and barrel index files are excluded from coverage (type-only
> or re-export only — no executable branches).

Thresholds required: **>95% statements, >90% branches** ✅

---

## Test Summary

| Step | File | Tests |
|------|------|-------|
| 1 | schema.test.ts | 6 |
| 2 | registry.test.ts | 15 |
| 3 | executor.test.ts + executor-branch-coverage.test.ts | 9 + 16 = 25 |
| 4 | proof-cards.test.ts | 6 |
| 5 | expression-resolver.test.ts | 15 |
| 6 | phase3-executor.test.ts | 6 |
| **Total new** | | **73** |
| **Grand total (Phase 1–3)** | | **167** |

All 167 tests green.

---

## Key Design Decisions

### '$'-prefix placeholder system

Parameters in `EffectExpression.params` support three placeholders:
- `"$self"` → `invocation.actingMosjeRef`
- `"$target"` → `invocation.targetRef` (throws `MissingTargetError` if absent)
- `"$player"` → `invocation.actingPlayerId` (string)

Substitution is deep-recursive: works inside nested objects and arrays
(e.g. inside `ifThenElse` condition params, inside `chain` effects arrays).
Unknown `$`-prefixed strings throw `UnknownPlaceholderError`.

Phase 4+ card authors use `$self`/`$target`/`$player` in effect params;
the executor resolves them to concrete `MosjeRef` values before calling
the Phase 2 primitive.

### Cost-on-failure: NO automatic refund

**The executor commits cost payment before running effects.**

If a primitive throws mid-chain during effect execution, the state at that
point (including the deducted MP cost) is preserved. The executor catches
the error, emits a `warning` event with code `effect_execution_failed`, and
continues to emit `card_resolved` with `outcome: "success"` (the card
activated successfully; the individual effect failed).

**Rationale:** This matches Phase 2 `chain` semantics exactly. Rolling back
cost would require a full snapshot-and-restore mechanism that adds significant
complexity and is not needed for Phase 4. If a refund is ever needed, it can
be added as a higher-order wrapper around `executeCard`.

### Synergy evaluation order

Effects run first (Step 4), then synergies (Step 5). Within Step 5:
1. Partner synergies (`card.synergies`) evaluated first, in order
2. Pet synergies (`card.petSynergies`) evaluated second, in order

Each synergy condition is checked against the live state AFTER main effects
have run (i.e., if a main effect changes the field state, synergy checks
see the updated state).

### Registry freeze model

The card registry uses a module-level mutable `frozen` flag. `freezeRegistry()`
calls `_setFrozen()` in `card-registry.ts`. Once frozen, `registerCard` throws
`RegistryFrozenError`. `clearRegistry()` resets both the map and `frozen = false`
for test isolation.

---

## Multi-target cards (deferred)

`resolveTargetReference` returns `undefined` for `all_opponents`, `all_mosjes`,
and `shared_field`. These are AOE targets requiring a loop over valid targets.
No Phase 3 test cards use these. See `phase3-questions.md` Q3.

---

## Unresolved Phase 2 Questions

See `phase3-questions.md` Q4 for the three still-open Phase 2 items:
1. U6 modifier source typing
2. searchDeckAndDraw byType/byCost catalog access
3. `choose` primitive resolver injection

---

## Commits

1. `phase3: step 1 - card definition schema types`
2. `phase3: step 2 - card registry with freeze support`
3. `phase3: step 3 - card executor with requirement validation, cost, and synergies`
4. `phase3: step 4 - three proof cards with end-to-end tests`
5. `phase3: step 5 - expression resolver stress tests`
6. `phase3: step 6 - executor integration test and branch coverage hardening`
