# Phase 22: Call of the Welloes — Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/engine/turnManager.js` | engine/service | CRUD + event-driven | self (lines 820–878, 239–254) | exact — extend in-place |
| `src/abilities/piecieEffects.js` | service | request-response | `effect_welloe_force` (same file, line 739) | exact |
| `src/data/piecies.js` | config/data | — | self (line 704–717) | exact — data correction only |
| `src/main.js` | controller/UI | request-response | `handleActivatePiecie` Welloe Force branch (line 1773) | exact |
| `tests/abilities/call-of-welloes.test.ts` | test | — | `tests/abilities/phase-22-quest-gates.test.ts` | exact |

---

## Pattern Assignments

### `src/engine/turnManager.js` — new function `returnMosjeToWelloe`

**Analog:** `markMosjeDefeated` in `src/engine/victoryChecker.js` lines 88–133 — but use only the push+null lines; omit everything else.

**Core pattern — what to copy** (victoryChecker.js lines 120–131):
```javascript
// COPY these two lines only — no defeat flag, no discard entry, no checkVictory
state.players[playerId].welloe.push({ ...mosjeSlot });
state.players[playerId].activeSlots[slotIndex] = null;
```

**What NOT to copy from markMosjeDefeated:**
- WELLOE_SHIELD check (lines 94–102)
- Not Today! negateFlag check (lines 104–111)
- Tesla destruction check (lines 113–118)
- `mosje.isDefeated = true` (line 121)
- `discard.unshift(...)` graveyard entry (lines 123–129)
- `return checkVictory(state)` (line 132)

**Full function shape:**
```javascript
export function returnMosjeToWelloe(gameState, playerId, slotIndex) {
  const state = JSON.parse(JSON.stringify(gameState));
  const mosjeSlot = state.players[playerId].activeSlots[slotIndex];
  if (!mosjeSlot) return state;
  // Clear tracking fields before archiving
  delete mosjeSlot.summonedByPiecie;
  state.players[playerId].welloe.push({ ...mosjeSlot });
  state.players[playerId].activeSlots[slotIndex] = null;
  console.log(`[ENGINE] returnMosjeToWelloe: ${mosjeSlot.name} returned to Welloe pile`);
  return state;
}
```

---

### `src/engine/turnManager.js` — new export `confirmCallOfWelloes`

**Analog:** `playMosje` in `src/engine/turnManager.js` lines 820–860 — free-slot check, `createMosjeSlotFromDefinition`, saved-state restore.

**Free-slot check pattern** (turnManager.js line 836):
```javascript
const openSlotIndex = player.activeSlots.findIndex(slot => slot === null);
if (openSlotIndex < 0) {
  return { state, success: false, error: 'You can have up to 2 Mosjes on the field' };
}
```

**Mosje placement + saved-state restore pattern** (turnManager.js lines 848–856):
```javascript
const saved = removed.savedState || {};   // for Call of the Welloes: welloe record IS the saved state
const slot = createMosjeSlotFromDefinition(mosjeDef);
if (typeof saved.mp === 'number') slot.mp = saved.mp;
if (typeof saved.level === 'number') slot.level = saved.level;
if (saved.traits && typeof saved.traits === 'object') slot.traits = { ...saved.traits };
if (Array.isArray(saved.statusEffects)) slot.statusEffects = [...saved.statusEffects];
player.activeSlots[openSlotIndex] = slot;
```

**Additional fields for Call of the Welloes (new, not from analog):**
```javascript
slot.summonedByPiecie = 'piecie_call_of_welloes';  // D-02
// Link back on the piecieSlot:
const piecieSlotIdx = player.piecieSlots.findIndex(s => s?.cardId === 'piecie_call_of_welloes');
if (piecieSlotIdx >= 0) {
  player.piecieSlots[piecieSlotIdx].linkedMosjeCardId = mosjeCardId;  // D-01
}
```

---

### `src/engine/turnManager.js` — end-of-turn sweep hook in `endTurn`

**Analog:** existing piecieSlots sweep loop in `src/engine/turnManager.js` lines 239–254 — add a second pass immediately after it.

**Insertion point — after line 254** (after the closing `}` of the piecieSlots for-loop):
```javascript
// Call of the Welloes: return summoned Mosjes whose Piecie has left play
for (let i = 0; i < state.players[playerId].activeSlots.length; i++) {
  const aSlot = state.players[playerId].activeSlots[i];
  if (aSlot?.summonedByPiecie === 'piecie_call_of_welloes') {
    const piecieStillOnField = state.players[playerId].piecieSlots.some(
      p => p?.cardId === 'piecie_call_of_welloes'
    );
    if (!piecieStillOnField) {
      state = returnMosjeToWelloe(state, playerId, i);
      console.log(`[ENGINE] endTurn sweep: summoned Mosje returned — Piecie no longer on field`);
    }
  }
}
```

---

### `src/abilities/piecieEffects.js` — new function `effect_call_of_welloes`

**Analog:** `effect_welloe_force` in `src/abilities/piecieEffects.js` lines 739–751 — same file, same shape: cloneState, guard checks, set a pending flag on state, return state for main.js to handle the UI pick.

**effect_welloe_force pattern to copy** (lines 739–751):
```javascript
export function effect_welloe_force(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;
  // ... guard checks ...
  state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
  console.log('[ABILITY] Welloe Force: paid 40 MP, 3-turn redirect active, target pending UI');
  return state;
}
```

**Call of the Welloes shape (adapt from above):**
```javascript
export function effect_call_of_welloes(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;

  // Cancel conditions (D-08, D-09) — silent, no error
  if (!Array.isArray(player.welloe) || player.welloe.length === 0) {
    return { ...state, _callOfWelloesCancel: true };
  }
  const openSlot = player.activeSlots.findIndex(s => s === null);
  if (openSlot < 0) {
    return { ...state, _callOfWelloesCancel: true };
  }

  // Build option list for UI (D-16)
  const welloeOptions = player.welloe.map(w => ({
    cardId: w.cardId,
    name: w.name,
    mp: w.mp,
    level: w.level,
  }));
  state._callOfWelloesPending = { playerId, welloeOptions };
  console.log('[ABILITY] Call of the Welloes: welloe options pending UI pick');
  return state;
}
```

**Imports needed** — same as existing imports in piecieEffects.js (no new imports required for this function since `MOSJES` and `cloneState` are already present).

---

### `src/data/piecies.js` — description update

**Target:** lines 712 — change description text to match welloe-stat-restore behaviour (D-06 / CONTEXT.md specifics note).

**Current (line 712):**
```javascript
description: "Choose a Mosje in a Welloe pile and summon it to the field at Level 1, 0 MP. This Piecie stays linked to that Mosje; if this Piecie leaves play, that Mosje returns to Welloe.",
```

**Replace with:**
```javascript
description: "Choose a Mosje in your Welloe pile and summon it to the field, restoring its MP and Level from when it was last defeated. This Piecie stays linked to that Mosje; if this Piecie leaves play, that Mosje returns to your Welloe pile.",
```

---

### `src/main.js` — `requiresWelloeSelect` branch in `handleActivatePiecie`

**Analog:** Welloe Force `_welloeForceActive` branch at lines 1773–1801 and MP Adjuster branch at lines 1803–1825 — same post-activation pattern: check a pending flag on `gameState`, show `modal.showOptionSelect`, call confirm function with result.

**showOptionSelect pattern** (lines 1788–1794):
```javascript
const targetId = await modal.showOptionSelect({
  title: 'Welloe Force — Redirect Damage',
  prompt: 'Choose a Mosje to redirect all incoming damage to (3 turns).',
  options: oppSlots,    // [{ id, label, metaLabel }, ...]
  allowCancel: false,
});
```

**Call of the Welloes branch (insert after line 1801, before MP Adjuster block):**
```javascript
// ── Call of the Welloes — pick Mosje from Welloe pile to summon ──────────
if (gameState._callOfWelloesPending) {
  const { welloeOptions } = gameState._callOfWelloesPending;
  const options = welloeOptions.map(w => ({
    id: w.cardId,
    label: w.name,
    metaLabel: `${w.mp} MP · Lvl ${w.level}`,
  }));
  const chosen = await modal.showOptionSelect({
    title: 'Call of the Welloes',
    prompt: 'Choose a Mosje from your Welloe pile to summon.',
    options,
    allowCancel: false,
  });
  if (chosen) {
    const { state: confirmedState } = confirmCallOfWelloes(gameState, localPlayerId, chosen);
    gameState = confirmedState;
  }
  delete gameState._callOfWelloesPending;
}
```

**Import for `confirmCallOfWelloes`:** Add to the existing turnManager.js import block at top of main.js (same pattern as `playMosje`, `activatePiecie`, etc.).

---

### `tests/abilities/call-of-welloes.test.ts` — new test file

**Analog:** `tests/abilities/phase-22-quest-gates.test.ts` lines 1–62 — identical structure: vitest imports, `@ts-expect-error` JS module imports, `makePlayer`, `makeState` helpers.

**File header + imports pattern** (phase-22-quest-gates.test.ts lines 1–13):
```typescript
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { endTurn, confirmCallOfWelloes } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { effect_call_of_welloes } from "../../src/abilities/piecieEffects.js";
```

**makePlayer helper pattern** (phase-22-quest-gates.test.ts lines 23–50):
```typescript
function makePlayer(overrides: Record<string, any> = {}) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    welloe: [] as any[],
    activeSlots: [
      {
        cardId: "mosje_self",
        name: "Test Mosje",
        mp: 100,
        level: 1,
        isDefeated: false,
        traits: {},
        statusEffects: [],
        abilityUsedThisTurn: false,
      },
      null,
    ],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
    attackPieciePlayedThisTurn: false,
    ...overrides,
  };
}
```

**Test cases to cover (per CONTEXT.md TDD list):**
1. Summon path — `confirmCallOfWelloes` places welloe Mosje in empty activeSlot, sets `summonedByPiecie`, sets `linkedMosjeCardId` on piecieSlot, removes from welloe[]
2. Return path — `returnMosjeToWelloe` nulls the activeSlot, pushes back to welloe[], clears `summonedByPiecie`
3. No-free-slot cancel — `effect_call_of_welloes` returns `_callOfWelloesCancel` when both activeSlots occupied
4. Empty-welloe cancel — `effect_call_of_welloes` returns `_callOfWelloesCancel` when welloe[] is empty
5. End-of-turn sweep — `endTurn` calls return when Piecie slot is gone
6. End-of-turn no-op — `endTurn` leaves Mosje in place when Piecie slot still present
7. Welloe-stat restore — summoned Mosje MP and level match the welloe record, not fresh defaults

---

## Shared Patterns

### cloneState (deep copy)
**Source:** `src/abilities/piecieEffects.js` line 13
**Apply to:** `effect_call_of_welloes`, `returnMosjeToWelloe`, `confirmCallOfWelloes`
```javascript
function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
```
For engine functions (turnManager.js) use the inline `JSON.parse(JSON.stringify(gameState))` form directly, as `playMosje` does.

### Console logging convention
**Source:** `src/engine/victoryChecker.js` line 120, `src/abilities/piecieEffects.js` line 749
All engine log lines use `[ENGINE]` prefix; all ability log lines use `[ABILITY]` prefix; UI log lines use `[UI]` prefix.

### Cancel without error (silent canActivate false)
**Source:** `src/abilities/piecieEffects.js` — `effect_welloe_force` simply returns state unchanged; main.js checks a flag.
Call of the Welloes follows the same pattern: effect returns a flag, main.js checks it, never shows an error modal to the user.

### showOptionSelect options shape
**Source:** `src/main.js` lines 1779–1781
```javascript
{ id: string, label: string, metaLabel: string }
```
`id` is passed back as the chosen value. `metaLabel` shows secondary info (MP, level, etc.).

---

## No Analog Found

All files have close analogs. No gaps.

---

## Metadata

**Analog search scope:** `src/engine/`, `src/abilities/`, `src/data/`, `src/main.js`, `tests/abilities/`
**Files scanned:** 8 source files read, 2 test files read
**Pattern extraction date:** 2026-06-03
