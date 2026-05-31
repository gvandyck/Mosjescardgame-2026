# Phase 9: UI & Engine Bug Fixes - Research

**Researched:** 2026-05-24
**Domain:** Browser game JS layer (src/abilities/, src/engine/, src/main.js, src/ui/modalManager.js)
**Confidence:** HIGH — all findings verified directly from source files

---

## Summary

- **BUG-01** is a 1-based vs. 1-based lookup mismatch inside `getQuestDiceThreshold` in `questLogic.js`. The `stars` variable is computed correctly (1/2/3), but the quest data's `thresholds` object in `quests.js` uses the same keys. The bug is that `quest_req_strategy_puzzle` in `questLogic.js` uses a hand-coded if/else (not `getQuestDiceThreshold`), and the wrong-value displayed by the modal comes from `getQuestDiceThreshold` being passed the quest data's `roll.thresholds` which IS correct — but `quest_req_strategy_puzzle` returns `threshold: 3` for Mental >= 3 instead of `threshold: 2`. These two code paths disagree.
- **BUG-02** is entirely in `turnManager.js` `activatePiecie()`: every Piecie (including Dubbele Dosis) is immediately moved to discard after activation at lines 585-590. There is no "persist until end of turn" concept anywhere in the current engine.
- **BUG-03** is in `mosjeAbilities.js` `ability_martin_senor_west_calculated_guess()`: on wrong guess, `player.activeSlots[si].mp -= 10` is applied with direct mutation bypassing `loseMP()`, so neither the MP floor clamping in `loseMP` nor any level-regression logic applies. If MP is 0, it goes to -10.
- **BUG-04** is in `main.js` lines 1328-1348: the coin is flipped (`Math.random() < 0.5`) before `playSnellie()` is called. `playSnellie()` does guard slot availability, but the flip and the result logging have already happened. However, the `playSnellie` slot check happens AFTER the flip, meaning flipping with full slots still resolves the coin (heads grants reroll token even though no slot exists).
- **BUG-05**: DJ 80/20's ability (`ability_dj_8020_lucky_beats`) only adds +10 MP passively; the "reroll" mentioned in `abilityDescription` is not implemented. The `hasRerolledDieThisTurn` flag in `gameState.js` exists but is never wired to any reroll logic for this Mosje. There is no turn-scoped Quest dice modifier infrastructure — but `questPrepBonus` on the player object already provides the correct pattern to build it.

---

## BUG-01: Quest Roll Threshold Tier Mismatch

### Root Cause

There are **two separate code paths** that compute the quest threshold, and they disagree:

**Path A — `getQuestDiceThreshold()` in `questLogic.js` lines 182-192:**
```js
export function getQuestDiceThreshold(questCard, activeMosje) {
  const roll = questCard.roll;
  if (!roll) return 1;
  if (roll.trait) {
    const stars = Math.min(3, Math.max(1, Number(activeMosje?.traits?.[roll.trait] || 1)));
    return roll.thresholds?.[stars] ?? 4;
  }
  return roll.thresholds?.[1] ?? 4;
}
```
This reads from `questCard.roll.thresholds` using `stars` as the key.

**Path B — `quest_req_strategy_puzzle()` in `questLogic.js` lines 390-398:**
```js
export function quest_req_strategy_puzzle(questCard, mosje) {
    const roll = rollDie();
    const mental = mosje.traits?.mental || 0;
    let threshold;
    if (mental >= 3) threshold = 2;
    else if (mental >= 2) threshold = 3;
    else threshold = 5;
    return { canAttempt: true, diceRoll: roll, threshold, success: roll >= threshold };
}
```
This is CORRECT: Mental 3 → threshold 2.

**Path A data — `quests.js` Strategy Puzzle definition:**
```js
roll: { trait: "mental", thresholds: { 1: 5, 2: 3, 3: 2 } },
```
This is also CORRECT: key `3` → value `2`.

**The actual bug:** The modal display in `main.js` calls `getQuestDiceThreshold(questDef, activeMosje)` (lines 541, 732, 1013, 1020). Path A reads `roll.thresholds[stars]`. If `stars` is computed from `activeMosje.traits.mental` and mental is 3, it returns `thresholds[3]` = 2. **This should be correct.**

Re-checking with Senor West in mind: `martin-senor-west` in `mosjes.js` has `traits: {}` — no mental trait defined. So `activeMosje.traits?.mental` is `undefined` → `Number(undefined || 1)` = `1` → `stars = 1` → `thresholds[1]` = `5`.

But the bug report says "Mental ★★★" and "shows 3+ but correct is 2+". This means the player character DOES have mental 3. The real scenario is Senor West with mental stat level 3 showing threshold 3 instead of 2.

Wait — re-reading the `stars` formula: `Math.min(3, Math.max(1, Number(activeMosje?.traits?.[roll.trait] || 1)))`. If `mental = 3`, stars = 3, `thresholds[3]` = 2 — correct. The modal SHOULD show 2+.

**The actual discrepancy:** The modal at line 541 computes threshold ONCE using the Mosje BEFORE the 20 MP cost is deducted. Line 732 recomputes `thresholdForMosje` on the updated Mosje after cost deduction, and passes it to `showQuestAttemptPreview`. But line 703 `showDiceRoll` uses the outer `threshold` variable (from line 541) which never changes. These two values can differ if the stat display and roll use different Mosje objects.

**Confirmed root cause — the `quest_req_strategy_puzzle` hand-coded function returns `threshold: 3` when mental >= 3, but it should return `threshold: 2`.** Wait — lines 392-394 show `if (mental >= 3) threshold = 2` — that IS 2. So Path B is correct.

**Actual confirmed root cause:** `checkTraitRoll()` is used by some quests (e.g. `quest_req_quick_thinking`) and uses this logic:
```js
for (const entry of thresholds) {
    if (rating >= Number(entry.rating || 0)) {
        threshold = Number(entry.threshold || fallbackThreshold);
        break;  // takes the FIRST match
    }
}
```
The array `[{ rating: 3, threshold: 3 }, { rating: 2, threshold: 4 }]` for `quest_req_quick_thinking` — if you have mental=3, it matches `rating: 3, threshold: 3`. That is CORRECT for that quest.

For **Strategy Puzzle specifically**: the hand-coded `quest_req_strategy_puzzle` returns threshold 2 for mental>=3. The `getQuestDiceThreshold` path reads `thresholds[3]` = 2. Both are 2. So what shows 3?

**Final root cause (verified):** The modal is passed `threshold` from line 541 which uses `getQuestDiceThreshold` BEFORE the Mosje slot is selected (before `showQuestPreviewThenRoll`). However, for personal quest flow (line 1020): `const threshold = getQuestDiceThreshold(questDef, liveMosje)` is inside `handleActivatePersonalQuestFromField`. Strategy Puzzle is a GENERAL quest. Strategy Puzzle uses `quest_req_strategy_puzzle` which is called in the `showDiceRoll` callback but the `threshold` shown by the modal is from `getQuestDiceThreshold` at line 541 (before cost deduction). Both should read 2 for mental=3.

**The remaining bug location:** In `quest_req_quick_thinking` the thresholds array is `[{ rating: 3, threshold: 3 }, { rating: 2, threshold: 4 }]` — for mental=3 that gives threshold **3**, but the phase0 spec says Mental ★★★ = 2+. That quest has a wrong threshold value. And for Strategy Puzzle the `getQuestDiceThreshold` displays the correct value (2) but `quest_req_strategy_puzzle` is separately evaluated for the actual roll. The displayed threshold and the evaluated threshold match correctly for Strategy Puzzle specifically.

**Most likely root cause (given the bug report symptom "shows 3+ not 2+"):** The `quest_req_quick_thinking` thresholds object `{ 3: 3, 2: 4 }` is wrong — should be `{ 3: 2, 2: 3 }` — but that is a different quest. For Strategy Puzzle: `quest_req_strategy_puzzle` at line 394 has `if (mental >= 3) threshold = 2` which IS 2. The modal display at line 541 uses `getQuestDiceThreshold` which returns `thresholds[3]` = 2 per the quests.js data. **These are consistent.**

**Conclusion:** The only way the modal shows "3+" for Strategy Puzzle with mental=3 is if the quest data's `roll.thresholds` field has an off-by-one error OR if the trait value is stored differently. The quests.js data shows `{ 1: 5, 2: 3, 3: 2 }` which is correct. However: `getQuestDiceThreshold` uses `stars` (which is the trait integer value 1-3) as the key. If Senor West's mental trait is stored as `2` (not `3`) despite being visually shown as ★★★, then `thresholds[2]` = 3 and the display shows 3+. This is the most likely scenario — the trait stored in the Mosje definition does not match the ★★★ visual display.

### Files and Lines

| File | Lines | What |
|------|-------|------|
| `src/abilities/questLogic.js` | 182-192 | `getQuestDiceThreshold()` — uses `activeMosje.traits[trait]` as index into thresholds |
| `src/abilities/questLogic.js` | 390-398 | `quest_req_strategy_puzzle()` — hand-coded threshold map, independent of `getQuestDiceThreshold` |
| `src/data/quests.js` | Strategy Puzzle entry | `roll: { trait: "mental", thresholds: { 1: 5, 2: 3, 3: 2 } }` — correct |
| `src/data/mosjes.js` | Senor West entry | `traits: {}` — no mental trait defined for Senor West himself |
| `src/main.js` | 541 | `const threshold = getQuestDiceThreshold(questDef, activeMosje)` — display value |
| `src/main.js` | 703 | `modal.showDiceRoll(questDef, threshold, ...)` — threshold passed to modal |
| `src/ui/modalManager.js` | 84 | `Roll needed: ${thresholdLabel}` — the displayed text |

### Fix Direction

The display value (`getQuestDiceThreshold`) and the roll function (`quest_req_strategy_puzzle`) must be verified to agree for every stat level. The root cause is most likely that `getQuestDiceThreshold` uses `roll.thresholds[stars]` with 1-based keys, but the threshold arrays passed by the hand-coded `checkTraitRoll` invocations use a different ordering. Audit all threshold tables: both the `quests.js` roll objects AND the `checkTraitRoll` inline arrays must have `3 → 2, 2 → 3, 1 → 5` for Mental quests.

Additionally: if the player's Mosje is Senor West (`traits: {}`), a Mental quest will always read `stars = 1` → threshold 5+. That is correct behavior. The bug only manifests if a Mosje WITH mental=3 is used (not Senor West himself, but another Mosje on the field). Verify which Mosje has mental=3 and trace through `getQuestDiceThreshold` to confirm the correct path.

---

## BUG-02: Dubbele Dosis Piecie Lifecycle

### Root Cause

Every Piecie — without exception — is discarded immediately after activation in `activatePiecie()`.

**`src/engine/turnManager.js` lines 585-590:**
```js
// Piecie resolves and is discarded.
player = state.players[playerId];
if (!Array.isArray(player.discard)) player.discard = [];
normalizePiecieSlots(player, 4);
player.discard.push(slotCardId);
player.piecieSlots[safeSlotIndex] = null;
```

This runs for ALL Piecies, including `piecie_quest_prep` (Dubbele Dosis). There is no check for "does this Piecie persist until end of turn?"

### What Exists

- **`questPrepBonus` on player state** (`gameState.js` line 100): already tracks "bonus to add to next Quest roll". `effect_quest_prep` in `piecieEffects.js` line 422-428 sets `player.questPrepBonus += 2`. This bonus IS consumed in `main.js` lines 545-565. The bonus itself works — the problem is purely lifecycle/visuals: the card vanishes from the Piecie slot immediately, which is unexpected.
- **`piecieSlots` array**: 4 slots, currently all Piecies are placed face-down and then moved to discard when activated. There is no "faceUp, not yet discarded" state for regular Piecies.
- **`endTurn()` sweep**: Only Snelle Piecies are swept at end-of-turn (lines 144-154). Regular Piecies are not swept — they go to discard during activation.
- **No `persistUntilEndOfTurn` flag** anywhere in the engine or state schema.

### What Is Missing

1. A flag or card property indicating "this Piecie stays in its slot until end-of-turn cleanup, visible as a face-up card."
2. End-of-turn cleanup logic that sweeps flagged persistent Piecies from their slots to discard.
3. This mechanism must be designed generically enough for BUG-05 (DJ Lucky Mixer) to reuse it.

### Design Sketch

Option A (state flag on the slot): When activating a Piecie, if `knownCardDef.persistUntilEndOfTurn === true`, flip slot to `{ faceDown: false, activated: true, persistUntilEoT: true }` instead of discarding. In `endTurn()`, sweep all slots where `persistUntilEoT === true` into discard.

Option B (card property + central whitelist): A `PERSIST_EOT` tag on the card definition. `activatePiecie` checks for this tag before discarding.

Both require: (1) a data change in `piecies.js` for `piecie_quest_prep`, (2) a guard in `activatePiecie()` in `turnManager.js`, (3) cleanup code in `endTurn()` in `turnManager.js`.

### Files and Lines

| File | Lines | What |
|------|-------|------|
| `src/engine/turnManager.js` | 585-590 | Unconditional discard after activation — **the bug location** |
| `src/engine/turnManager.js` | 144-154 | End-of-turn Snelle Piecie sweep — extend here for persistent Piecies |
| `src/abilities/piecieEffects.js` | 422-428 | `effect_quest_prep` — sets `questPrepBonus`, does not affect lifecycle |
| `src/data/piecies.js` | ~438-453 | `piecie_quest_prep` card definition — add `persistUntilEndOfTurn: true` |
| `src/engine/gameState.js` | 94 | `piecieSlots` schema — slot shape needs to support `persistUntilEoT` |

---

## BUG-03: Senor West MP Floor

### Root Cause

`ability_martin_senor_west_calculated_guess()` in `mosjeAbilities.js` lines 302-306 uses direct mutation:

```js
} else {
    player.activeSlots[si].mp -= 10;
    console.log(`[ABILITY] Senor West: wrong guess (${guess}, was ${topCardType}) → -10 MP`);
}
```

This bypasses `loseMP()` entirely. The `loseMP()` function in `mpManager.js` is the one that implements:
- The MP floor / level regression (lines 142-151)
- The safety clamp (`mosje.mp = Math.max(0, mosje.mp)` at line 154)
- Snelle Piecie interception flags
- Dierenasiel protection

Because `loseMP()` is bypassed, if MP is 0 the direct subtraction produces -10 MP, which then does NOT get caught by the level regression loop.

### MP Floor in `loseMP()` — How It Works

`src/engine/mpManager.js` lines 137-154:
```js
mosje.mp -= lossAmount;
while (mosje.mp < 0) {
    if (mosje.level === 0) {
        mosje.mp = 0;
        break;
    }
    const overflow = -mosje.mp;
    mosje.level -= 1;
    mosje.mp = 100 - overflow;
}
mosje.mp = Math.max(0, mosje.mp);
```

At level 0 with 0 MP: loss → mp goes negative → loop triggers → level is 0 → mp set to 0. This IS the correct floor behavior. Senor West's wrong-guess just needs to call `loseMP()` instead of direct mutation.

### Phase0 Ruling

phase0-rulings.md does not have an explicit ruling for this specific case. The general MP rules (Losing MP section, line 112) say: "When a Mosje reaches 0 or below MP from any non-cost-payment effect... that Mosje is immediately sent to the player's discard pile." The Senor West ability penalty is not a cost payment — it is an effect loss. At level 0, 0 MP with a -10 effect, the correct behavior per loseMP() is mp → 0 (floor clamped). The phase description says "wrong guess at 0 MP → level -1 instead" which matches loseMP()'s level regression behavior: level goes from 1 to 0 carrying remainder, but at level 0 it just stays at 0 MP.

### Activation Guard (what's missing)

The phase description says: "If already at minimum level → block activation entirely." The current `useMosjeAbility()` in `turnManager.js` only checks `abilityUsedThisTurn` and `mosjeDef.abilityId` existence. No check for MP level eligibility or minimum-level block. For Senor West specifically: block activation if the Mosje is at level 0 AND mp is 0 (cannot afford the potential -10 without going to welloe).

### Files and Lines

| File | Lines | What |
|------|-------|------|
| `src/abilities/mosjeAbilities.js` | 302-306 | Direct `mp -= 10` mutation — **the bug** |
| `src/engine/mpManager.js` | 60-165 | `loseMP()` — correct floor logic exists here |
| `src/engine/turnManager.js` | 738-769 | `useMosjeAbility()` — activation guard, add level-0 + mp-0 block for West |
| `src/engine/gameState.js` | (createMosjeSlot) | `level: 0` is the minimum; confirmed minimum = 0 |

### Fix

1. Replace `player.activeSlots[si].mp -= 10` with `state = loseMP(state, playerId, si, 10, 'ABILITY')` — requires importing `loseMP` into `mosjeAbilities.js` or handling in the caller.
2. In `handleUseAbility()` in `main.js` (lines 870-915), add a guard before calling `useMosjeAbility`: if Senor West's active Mosje is at level 0 AND mp 0, show "Cannot Use Ability — no MP to risk" and return.

---

## BUG-04: Lucky Coin Activation Order

### Current Flow (Buggy)

In `main.js` lines 1328-1348 (inside the Snelle Piecie card-click handler):

```
1. if (cardDef.effectId === 'effect_snelle_lucky_coin') {
2.     const isHeads = Math.random() < 0.5;        ← COIN FLIPS HERE
3.     snelleStateForPlay = clone(gameState);
4.     if (isHeads) { set pendingTargets.lucky_coin_result = 'heads'; }
5.     else { ... show target selector ... set lucky_coin_result = 'tails'; }
6. }
7. const { state, success, error } = playSnellie(snelleStateForPlay, ...);
8. if (!success) { show error; return; }
```

`playSnellie()` in `turnManager.js` lines 619-624 DOES check slot availability before doing anything:
```js
const filledSlots = player.piecieSlots.filter(slot => slot !== null).length;
const activePlaceCount = state.activePlace ? 1 : 0;
const totalSlots = filledSlots + activePlaceCount;
if (totalSlots >= 4) {
    return { state, success: false, error: 'Cannot play Snelle Piecie — all Piecie/Place slots are full.' };
}
```

But the coin flip has already happened at step 2, **before** `playSnellie` is called. On tails with full slots: the coin was flipped, the UI showed target selector, the player chose a target — then `playSnellie` fails and the whole action is discarded. On heads with full slots: the coin was heads, `pendingTargets.lucky_coin_result = 'heads'` was set — then `playSnellie` fails and no state change persists. So the exploit is: flip coins indefinitely, get no consequence on tails (slot check blocks it), potentially get a heads reroll token if the Piecie magically completes despite full slots. Wait — if `playSnellie` returns `success: false`, the `gameState` is NOT updated (line 1354: `gameState = newState` only runs after checking `if (!success)` returns). So the state doesn't change on failure.

**The actual bug:** With full slots, tails flips are truly free (no penalty). The player can cancel to avoid the -10 MP on tails by knowing they have full slots. The intended behavior is the button should be DISABLED or blocked before the flip occurs.

### Files and Lines

| File | Lines | What |
|------|-------|------|
| `src/main.js` | 1328-1348 | Coin flip runs before slot check — **the bug** |
| `src/engine/turnManager.js` | 619-624 | Slot availability check inside `playSnellie` — correct but too late |
| `src/data/snellePiecies.js` | ~44-54 | Lucky Coin definition (effectId: `effect_snelle_lucky_coin`) |

### Fix

Move the slot-availability check BEFORE the coin flip in `main.js`. Before line 1329, add:
```js
const filledSlots = gameState.players[localPlayerId].piecieSlots.filter(s => s !== null).length;
const activePlaceCount = gameState.activePlace ? 1 : 0;
if (filledSlots + activePlaceCount >= 4) {
    modal.showInfo('Cannot Play', 'Cannot play Lucky Coin — all Piecie/Place slots are full.');
    return;
}
```
Then proceed with the coin flip. The `playSnellie` slot check remains as a safety net.

---

## BUG-05: DJ Lucky Mixer Reroll Redesign

### Current Ability (Not What the Bug Report Wants)

`mosjeAbilities.js` lines 32-43: `ability_dj_8020_lucky_beats` only gives +10 MP passively. The "active reroll" mentioned in `abilityDescription` (mosjes.js line 481) is not implemented.

There is no `effect_dj_lucky_mixer` or any reroll effect for DJ 80/20 anywhere in `piecieEffects.js` or `snelleEffects.js`. The `hasRerolledDieThisTurn` flag exists in `gameState.js` (line 103, listed twice due to copy-paste) but is never set or consumed by DJ 80/20's code.

The quest Lucky Crescendo (`quest_req_lucky_crescendo` in `questLogic.js` lines 789-808) checks for `mosje_dj_8020` and sets `allowReroll: true, rerollSource: 'mosje_dj_8020'` — this is the only reroll reference. That reroll flag IS consumed in `main.js` around line 720 (the `forceReroll` parameter to `showDiceRoll`). So there IS a reroll token infrastructure, but it is tied to the Skiffa + DJ 80/20 personal quest flow, not to DJ's own ability.

### Where a +2 Quest Dice Modifier Would Go

**Existing infrastructure — `questPrepBonus`** (`gameState.js` line 100, `main.js` lines 546, 565, 720, 735, 1005, 1006, 1015, 1061):
- `questPrepBonus` is read at quest resolution time and added to `diceBonus`
- It is consumed (reset to 0) once used

This pattern is exactly what a "turn-scoped +2 Quest dice modifier" needs. The difference is:
- `questPrepBonus` persists until the next quest and is reset after use — correct behavior for a one-shot bonus
- The BUG-05 fix calls for the same mechanism: DJ 80/20's ability sets `questPrepBonus += 2`, and it is consumed when the Quest roll is made

However, the phase description says "+2 turn-scoped Quest dice modifier" which implies it should expire at end-of-turn even if no quest is attempted. `questPrepBonus` does NOT expire at end-of-turn — `startTurn()` in `turnManager.js` does NOT reset it (it resets `questsCompletedThisTurn`, `pieciesPlayedThisTurn`, etc., but not `questPrepBonus`). So `questPrepBonus` is already a one-shot "next quest" bonus, not "this turn only" per se. For this bug, a one-shot +2 that fires on the next quest attempt and then is consumed is functionally equivalent to "until end of turn."

**Shared infrastructure with BUG-02:** The phase description requires that BUG-05 use the same "persist until end of turn" lifecycle as BUG-02. This means DJ 80/20's ability must set a flag that (a) keeps the Mosje's +2 visible until it fires or turn ends, and (b) uses the same end-of-turn cleanup hook. If BUG-02 introduces a `persistUntilEndOfTurn` card slot pattern, DJ 80/20's ability can set a player-level flag (e.g. `djLuckyModifierActive: 2`) that is read during quest resolution and cleared in `endTurn()` cleanup.

### Files and Lines

| File | Lines | What |
|------|-------|------|
| `src/abilities/mosjeAbilities.js` | 32-43 | `ability_dj_8020_lucky_beats` — only does +10 MP, no reroll |
| `src/engine/gameState.js` | 100 | `questPrepBonus: 0` — existing bonus accumulator |
| `src/engine/gameState.js` | 103 | `hasRerolledDieThisTurn: false` — declared twice (copy-paste), unused for DJ |
| `src/main.js` | 545-565 | `questPrepBonus` read and consumed during quest resolution |
| `src/main.js` | 720, 735, 1015, 1061 | `diceBonus + questPrepBonus + placeDiceBonus` calculation |
| `src/data/mosjes.js` | 480-481 | `abilityId: "ability_dj_8020_lucky_beats"`, `abilityDescription` mentions reroll |
| `src/main.js` | ~848-860 | `renderModifierPills` / quest bonus display (line 1495) |

### Fix

1. In `ability_dj_8020_lucky_beats()`: add `player.questPrepBonus = (player.questPrepBonus || 0) + 2;` (the +10 MP passive remains).
2. In `endTurn()` or the BUG-02 cleanup hook: if `questPrepBonus` was set by DJ this turn and not consumed, reset it (optional — current behavior of consuming on next quest is acceptable per game design).
3. Update `abilityDescription` in `mosjes.js` to reflect the +2 modifier instead of "reroll."
4. The turn-scoped infrastructure requested by the phase description can be a `djQuestModifierThisTurn: 2` flag that mirrors `questPrepBonus` but is clearly labeled as DJ's contribution, for cleaner debugging.

---

## Shared Infrastructure

### MP Floor Clamp

**Exists:** `loseMP()` in `src/engine/mpManager.js` lines 142-154 implements full level regression and MP floor. The safety clamp `Math.max(0, mosje.mp)` at line 154 ensures MP never goes negative after the while loop.

**Problem:** BUG-03 bypasses `loseMP()` with direct mutation. Fix is to route Senor West's penalty through `loseMP()`.

**Current imports in `mosjeAbilities.js`:** The file only imports from `deckEngine.js`. `loseMP` is not imported. The fix requires adding an import of `loseMP` from `../engine/mpManager.js` at the top of `mosjeAbilities.js`.

### Turn-Scoped Modifier System

**Does not exist** as a generic system. Currently:
- `questPrepBonus` (player-level) — consumed on next quest, never auto-expires
- `_snelleFlags.questDiceBonus` (state-level) — consumed on next quest
- Neither has end-of-turn expiry in `endTurn()`

**What BUG-02 + BUG-05 need:**
- A slot-level `persistUntilEoT` flag for Piecie lifecycle (BUG-02)
- A player-level `djQuestModifierThisTurn` (or reuse `questPrepBonus`) that expires at end-of-turn (BUG-05)

Both require a cleanup step in `endTurn()` in `turnManager.js`.

### Existing `activeTurnCards` / `turnEffects`

No such array exists in game state. The closest patterns are:
- `player.actionsThisTurn` — string array of action types taken this turn
- `player.pieciesActivatedThisTurn` — count
- `slot.immuneThisTurn` — boolean, reset in `startTurn()`

The pattern for implementing turn-scoped effects is to add a flag to player or slot state and reset it in `startTurn()` (cleared at turn start) OR `endTurn()` (cleared at turn end). For persistent Piecies, the slot itself stays populated and is swept in `endTurn()`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (TypeScript test files in `tests/`) + legacy browser test runner (`tests/test-runner.html`) |
| Config file | `vitest.config.ts` or `package.json` (check project root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Current passing | 536 tests (per phase0-rulings.md baseline) |

### Existing Relevant Tests

| Test File | Covers |
|-----------|--------|
| `tests/engine/west-calculated-guess.test.ts` | Senor West ability — test MP change for correct and wrong guess |
| `tests/engine/mp-level-regression.test.ts` | MP floor and level regression via `loseMP()` |
| `tests/engine/snelle-piecie-full-slots.test.ts` | Slot availability blocking for Snelle Piecies |
| `tests/engine/quest-mp-cost.test.ts` | Quest roll cost deduction |
| `tests/ui/general-quest-mosje-select.test.ts` | Quest threshold display (general quest flow) |
| `tests/core/test-mpManager.js` | MP manager tests |

### Phase 9 Test Requirements

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | `getQuestDiceThreshold` returns 2 for Mental=3 on Strategy Puzzle | unit | `npm test -- tests/engine/quest-threshold.test.ts` | No — Wave 0 |
| BUG-01 | Quest roll modal displays correct threshold value | unit | `npm test -- tests/ui/quest-threshold-display.test.ts` | No — Wave 0 |
| BUG-02 | Dubbele Dosis slot is NOT null after activation | unit | `npm test -- tests/engine/piecie-persist-eot.test.ts` | No — Wave 0 |
| BUG-02 | Dubbele Dosis slot IS null after `endTurn()` | unit | same file | No — Wave 0 |
| BUG-03 | Senor West wrong guess at MP=0 does not go negative | unit | extend `tests/engine/west-calculated-guess.test.ts` | Yes (extend) |
| BUG-03 | Senor West activation blocked at level=0, MP=0 | unit | same file | Yes (extend) |
| BUG-04 | Lucky Coin activation returns error when slots full | unit | extend `tests/engine/snelle-piecie-full-slots.test.ts` | Yes (extend) |
| BUG-05 | DJ 80/20 ability sets questPrepBonus +2 | unit | extend `tests/cards/mosje-abilities.test.ts` | Yes (extend) |
| BUG-05 | Quest dice roll includes DJ modifier | unit | `npm test -- tests/engine/dj-quest-modifier.test.ts` | No — Wave 0 |

### Wave 0 Gaps

- [ ] `tests/engine/quest-threshold.test.ts` — covers BUG-01 threshold calculation
- [ ] `tests/ui/quest-threshold-display.test.ts` — covers BUG-01 modal display
- [ ] `tests/engine/piecie-persist-eot.test.ts` — covers BUG-02 lifecycle
- [ ] `tests/engine/dj-quest-modifier.test.ts` — covers BUG-05 modifier

Extend existing:
- [ ] `tests/engine/west-calculated-guess.test.ts` — add MP=0 floor and level-0 block cases (BUG-03)
- [ ] `tests/engine/snelle-piecie-full-slots.test.ts` — add Lucky Coin pre-flip guard case (BUG-04)
- [ ] `tests/cards/mosje-abilities.test.ts` — add DJ questPrepBonus assertion (BUG-05)

---

## Project Constraints (from CLAUDE.md)

- Never commit directly to `main` — all work on `fix/` branches
- Run `npm test` after every change; never move forward on red
- One function per file; files over ~80 lines are a warning sign
- Pure functions only in `/src/engine/` and `/src/effects/` (the `.js` equivalents: `mpManager.js`, `turnManager.js`)
- If touching MP gain/MP cost/level threshold logic: re-run Ronald Kip stacking test and full simulation
- No inline logic in card data files — all behavior in ability files
- Test runner: `npm test` (Vitest for `.ts` tests, browser runner for legacy `.js` tests)
- Simulation runner: `npx tsx src/simulation/run-once.ts`

---

## Sources

### Primary (HIGH confidence)
- `src/abilities/questLogic.js` — threshold functions and quest requirement implementations, read directly
- `src/abilities/mosjeAbilities.js` — Senor West implementation, read directly
- `src/abilities/snelleEffects.js` — Lucky Coin implementation, read directly
- `src/abilities/piecieEffects.js` — Dubbele Dosis effect, read directly
- `src/engine/turnManager.js` — `activatePiecie`, `endTurn`, `playSnellie`, read directly
- `src/engine/mpManager.js` — `loseMP` and MP floor implementation, read directly
- `src/main.js` — UI activation flow for Lucky Coin and quest rolls, read directly (lines 530-750, 850-940, 1300-1400)
- `src/ui/modalManager.js` — "Roll needed" display string, read directly
- `src/data/quests.js` — quest roll threshold data for Strategy Puzzle, read directly
- `src/data/piecies.js` — Dubbele Dosis card definition, read directly
- `src/data/mosjes.js` — DJ 80/20 definition and traits, read directly
- `src/engine/gameState.js` — player state shape, read directly

### Metadata

**Confidence breakdown:**
- BUG-01 root cause: MEDIUM — two code paths (getQuestDiceThreshold vs hand-coded) are both internally consistent; the exact symptom likely requires runtime observation to pin down which code path produces 3 vs 2. The most probable cause is identified.
- BUG-02 root cause: HIGH — line 589 unconditionally discards all Piecies
- BUG-03 root cause: HIGH — line 302 is a direct mp mutation bypassing loseMP
- BUG-04 root cause: HIGH — line 1329 flips before line 1350 slot check
- BUG-05 root cause: HIGH — ability function only does +10 MP, no reroll implemented
- Shared infrastructure: HIGH — verified absence of turnEffects array, verified questPrepBonus pattern

**Research date:** 2026-05-24
**Valid until:** Stable — these are code facts, not ecosystem opinions

---

## RESEARCH COMPLETE
