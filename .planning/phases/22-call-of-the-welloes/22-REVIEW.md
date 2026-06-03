---
phase: 22-call-of-the-welloes
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/engine/turnManager.js
  - src/engine/victoryChecker.js
  - src/abilities/piecieEffects.js
  - src/data/piecies.js
  - src/main.js
  - tests/abilities/call-of-welloes.test.ts
  - docs/card-reference.md
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-03
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 22 adds the "Call of the Welloes" mechanic: a Piecie that summons a Mosje from the Welloe pile at Level 1 / 50 MP, with bidirectional linking between the anchor Piecie slot and the summoned Mosje slot. The core summon path and the `markMosjeDefeated` cleanup are implemented correctly. However three critical defects were found: the test suite calls `endTurn` with a second argument that the function signature ignores (making tests A, B, and C exercise the wrong player and producing false positives), the persistence guard in `endTurn` matches on `cardId` only — not on whether `linkedMosjeCardId` matches the actual Mosje `cardId` in the active slot — allowing a stale or wrong-player Mosje to block the sweep, and `main.js` mutates the live `gameState` reference directly when cleaning up `_callOfWelloesPending` / `_callOfWelloesCancel` instead of operating on the confirmed returned state. A pre-existing dead-code bug in `effect_popo_komt` is also called out as a blocker.

---

## Critical Issues

### CR-01: Test suite calls `endTurn(state, "player_1")` but the signature is `endTurn(gameState)` — second argument silently ignored

**File:** `tests/abilities/call-of-welloes.test.ts:89`, `117`, `137`

**Issue:** `endTurn` is declared as `export function endTurn(gameState)` (one parameter). The test calls `endTurn(state, "player_1")` with two arguments. JavaScript silently ignores the extra argument. The function always operates on `state.activePlayerId`, which in the test fixture is `"player_1"` — so the tests appear to pass, but they are not testing what the comments claim. Any future refactor that renames `activePlayerId` or changes the fixture will silently break the invariant without the test catching it. More critically, if a test fixture were copied with a different `activePlayerId`, the test would produce a false negative without the developer noticing.

**Fix:** Remove the second argument from all three `endTurn(...)` calls in the test file:
```typescript
// line 89
const result = endTurn(state);
// line 117
const result = endTurn(state);
// line 137
const result = endTurn(state);
```

---

### CR-02: Persistence guard matches only on `cardId`, not on whether the live linked Mosje is actually the card referenced by `linkedMosjeCardId` — a different (non-summoned) Mosje with a coinciding `cardId` will permanently block the sweep

**File:** `src/engine/turnManager.js:244-248`

**Issue:** The guard at end-of-turn sweep is:
```javascript
if (slot?.cardId === 'piecie_call_of_welloes' && slot.linkedMosjeCardId) {
  const linkedAlive = state.players[playerId].activeSlots.some(
    s => s?.cardId === slot.linkedMosjeCardId
  );
  if (linkedAlive) continue;
}
```

`linkedMosjeCardId` is the `cardId` string (e.g. `"mosje_x"`), not a slot index or a unique instance ID. If a player has two Mosjes with the same `cardId` value (possible in theory because `cardId` is a card type identifier, not an instance ID), or if a non-summoned Mosje happens to share a `cardId` with the one that was summoned, the piecie will never be swept. More practically: when `markMosjeDefeated` clears `linkedMosjeCardId` to `null`, the very next `endTurn` sweep correctly sees `slot.linkedMosjeCardId` as falsy and sweeps the piecie. But if `markMosjeDefeated` is NOT called (e.g. a Mosje is removed via a code path that bypasses it), `linkedMosjeCardId` remains set and the piecie is never swept.

The guard should also verify that the live Mosje carries `summonedByPiecie === 'piecie_call_of_welloes'` so only the specifically summoned instance qualifies:

**Fix:**
```javascript
if (slot?.cardId === 'piecie_call_of_welloes' && slot.linkedMosjeCardId) {
  const linkedAlive = state.players[playerId].activeSlots.some(
    s => s?.cardId === slot.linkedMosjeCardId &&
         s?.summonedByPiecie === 'piecie_call_of_welloes' &&
         !s?.isDefeated
  );
  if (linkedAlive) continue;
}
```

---

### CR-03: `main.js` mutates `gameState` directly when deleting `_callOfWelloesPending` / `_callOfWelloesCancel` — bypasses immutable-reducer pattern, and the confirmed state from `confirmCallOfWelloes` is only applied if `chosen` is truthy

**File:** `src/main.js:1818-1823`

**Issue:** Two problems on adjacent lines:

1. Line 1818: `const { state: confirmedState } = confirmCallOfWelloes(gameState, localPlayerId, chosen); gameState = confirmedState;` — this is correct for the happy path. But line 1821 `delete gameState._callOfWelloesPending;` mutates the `confirmedState` object that was assigned to `gameState`. Because `confirmCallOfWelloes` deep-clones its input, the reference is a new object, so the mutation is contained — but this is fragile: any caller that retained a reference to `gameState` before this block will see the flag still present.

2. More critically: if `chosen` is falsy (the player somehow dismisses the modal despite `allowCancel: false`), `confirmCallOfWelloes` is never called, `gameState` still holds `_callOfWelloesPending`, and line 1821 deletes it from the old (un-updated) state object. The Mosje is never summoned, but the anchor Piecie has already been activated and will not be re-activatable. The Piecie persists on field indefinitely because `linkedMosjeCardId` was never set, so `slot.linkedMosjeCardId` is falsy and the sweep at `endTurn` line 244 immediately passes through... wait, it actually DOES sweep it — but the effect fired (the card was marked `activated = true`) without a summon completing. The end result is: Piecie activated, nothing summoned, Piecie swept to discard silently. This is a correctness failure for a REVIVE card.

**Fix:** Handle the falsy-`chosen` case explicitly:
```javascript
if (gameState._callOfWelloesPending) {
  const { welloeOptions } = gameState._callOfWelloesPending;
  // ... build options ...
  const chosen = await modal.showOptionSelect({ ..., allowCancel: false });
  delete gameState._callOfWelloesPending;   // clear on current state first
  if (chosen) {
    const { state: confirmedState } = confirmCallOfWelloes(gameState, localPlayerId, chosen);
    gameState = confirmedState;
  } else {
    // allowCancel:false should prevent this, but guard anyway:
    console.warn('[UI] Call of the Welloes: no choice made — effect fizzled');
  }
}
if (gameState._callOfWelloesCancel) { delete gameState._callOfWelloesCancel; }
```

---

## Warnings

### WR-01: `effect_popo_komt` has dead code after a `return` statement — `console.log` on line 603 is unreachable

**File:** `src/abilities/piecieEffects.js:601-606`

**Issue:** Inside the `if (totalMosjes >= 3)` branch, `return triggerPlaceDestroyedEffects(...)` is called before the `console.log(...)`. The log statement will never execute. This is a pre-existing defect but it is in a file modified in this phase.
```javascript
// unreachable:
return triggerPlaceDestroyedEffects(afterDestroy, playerId);
console.log('[ABILITY] Popo Komt: 3+ Mosjes — Place destroyed!');
```

**Fix:** Move the log before the return or remove it.

---

### WR-02: `confirmCallOfWelloes` does not call `checkVictory` after summoning — a summoned Mosje that already meets a win condition (e.g. Level 3 from a restored record edge case) would not be caught

**File:** `src/engine/turnManager.js:870`

**Issue:** Every other path through `turnManager.js` that places a Mosje on the field (e.g. `playMosje` line 911, `effect_mosje_reborn` does so through the effects layer but `playMosje` does call it) calls `checkVictory` before returning. `confirmCallOfWelloes` returns `{ state, success, slotIndex }` without calling `checkVictory`. While the Mosje is summoned at exactly Level 1 / 50 MP so it cannot itself trigger LEVEL_3 victory immediately, the Momentum Domination and KNOCKOUT checks also run in `checkVictory`. A rival Mosje being removed from the Welloe pile could change KNOCKOUT eligibility in a multi-player extension.

**Fix:**
```javascript
// near line 869, before the return:
return { state: checkVictory(state), success: true, slotIndex: openSlot };
```
Import `checkVictory` is already present at line 7.

---

### WR-03: `effect_call_of_welloes` exposes the raw welloe record's `mp` and `level` in `welloeOptions` — UI (`main.js:1809`) then shows the old (welloe-pile) MP and level to the player, which is misleading since the summon always happens at 50 MP / Level 1

**File:** `src/abilities/piecieEffects.js:738-741`

**Issue:** `welloeOptions` is built as:
```javascript
const welloeOptions = player.welloe.map(w => ({
  cardId: w.cardId, name: w.name, mp: w.mp, level: w.level,
}));
```
And `main.js` renders it as:
```javascript
metaLabel: `${w.mp} MP · Lvl ${w.level}`,
```
This shows the welloe-pile stats (e.g. "60 MP · Lvl 2") to the player when they are picking. But the mechanic summons at 50 MP / Level 1. The display is factually incorrect and could mislead the player into thinking those stats are restored.

**Fix:** Either omit `mp`/`level` from `welloeOptions` or override them to fixed values:
```javascript
const welloeOptions = player.welloe.map(w => ({
  cardId: w.cardId, name: w.name, mp: 50, level: 1,
}));
```

---

### WR-04: `endTurn` sweep iterates `piecieSlots` with a raw `for` loop and then separately iterates `activeSlots` to trigger defeat — the defeat loop does NOT re-check `isDefeated` on the active slot before calling `markMosjeDefeated`, which could double-defeat an already-defeated Mosje

**File:** `src/engine/turnManager.js:263-273`

**Issue:**
```javascript
for (let i = 0; i < state.players[playerId].activeSlots.length; i++) {
  const aSlot = state.players[playerId].activeSlots[i];
  if (aSlot?.summonedByPiecie === 'piecie_call_of_welloes') {
    const piecieStillOnField = state.players[playerId].piecieSlots.some(
      p => p?.cardId === 'piecie_call_of_welloes'
    );
    if (!piecieStillOnField) {
      state = markMosjeDefeated(state, playerId, i);
      ...
    }
  }
}
```
There is no `!aSlot.isDefeated` guard. `markMosjeDefeated` does a null check on the slot (`if (!mosje) return state;`) but `isDefeated = true` with a non-null slot would still proceed. If the Mosje was defeated by another effect earlier in the same `endTurn` call (e.g. a status-effect tick at lines 228-237), this loop would double-fire `markMosjeDefeated`, pushing the Mosje to welloe twice.

**Fix:**
```javascript
if (aSlot?.summonedByPiecie === 'piecie_call_of_welloes' && !aSlot.isDefeated) {
```

---

## Info

### IN-01: `piecie_call_of_welloes` description does not mention what happens when the summoned Mosje is defeated naturally (Piecie stays on field and can be swept next turn) — asymmetric wording may confuse players

**File:** `src/data/piecies.js:712`

**Issue:** The description reads: "If this Piecie is destroyed, the summoned Mosje is also defeated." It does not describe the reverse case (Mosje naturally defeated → Piecie swept next turn). The mechanic is asymmetric and the omission is likely to confuse players who try to leverage the Piecie after the Mosje is gone.

**Fix:** Extend the description: "...If the summoned Mosje is defeated naturally, this Piecie is removed at the end of that turn."

---

### IN-02: Test J description assertion is fragile — `toContain("summoned Mosje is also defeated")` will fail if the description wording is slightly changed without the assertion being wrong conceptually

**File:** `tests/abilities/call-of-welloes.test.ts:244`

**Issue:** The test pins exact substring presence. If someone rewrites the description from "the summoned Mosje is also defeated" to "the summoned Mosje is defeated as well", the test fails even though the intent is preserved. A regex match or an assertion on the key concepts would be more resilient.

**Fix:** Use a case-insensitive regex:
```typescript
expect(def.description).toMatch(/summoned mosje.*defeated/i);
```

---

_Reviewed: 2026-06-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
