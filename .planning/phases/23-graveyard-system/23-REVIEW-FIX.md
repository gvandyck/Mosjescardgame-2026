---
phase: 23-graveyard-system
fixed_at: 2026-06-04T17:18:00Z
review_path: .planning/phases/23-graveyard-system/23-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 23: Code Review Fix Report

**Fixed at:** 2026-06-04T17:18:00Z
**Source review:** .planning/phases/23-graveyard-system/23-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-04: graveyardUtils — allCardData lookup incomplete at call sites

**Files modified:** `src/engine/graveyardUtils.js`, `src/abilities/piecieEffects.js`
**Commit:** 2abe0cc
**Applied fix:** graveyardUtils.js now imports MOSJES, PIECIES, PLACES, SNELLE_PIECIES, and QUESTS internally and builds a single `CARD_DEF_MAP`. The API was simplified to `toGraveyardEntry(cardId, source)` and `addToGraveyard(state, playerId, cardId, source)` — callers no longer pass `allCardData`. The two call sites in piecieEffects.js (`effect_those_eyelashes` and `effect_klaar_met_jou`) were updated to drop the now-removed `allCardData` argument.

---

### CR-01: Bare cardId strings pushed to graveyard in turnManager.js

**Files modified:** `src/engine/turnManager.js`
**Commit:** 74cc034
**Applied fix:** Added imports for `SNELLE_PIECIES`, `QUESTS`, and `toGraveyardEntry` at the top of turnManager.js. Replaced all 8 bare-string `player.graveyard.push(cardId)` calls with `player.graveyard.push(toGraveyardEntry(cardId, 'played'))`:
- Line ~252: Snelle Piecie EoT sweep
- Line ~257: Persistent Piecie EoT sweep
- Line ~381: Personal Quest played from hand
- Line ~530: Personal Quest activated from field
- Line ~671: Counter Strikka negation
- Line ~683: Perfect Dodge negation
- Line ~744: Non-persistent Piecie resolves
- Line ~809: Snelle Piecie played with no free slot (fallback)

---

### CR-03: effect_stookerino writes to opp.discard — field does not exist

**Files modified:** `src/abilities/piecieEffects.js`
**Commit:** 697c41c
**Applied fix:** Replaced `opp.discard.unshift(discarded)` with a safe graveyard push: initialises `opp.graveyard` if missing, extracts cardId from the removed hand card, and pushes `{ cardId, name: cardId, type: 'HAND_CARD', source: 'discarded' }`.

---

### CR-02: main.js still writes to player.discard in two places

**Files modified:** `src/main.js`
**Commit:** 15f06bd
**Applied fix:**
- Line 836-837 (Aad Recovery): replaced `player.discard.unshift(removed)` with a typed graveyard push to `player.graveyard`, initialising the array if absent.
- Line 1767 (Bagga of Greed): replaced `player.discard.unshift(removed.cardId || removed)` with a typed graveyard push using `CARD_LOOKUP` to resolve name and type.

---

### CR-05: main.js Ronald Mastermind reads from player.discard — always returns empty

**Files modified:** `src/main.js`
**Commit:** 15f06bd
**Applied fix:** Renamed `gameState.players[localPlayerId].discard` to `gameState.players[localPlayerId].graveyard` at line ~1332. The Master Plan ability now correctly reads the player's graveyard to build the list of available Piecies.

---

### Test updates (companion to CR-01 and CR-04)

**Files modified:** `tests/engine/graveyardUtils.test.ts`, `tests/engine/piecie-persist-eot.test.ts`
**Commit:** 2b7bd58
**Applied fix:** Updated tests to match the new simplified API (`toGraveyardEntry(cardId, source)`, `addToGraveyard(state, playerId, cardId, source)`) and to assert on typed graveyard entries rather than bare strings.

---

**Result:** All 912 tests pass after fixes.

---

_Fixed: 2026-06-04T17:18:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
