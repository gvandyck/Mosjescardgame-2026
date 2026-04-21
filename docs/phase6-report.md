# Phase 6 Report — Quest System

## Overview

Phase 6 implemented the complete Quest system infrastructure and all 36 general quest cards defined in the MOSJES card database v3.0.

---

## Steps Completed

### Step 0 — Infrastructure Fixes (committed `dff915e`)

Eight targeted fixes applied before quest system work:
- `sendToBottomOfDeck` primitive
- Discard cost in executor + error types
- `discardSourceCard` primitive
- `mp_loss_immune` buff check
- `checkPendingEffectAmount` condition
- `checkEventLogThisTurn` condition + `currentTurnStartCount`
- Multiplayer caller contracts doc
- `currentTurnStartCount` on GameState (optional field)

### Step 1 — Quest Manager + Threshold Resolver (committed `45b88cc`)

New files:
- `src/cards/schema/quest-definition.ts` — `QuestDefinition` interface extending `CardDefinition`
- `src/engine/resolve-quest-threshold.ts` — pure function mapping mosje trait stars → roll threshold
- `src/engine/quest-manager.ts` — `attemptQuest` with 10-step execution order
- `tests/engine/quest-manager.test.ts` — 10 tests covering all key paths

### Steps 2–5 — Quest Card Implementations

All 36 general quest cards created under `src/cards/quests/general/`:

**Physical (4):** Arm Wrestling, Parkour Challenge, Endurance Test, Sprint Race  
**Mental (4):** Strategy Puzzle, Calculate Odds, Master Plan, Quick Thinking  
**Social (4):** Inspire Crowd, Form Alliance, Negotiation, Team Building  
**Creative (4):** Artistic Expression, Improvise!, Create Masterpiece, Lucky Break  
**Technical (4):** Debug System, Hack Mainframe, Build Gadget, Precision Work  
**Resilient (4):** Survive Storm, Endure Pain, Never Give Up, Tough It Out  
**Mixed/Special (12):** Leap of Faith, Momentum Master, The Gauntlet, Ultimate Challenge, Speed Run, Sustained Assault, Perfect Timing, Elimination Challenge, Chain Master, Synergy Mastery, Regelaar, Late Night Questing, Larry Temmen, Geen Raad? Vraag Aad!, Parkeren Delft, Shotje Obby

Also added:
- `QuestInvocation.targetRef?: MosjeRef` for opponent-targeting quests (e.g. Form Alliance)
- `src/cards/quests/general/index.ts` + `src/cards/quests/index.ts`

### Step 6 — Registry Audit

`tests/cards/phase6-quest-registry.test.ts` — 8 audit tests:
1. Exactly 36 quest cards registered
2. All expected IDs present
3. All have `category: "quest"`
4. All have `scope: "general" | "personal"`
5. All have non-empty `onSuccess`
6. All roll thresholds in range 1–6
7. General quests have no `requiredMosjeCardId`
8. All subcategories are known values

---

## Implementation Simplifications

Several quests had requirements or resolution logic that could not be fully expressed with current engine primitives. All simplifications are documented in `docs/phase6-questions.md`.

**Categories of simplification:**
- **OR requirements** (7 quests): Simplified to primary condition; alternate paths noted
- **Event-log-this-turn tracking** (8 quests): Turn-scoped event counting stubs
- **Multi-condition AND** (4 quests): Non-trait conditions use `custom` requirement type
- **Interactive/special resolution** (6 quests): Flat-roll stubs with full spec in comments
- **Opponent targeting** (1 quest): Form Alliance needs `targetRef` supplied by UI caller

---

## Test Count

| Phase step | Tests added | Total |
|---|---|---|
| Step 0 | 10 | 342 |
| Step 1 | 10 | 352 |
| Steps 2–5 | 0 (cards register via side effects) | 352 |
| Step 6 | 8 | 360 |

**Final: 360 tests, 50 test files, all passing.**

---

## Files Changed / Created

### New source files (36 quest cards + 2 indexes)
- `src/cards/quests/general/` — 36 `.ts` files + `index.ts`
- `src/cards/quests/index.ts`

### Modified source files
- `src/engine/quest-manager.ts` — added `targetRef?: MosjeRef` to `QuestInvocation`; passes it through `runQuestEffects`
- `src/types/events.ts` — added `quest_skipped`, `quest_rejected`; added `rollResult` to `quest_completed`/`quest_failed`

### New test files
- `tests/engine/quest-manager.test.ts`
- `tests/cards/phase6-quest-registry.test.ts`

### New docs
- `docs/phase6-questions.md` — full list of simplifications and future work
- `docs/phase6-report.md` — this file
