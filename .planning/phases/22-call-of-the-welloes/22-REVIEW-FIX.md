---
phase: 22
fixed_at: 2026-06-03T19:09:00Z
review_path: .planning/phases/22-call-of-the-welloes/22-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 22: Code Review Fix Report

**Fixed at:** 2026-06-03T19:09:00Z
**Source review:** `.planning/phases/22-call-of-the-welloes/22-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### WR-01: Dead `console.log` after `return` in `effect_popo_komt`

**Files modified:** `src/abilities/piecieEffects.js`
**Commit:** 3c7fa73
**Applied fix:** Moved the `console.log('[ABILITY] Popo Komt: ...')` call to before the `return` statement so it is reachable. The log was previously dead code (after `return triggerPlaceDestroyedEffects(...)`).

---

### CR-02: Persistence guard missing `summonedByPiecie` check in `endTurn` sweep

**Files modified:** `src/engine/turnManager.js`
**Commit:** 865421b
**Applied fix:** Added `&& s?.summonedByPiecie === 'piecie_call_of_welloes'` to the `linkedAlive` check in the piecieSlots sweep. Without this, any Mosje that happened to share `cardId` with `linkedMosjeCardId` would prevent the Piecie from being swept, even if it was placed normally (not summoned by the Piecie).

---

### WR-04: Defeat-on-sweep loop missing `!aSlot.isDefeated` guard

**Files modified:** `src/engine/turnManager.js`
**Commit:** 9a694e4
**Applied fix:** Added `&& !aSlot.isDefeated` to the condition that checks `aSlot?.summonedByPiecie === 'piecie_call_of_welloes'` in the post-sweep defeat loop. This prevents double-defeating an already-defeated slot.

---

### WR-02: `confirmCallOfWelloes` never calls `checkVictory`

**Files modified:** `src/engine/turnManager.js`
**Commit:** db12e5d
**Applied fix:** Added `const finalState = checkVictory(state)` before the return and updated the return to use `finalState`. This aligns `confirmCallOfWelloes` with all other Mosje-placement paths in the engine.

---

### CR-03: No guard when `chosen` is falsy after `showOptionSelect` in `handleActivatePiecie`

**Files modified:** `src/main.js`
**Commit:** 73b00ed
**Applied fix:** Restructured the Call of the Welloes block in `handleActivatePiecie`: now deletes `_callOfWelloesPending` first (always), then checks `if (!chosen)` — if falsy, renders, syncs, and returns early. The Piecie was already moved to discard by `activatePiecie` before this point, so the state is consistent on the early return path.

---

### WR-03: Modal labels show raw welloe `mp`/`level` instead of actual summon values

**Files modified:** `src/main.js`
**Commit:** 7180e8b
**Applied fix:** Changed the `metaLabel` in the `welloeOptions` modal mapping from `` `${w.mp} MP · Lvl ${w.level}` `` to the hardcoded string `'50 MP · Lvl 1'`. The summon always enters at 50 MP / Level 1 per rules D-05/D-06; showing the archived welloe stats was misleading.

---

### CR-01: Test fixtures A/B/C call `endTurn(state, "player_1")` with ignored second argument

**Files modified:** `tests/abilities/call-of-welloes.test.ts`
**Commit:** 764556d
**Applied fix:** Removed the second argument from all three `endTurn(state, "player_1")` calls (tests A, B, C). Added inline comments explaining that `state.activePlayerId` is explicitly set to `"player_1"` in `makeState()`, so the tests are now correct and explicit rather than relying on a coincidental match.

---

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-06-03T19:09:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
