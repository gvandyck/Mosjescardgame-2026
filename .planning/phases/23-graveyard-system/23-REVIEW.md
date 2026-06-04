---
phase: 23-graveyard-system
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/engine/graveyardUtils.js
  - src/engine/victoryChecker.js
  - src/engine/turnManager.js
  - src/abilities/piecieEffects.js
  - src/abilities/mosjeAbilities.js
  - src/abilities/placeEffects.js
  - src/abilities/snelleEffects.js
  - src/ui/modalManager.js
  - src/ui/boardRenderer.js
findings:
  critical: 5
  warning: 4
  info: 2
  total: 11
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The graveyard rename from `player.discard`/`player.welloe` is largely complete in the engine and ability files. The invariant checks confirm no stale `player.welloe` or `player.discard` references remain in the reviewed files. However, several critical defects were introduced or left unresolved during this migration:

1. Bare `cardId` strings are still being pushed to `graveyard` in multiple places inside `turnManager.js`, breaking the typed-object invariant that `graveyardUtils.js` and all consumers depend on.
2. Two spots in `main.js` still write to `player.discard` (not `player.graveyard`), meaning the Bagga of Greed discard and a quest-hand-discard flow silently write to a stale field.
3. `effect_tempiecie` and `ability_martin_historian_time_control` call `.shift()` on the graveyard expecting a typed object, but will silently break when they encounter a bare string pushed by the buggy `turnManager.js` paths.
4. `effect_stookerino` still writes `opp.discard.unshift(discarded)` — `player.discard` was not renamed here.
5. `toGraveyardEntry` silently falls back to `type: 'HAND_CARD'` when a card is not found in `allCardData`. Because `turnManager.js` passes only `[...PIECIES, ...MOSJES]` (never PLACES, SNELLE_PIECIES, or QUEST cards), every Place and Snelle card sent to the graveyard gets the wrong type, breaking `getGraveyardByType` filters.

---

## Critical Issues

### CR-01: Bare `cardId` strings pushed to graveyard — breaks typed-object invariant

**File:** `src/engine/turnManager.js:252, 257, 381, 530, 671, 683, 744, 809`

**Issue:** Eight call sites push a raw `cardId` string directly to `player.graveyard` instead of a typed entry object. The entire graveyard system is built on the contract that every entry is `{ cardId, name, type, source }`. All consumers — `getGraveyardByType`, `effect_mosje_reborn`, `confirmCallOfWelloes`, `effect_call_of_welloes`, `effect_huisbaas`, `ability_martin_historian_time_control`, `ability_ronald_mastermind_master_plan`, and `effect_tempiecie` — call `.type`, `.cardId`, or `.name` on entries. A bare string causes silent type-filter misses or crashes (`Cannot read property 'cardId' of string`).

Affected lines and their contexts:
- **252**: Snelle Piecie swept at EoT — `state.players[playerId].graveyard.push(slot.cardId)`
- **257**: Persistent Piecie swept at EoT — same pattern
- **381**: Personal Quest played from hand — `player.graveyard.push(questCard.cardId)`
- **530**: Personal Quest activated from field — `player.graveyard.push(questCardId)`
- **671, 683**: Counter Strikka / Perfect Dodge negation — `player.graveyard.push(slotCardId)`
- **744**: Non-persistent Piecie resolves — `player.graveyard.push(slotCardId)`
- **809**: Snelle played when no slot available (fallback) — `player.graveyard.push(playedCard.cardId)`

**Fix:** Replace every bare-string push with a typed object. For Piecies the pattern is:
```js
player.graveyard.push({ cardId: slotCardId, name: PIECIE_LOOKUP[slotCardId]?.name ?? slotCardId, type: 'PIECIE', source: 'played' });
```
For quests:
```js
player.graveyard.push({ cardId: questCardId, name: questCardId, type: 'QUEST', source: 'played' });
```
Alternatively, import and use `addToGraveyard` from `graveyardUtils.js` (already imported in `piecieEffects.js`), passing a combined `allCardData` array that includes PIECIES, PLACES, SNELLE_PIECIES, and Quests.

---

### CR-02: `main.js` still writes to `player.discard` (stale field) in two places

**File:** `src/main.js:836-837` and `src/main.js:1767`

**Issue:** Two UI-level discard flows were not updated during the graveyard rename.

- **Line 836-837** (Aad Recovery quest discard): `gameState.players[pid].discard.unshift(removed)` — field `discard` no longer exists; this silently adds to an undefined field and the card vanishes from state.
- **Line 1767** (Bagga of Greed discard): `gameState.players[localPlayerId].discard.unshift(removed.cardId || removed)` — same issue; card is lost.

Both are in UI code that mutates state directly, bypassing the engine. They also push a bare string or object (not a typed graveyard entry).

**Fix:**
```js
// Line 836-837 — Aad Recovery
if (!Array.isArray(gameState.players[pid].graveyard)) gameState.players[pid].graveyard = [];
gameState.players[pid].graveyard.push({ cardId: removed.cardId ?? removed, name: removed.name ?? removed.cardId ?? removed, type: 'HAND_CARD', source: 'discarded' });

// Line 1767 — Bagga of Greed
const _removedId = removed.cardId || removed;
gameState.players[localPlayerId].graveyard.push({ cardId: _removedId, name: CARD_LOOKUP[_removedId]?.name ?? _removedId, type: CARD_LOOKUP[_removedId]?.type ?? 'HAND_CARD', source: 'discarded' });
```

---

### CR-03: `effect_stookerino` still writes to `opp.discard` — field does not exist

**File:** `src/abilities/piecieEffects.js:582`

**Issue:**
```js
opp.discard.unshift(discarded);
```
`player.discard` was renamed to `player.graveyard` but this line was missed. This will throw `Cannot read properties of undefined (reading 'unshift')` at runtime whenever Stookerino is activated, crashing the effect entirely. The discarded card is lost.

**Fix:**
```js
if (!Array.isArray(opp.graveyard)) opp.graveyard = [];
const discardedId = discarded?.cardId ?? discarded;
opp.graveyard.push({ cardId: discardedId, name: discardedId, type: 'HAND_CARD', source: 'discarded' });
```

---

### CR-04: `toGraveyardEntry` type fallback `'HAND_CARD'` fires for all non-Mosje/non-Piecie cards because `allCardData` arrays passed at call sites never include Places, Snelle Piecies, or Quest cards

**File:** `src/engine/graveyardUtils.js:16` (design gap exposed at call sites)

**Issue:** `toGraveyardEntry` falls back to `type: 'HAND_CARD'` when a card is not found in `allCardData`. In `piecieEffects.js` the call sites pass `[...PIECIES, ...MOSJES]` — no PLACES, no SNELLE_PIECIES, no Quest cards. This means:
- Place cards sent via `effect_those_eyelashes` or `effect_klaar_met_jou` when a Place is in the opponent's hand get `type: 'HAND_CARD'` instead of `'PLACE'`.
- `effect_huisbaas` relies on `getGraveyardByType(player, 'PLACE')` (or the `place_` prefix fallback). If a Place was sent to the graveyard with type `'HAND_CARD'` via a discard effect, it becomes invisible to Huisbaas.
- Snelle Piecies discarded from hand get `type: 'HAND_CARD'` instead of `'SNELLE_PIECIE'`.

**Fix:** In `graveyardUtils.js`, export a constant `ALL_CARD_DATA` or accept an optional card registry. At all call sites in `piecieEffects.js`, pass `[...PIECIES, ...MOSJES, ...PLACES, ...SNELLE_PIECIES]`:
```js
import { SNELLE_PIECIES } from '../data/snellePiecies.js';
import { PLACES } from '../data/places.js';
// ...
state = addToGraveyard(state, oppId, cardId, [...PIECIES, ...MOSJES, ...PLACES, ...SNELLE_PIECIES], 'discarded');
```

---

### CR-05: `main.js` Ronald Mastermind reads from `player.discard` — stale field, ability always silently fails

**File:** `src/main.js:1332`

**Issue:**
```js
const discard = gameState.players[localPlayerId].discard || [];
```
`player.discard` no longer exists. This evaluates to `[]` (the `|| []` guard hides the bug). The player's graveyard Piecie list is always empty from the UI's perspective, so the ability always shows "No Piecie in your discard" even when the graveyard is full of Piecies. The ability is permanently broken in the UI.

**Fix:**
```js
const discard = gameState.players[localPlayerId].graveyard || [];
```

---

## Warnings

### WR-01: `effect_tempiecie` and `ability_martin_historian_time_control` assume graveyard entries are objects — will fail silently on bare strings

**Files:** `src/abilities/piecieEffects.js:445-448`, `src/abilities/mosjeAbilities.js:344-346`

**Issue:** Both functions call `.shift()` on `player.graveyard` and immediately use the result as an object (`.cardId`, `._unplayableThisTurn`). As long as CR-01 bare strings exist in the graveyard, these functions will receive a string, set a property on it (silently dropped in strict mode), and push a bare string back into the player's hand — a corrupt state.

**Fix:** After calling `.shift()`, guard with a type check:
```js
const retrieved = player.graveyard.shift();
if (!retrieved) return state;
const entry = typeof retrieved === 'string' ? { cardId: retrieved, type: 'HAND_CARD' } : retrieved;
entry._unplayableThisTurn = true;
player.hand.push(entry);
```
This is a secondary consequence of CR-01, but must be hardened independently.

---

### WR-02: `endTurn` piecie sweep — `graveyard.push(slot.cardId)` inconsistency vs piecie-slot objects

**File:** `src/engine/turnManager.js:252, 257`

**Issue:** When a Snelle Piecie or EoT-persistent Piecie is swept, the code pushes `slot.cardId` (a string). The slot itself is a full object with `{ cardId, type, faceDown, activated, ... }`. The correct pattern — matching how `activatePiecie` operates — is to push a typed graveyard entry. This is a restatement of CR-01 for these specific paths, but worth calling out separately because the slot objects have all the needed data (cardId, type) available right there.

**Fix:**
```js
// Line 252 / 257
state.players[playerId].graveyard.push({
  cardId: slot.cardId,
  name: PIECIE_LOOKUP[slot.cardId]?.name ?? slot.cardId,
  type: slot.type === 'SNELLE_PIECIE' ? 'SNELLE_PIECIE' : 'PIECIE',
  source: 'played',
});
```

---

### WR-03: `markMosjeDefeated` calls `JSON.parse(JSON.stringify(...))` (deep clone via mutation pattern) — violates engine purity and conflicts with the immutable reducer contract

**File:** `src/engine/victoryChecker.js:89`

**Issue:**
```js
const state = JSON.parse(JSON.stringify(gameState));
```
The function then mutates `state` directly (e.g. `shieldEffect.turnsLeft -= 1`, `mosje.isDefeated = true`, `pSlots[pIdx] = null`). This is the mutable-clone pattern, not the immutable reducer pattern required by CLAUDE.md (`/src/engine/` must contain only pure functions). The real risk: if `checkVictory(state)` deep-clones again inside, changes made after the clone but before the recursive call are lost in subtle ways. The existing code happens to work because `checkVictory` doesn't clone, but this fragility is a latent bug source.

**Fix:** Refactor to use spread operators throughout, or at minimum document that this function is an exception and add a test for the WELLOE_SHIELD path to catch any regression.

---

### WR-04: `showGraveyardModal` is not exported via the null-container fallback in `initModalManager`

**File:** `src/ui/modalManager.js:13-37`

**Issue:** The null-container fallback object (returned when `container` is falsy — used in tests and server-side contexts) is missing `showGraveyardModal`. Any test or bot driver that calls `modal.showGraveyardModal(...)` on the stub will throw `TypeError: modal.showGraveyardModal is not a function`.

**Fix:** Add to the null-container return object:
```js
showGraveyardModal: () => {},
showDiscardViewerModal: () => {},
```

---

## Info

### IN-01: `graveyardUtils.js` exports three functions from one file — violates the one-function-per-file rule

**File:** `src/engine/graveyardUtils.js:10, 29, 50`

**Issue:** CLAUDE.md requires "Every exported function lives in its own file. No barrel files with multiple function exports." `graveyardUtils.js` exports `toGraveyardEntry`, `addToGraveyard`, and `getGraveyardByType` from a single file.

**Fix:** Split into three files: `toGraveyardEntry.js`, `addToGraveyard.js`, `getGraveyardByType.js`. A re-export barrel `graveyardUtils.js` may remain but must contain no logic.

---

### IN-02: Multiple `console.log` debug statements remain in engine files (`victoryChecker.js:8`, `turnManager.js:17`)

**File:** `src/engine/victoryChecker.js:8`, `src/engine/turnManager.js:17`

**Issue:** Module-level `console.log('[ENGINE] victoryChecker.js loaded')` and `console.log('[ENGINE] turnManager.js loaded')` fire on every import. These are noise in production and test output.

**Fix:** Remove or gate behind a `DEBUG` flag.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
