# Phase 24: Interrupt Modal System — Research

**Researched:** 2026-06-04
**Domain:** UI interrupt flow, engine flag system, Piecie lifecycle
**Confidence:** HIGH — all findings verified by direct source reading

---

## Summary

The game already has the structural skeleton for interrupts: `canPlayerActNow` in `turnManager.js` (line 1031) explicitly allows Snelle Piecies at any time, `playBotSteps` in `main.js` is a `setTimeout`-based step animator that pauses between steps, and the engine's `_snelleFlags` system is the established pattern for proactive flag-setting. The three cards in scope each have a distinct problem: "Not Today!" works proactively but not reactively; "Emergency Healings" has no interrupt hook at all; "Laat me chillen!" is missing `persistUntilEndOfTurn: true` in its card definition and has no guard in `loseMP` for the `immuneThisTurn` pattern.

**Primary recommendation:** Implement a single `showInterruptModal(trigger, stateBeforeDamage)` function in `main.js` that is called from `playBotSteps` *before* applying a damage-dealing step, awaits the human's decision (play a card or pass), then resolves. No engine changes required for "Not Today!" or "Emergency Healings" — the existing flag-consumption paths in `markMosjeDefeated` and `loseMP` handle those. "Laat me chillen!" needs a one-line data fix.

---

## Q1 — Interrupt Timing: Is There an Async Pause in the Bot Step Loop?

**Finding:** YES — the entire bot animation loop is already `setTimeout`-based and is NOT async/await. Each step is applied synchronously, then `playBotSteps` schedules the next step via `setTimeout(fn, delay)`.

**How `playBotSteps` works** (`main.js:423–448`):
```
playBotSteps(steps, botName, index, delay=1000, onComplete)
  → setTimeout(() => {
      apply steps[index].state to gameState
      renderFromState(gameState)
      playBotSteps(steps, botName, index+1, delay, onComplete)  // recurse
    }, delay)
```

**The insert point:** Between applying `steps[index-1]` and applying `steps[index]`, the scheduler fires `setTimeout`. If we convert this loop to `async` and `await` a modal before each damage step, we have a clean pause point. The human can play a Snelle Piecie in that window.

**What driveBotTurnSteps returns:** An array of `{ state, label }` snapshots. Each snapshot is the RESULT of one bot action. There is no "before" snapshot per step — only the post-action state.

**Consequence for implementation:** To know whether a step caused damage to the human, we must compare the pre-step `gameState` with `steps[index].state` by diffing the human player's Mosje MP. Alternatively, we can inspect the step's `label` string for keywords like `activates`, `quests`.

---

## Q2 — Existing Interrupt Pattern: How Do Snelle Piecies Work Now?

**Finding:** Snelle Piecies are playable at any time via `handlePlayCard` in `main.js`. The UI passes `onPlay` to `renderHand` even when it's not the human's turn (`main.js:978-988`). `canPlayerActNow` (`turnManager.js:1031`) returns `true` for `'SNELLE_PIECIE'` regardless of turn ownership.

**What `onPlay` does:** Routes to `playSnellie(gameState, localPlayerId, cardRef, cardDef)` in `turnManager.js`, which executes the effect immediately and commits the new state.

**Gap:** During bot animation, `playBotSteps` applies `steps[index].state` directly to `gameState`, overwriting any card the human played while waiting. The human CAN click a Snelle Piecie card during the delay window, but the very next bot step will OVERWRITE the result. The hand-click path is not coordinated with the bot step loop.

**Extend-ability:** `playBotSteps` needs to be made async and pauseable. The cleanest pattern is to convert it from recursive-setTimeout to an async loop with `await interruptCheck(stateBeforeStep, stateAfterStep)`.

---

## Q3 — Laat me chillen! Lifecycle: Why Does It Disappear?

**Finding — the data definition** (`piecies.js:476–489`):
```js
{
  id: "piecie_laat_me_chillen",
  type: "PIECIE",
  subtype: "UTILITY",
  effectId: "effect_laat_me_chillen",
  // NO persistUntilEndOfTurn field
}
```

**Finding — activatePiecie sweep logic** (`turnManager.js:743–751`):
```js
if (knownCardDef.persistUntilEndOfTurn === true) {
  player.piecieSlots[safeSlotIndex].persistUntilEoT = true;
  player.piecieSlots[safeSlotIndex].faceDown = false;
} else {
  player.graveyard.push(toGraveyardEntry(slotCardId, 'played'));
  player.piecieSlots[safeSlotIndex] = null;   // ← card disappears here
}
```

**Root cause:** `persistUntilEndOfTurn` is missing from the card definition. Because it is absent, the `else` branch runs and the card is removed from the field immediately after activation.

**Fix:** Add `persistUntilEndOfTurn: true` to `piecie_laat_me_chillen` in `piecies.js`. No engine changes needed — the sweep in `endTurn` already handles `persistUntilEoT === true` cards.

**Precedent:** Battle Concert and other persistent Piecies already use `persistUntilEndOfTurn: true` in their definitions and stay visible until EoT.

---

## Q4 — MP_LOSS_REDUCTION Coverage: Does loseMP Apply It for All Damage Sources?

**Finding** (`mpManager.js:154–168`):
```js
// MP_LOSS_REDUCTION: pushed by Laat me chillen (value:20), FF Haaltje Nemen
const reductionEffect = mosje.statusEffects?.find(
  e => e.type === 'MP_LOSS_REDUCTION' && e.turnsLeft > 0
);
if (reductionEffect) {
  lossAmount = Math.max(0, lossAmount - reductionEffect.value);
  reductionEffect.turnsLeft -= 1;
}
```

**Result:** `MP_LOSS_REDUCTION` applies to ALL `loseMP` calls regardless of `source`. The only MP-loss path that bypasses `loseMP` entirely is the local `applyDamage` helper inside `piecieEffects.js` (lines 28–38), which directly mutates `mosje.mp` without calling `loseMP`. Cards using `applyDamage` internally (e.g. Varkenspootjes, bot-resolved damage) bypass the reduction.

**Also noted:** `applyStatusEffectMP` in `mpManager.js` (line 244) directly increments/decrements `mosje.mp` without calling `loseMP`, so status-effect-based periodic damage also bypasses the reduction. This is likely intentional (tick damage from status effects is not the same as burst damage).

**Conclusion for Laat me chillen!:** The reduction DOES work for quest fail MP loss (`resolveQuest` calls `loseMP`) and for Piecie effects that route through `loseMP`. The only gap is `piecieEffects.applyDamage` direct calls.

---

## Q5 — Not Today! Graveyard Text Fix

**Finding** (`snellePiecies.js:143–150`):
```js
{
  id: "snelle_negate_elimination",
  name: "Not Today!",
  description: "Play when your Mosje would be sent to Welloe pile: negate. Mosje stays at 5 MP instead.",
}
```

**The string to fix:** `"Welloe pile"` should be `"graveyard"`.

**Corrected description:** `"Play when your Mosje would be sent to the graveyard: negate. Mosje stays at 5 MP instead."`

**Location:** `src/data/snellePiecies.js`, line 146.

---

## Q6 — Bot Damage Hooks: Where Does the Bot Deal MP Loss to the Human?

All bot damage flows through `driveBotTurnSteps` in `botDriver.js`. The steps where the human could take damage:

| Bot Action | Where Damage Happens | Source tag | Calls loseMP? |
|---|---|---|---|
| Quest resolution (fail) | `resolveQuest` → `loseMP(state, targetPlayerId, slot, failMP, 'QUEST')` | QUEST | YES |
| Piecie activation (ATTACK tag) | `activatePiecie` → `piecieEffects[effectId](state, botId)` → usually `applyDamage` | varies | SOMETIMES (applyDamage bypasses) |
| Mosje ability | `useMosjeAbility` → `mosjeAbilities[abilityId]` | varies | varies |
| Varkenspootjes (bot-resolved) | `resolveBotVarkenspootjesPending` → direct `slot.mp -= 30` | none | NO — direct mutation |

**Step labels to detect damage steps:** `label` strings from `driveBotTurnSteps`:
- Quest: `'quests "QuestName" — ✓ success'` or `'quests "QuestName" — ✗ failed'`
- Piecie activation: `'activates laat me chillen'` etc.
- Ability: `'uses MosjeName\'s ability'`

**Detection strategy for interrupt modal:** Before applying each step, diff `humanPlayer.activeSlots[i].mp` between `previousState` and `steps[index].state`. If any human Mosje has LOWER mp in the new state, fire the interrupt window.

---

## Architecture: Recommended Implementation

### Interrupt modal trigger

Convert `playBotSteps` to an async function. Before applying each step, run:

```js
async function playBotSteps(steps, botName, index, delay, onComplete) {
  if (index >= steps.length) { if (onComplete) onComplete(); return; }

  const prevState = gameState;
  const nextState = steps[index].state;
  const label = steps[index].label;

  // Check if human takes damage in this step
  const interruptNeeded = humanTakesDamageOrElimination(prevState, nextState, localPlayerId);

  if (interruptNeeded) {
    const interrupted = await showDamageInterruptModal(prevState, nextState, localPlayerId);
    if (interrupted) {
      // Human played a reactive card — re-run the bot step from prevState + human action
      // The human's card was already applied to `gameState` by handlePlayCard inside the modal
      // Recalculate next step? Or accept state divergence?
      // Simplest: accept that the modal applied the human's card to gameState, then apply
      // the bot's step on top of the modal-modified gameState
    }
  }

  // Apply bot step
  gameState = nextState;  // (or re-derive if human card changed prevState)
  renderFromState(gameState);
  log.add('quest', `${botName} ${label}`);
  ...
  setTimeout(() => playBotSteps(steps, botName, index+1, delay, onComplete), delay);
}
```

**Problem with state ordering:** `driveBotTurnSteps` computed all steps from the original `gameState` at the start of the bot's turn. If the human plays a card mid-way (changing state), the subsequent pre-computed steps are stale.

**Recommended solution:** For "Emergency Healings" and "Not Today!" specifically, the human's action just sets a flag on the CURRENT gameState. When the bot step is applied next, the flag is already there and the engine consumes it naturally. So:

1. Pause before a damage step
2. Human plays their Snelle Piecie — this updates `gameState` (the live mutable reference) via `playSnellie`
3. Resume: apply `steps[index].state` — BUT this overwrites `gameState` with the pre-computed state that doesn't include the human's flag

**Solution to the overwrite problem:** Apply the bot step's diff (not its full state snapshot) to the current `gameState`. This requires extracting the delta from `prevState → steps[index].state` and applying it to the human-modified `gameState`. This is complex.

**Simpler alternative:** When interrupting, discard the pre-computed remaining steps and re-run `driveBotTurnSteps` from the current (human-modified) gameState. This is safe because the bot's remaining actions are deterministic (same hand, same field).

**Simplest viable approach for Phase 24:** Pause, show the modal, play the human card directly against `gameState`, then re-compute `steps` from the new `gameState`. Continue from step 0 of the new steps (skipping already-applied actions by tracking which step we're at).

### showDamageInterruptModal shape

Reuse `showOptionSelect` from `modalManager.js`:

```js
async function showDamageInterruptModal(prevState, nextState, humanPlayerId) {
  // 1. Compute damage delta to show context
  const damageSummary = getDamageSummary(prevState, nextState, humanPlayerId);

  // 2. Find playable interrupt cards in human's hand
  const interruptCards = getPlayableInterruptCards(prevState, humanPlayerId, damageSummary);

  if (interruptCards.length === 0) return false; // nothing to show

  // 3. Show modal — "Bot will deal X damage. Play a card?"
  const choice = await modal.showOptionSelect({
    title: 'Damage Interrupt',
    prompt: `${damageSummary}. Play a Snelle Piecie?`,
    options: [
      ...interruptCards.map(c => ({ id: c.id, label: c.name, metaLabel: c.description })),
      { id: '__pass__', label: 'Pass — take the damage' },
    ],
    allowCancel: false,
  });

  if (choice === '__pass__' || !choice) return false;

  // 4. Route to handlePlayCard equivalent for the chosen card
  await handleInterruptCardPlay(choice, humanPlayerId);
  return true;
}
```

### Not Today! — no engine changes needed

The existing flow in `effect_snelle_negate_elimination` sets `_snelleFlags.negateNextElimination[playerId] = true`. `markMosjeDefeated` checks and consumes this flag. As long as the human plays "Not Today!" BEFORE the bot step that calls `markMosjeDefeated` is applied to `gameState`, the flag will be present and the card will work reactively. The interrupt modal window achieves this.

### Emergency Healings — small engine fix needed

`effect_snelle_emergency_healings` (`snelleEffects.js:63–74`) currently only heals when MP is already at 0. Its condition:
```js
if (mosje.mp <= 0) mosje.mp = 30;
```
This means if the human plays it preemptively (before damage), it does nothing unless the Mosje is already at 0 MP. For interrupt use (play it BEFORE damage hits), the description says "restore to 30 MP" — which only makes sense at 0 MP. Alternatively, allow it to heal 25 MP regardless (per the older `effect_emergency_healings` function at line 8). The correct semantic for interrupt use is: **play when damage would bring you to 0 or below, restore to 30 MP instead**. This requires no engine change — it works correctly when played in the interrupt window, since the damage hasn't been applied yet. The flag path is not needed; the card directly heals, and then the damage step applies afterward, keeping HP positive.

### Laat me chillen! — data fix only

Add `persistUntilEndOfTurn: true` to the card definition in `piecies.js`. No engine changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---|---|---|
| Async pause in bot loop | Custom Promise/event system | Convert `playBotSteps` to `async`, use `await` |
| Interrupt card picker UI | New modal component | Reuse `modal.showOptionSelect` from `modalManager.js` |
| Persistent card lifecycle | Custom sweep logic | `persistUntilEndOfTurn: true` flag + existing `endTurn` sweep |
| Damage detection | Custom diff engine | Simple MP comparison on `humanPlayer.activeSlots[i].mp` |

---

## Common Pitfalls

### Pitfall 1: Bot step state overwrites human interrupt card
**What goes wrong:** Human plays "Not Today!" during the pause. `gameState` now has the flag. But `steps[index].state` was pre-computed without the flag. Applying it wipes the flag.
**How to avoid:** After human plays interrupt, re-derive remaining steps by re-calling `driveBotTurnSteps(gameState, botId)` from the updated state. Skip to the equivalent step index. Or do not apply `steps[index].state` blindly — instead apply the bot's action function directly against current `gameState`.

### Pitfall 2: Interrupt modal shown for non-damage steps
**What goes wrong:** Showing the modal for every bot step (even turn-start trickle, draw, etc.) annoys the human.
**How to avoid:** Only show the modal when `humanTakesDamageOrElimination` detects a net MP decrease on any human Mosje slot.

### Pitfall 3: Emergency Healings condition
**What goes wrong:** `effect_snelle_emergency_healings` at line 63 only heals when `mosje.mp <= 0`. In an interrupt, the damage hasn't happened yet, so the Mosje won't be at 0. The card appears playable but does nothing.
**How to avoid:** Either change the condition to `mosje.mp <= 30` (heal to 30 always if below threshold) or change to a flat `+25 MP` for interrupt use. The card description says "restore to 30 MP" — update condition to always restore to 30 MP when played (remove the `<= 0` guard). Alternatively: show the card as playable in the interrupt window only if `humanMosje.mp - incomingDamage <= 0`, matching the "would reach 0" text.

### Pitfall 4: Laat me chillen! is a PIECIE not a SNELLE_PIECIE
**What goes wrong:** Laat me chillen! requires being placed face-down one turn, then activated the next. It CANNOT be played as a reactive interrupt the same way Snelle Piecies can. The phase description conflates "interrupt hook" (the "not today" / "emergency healings" use case) with "reactive play" — but Laat me chillen! is a regular Piecie that must be activated on the player's own turn ahead of time.
**Correct scope:** For Laat me chillen!, the only fix is (a) `persistUntilEndOfTurn: true` so the card stays visible, and (b) verify that `loseMP` correctly applies the reduction. No interrupt modal needed for this card.

### Pitfall 5: Interrupt modal during online/multiplayer
**What goes wrong:** In Firebase multiplayer, the bot doesn't run locally. `playBotSteps` with the interrupt hook only works in offline mode. Online mode uses `onRemoteState` to receive opponent actions — the interrupt hook never fires.
**How to avoid for Phase 24:** Scope interrupt modal to `isOffline` mode only. Document the online multiplayer case as out-of-scope deferred work.

---

## Not Today! — Current vs Intended Behavior

| Aspect | Current | Target |
|---|---|---|
| Activation | Proactive (play before threat) | Reactive (play when defeat is about to happen) |
| Flag set by | `effect_snelle_negate_elimination` sets flag proactively | Same — flag set when human plays card during interrupt window |
| Flag consumed | `markMosjeDefeated` (line 105) | Same — no engine change needed |
| Trigger | Human plays from hand anytime | Human plays during interrupt modal window before bot damage step |

---

## Files to Change

| File | Change |
|---|---|
| `src/main.js` | Convert `playBotSteps` to async; add `showDamageInterruptModal`; add `humanTakesDamageOrElimination` helper |
| `src/data/piecies.js` | Add `persistUntilEndOfTurn: true` to `piecie_laat_me_chillen` |
| `src/data/snellePiecies.js` | Fix "Welloe pile" → "graveyard" in Not Today! description |
| `src/abilities/snelleEffects.js` | Fix `effect_snelle_emergency_healings` condition (remove `<= 0` guard or adjust threshold) |

**No changes needed to:**
- `victoryChecker.js` — `markMosjeDefeated` already checks `negateNextElimination` flag
- `mpManager.js` — `loseMP` already applies `MP_LOSS_REDUCTION` for all sources
- `turnManager.js` — `canPlayerActNow` already allows Snelle Piecies at any time
- `snelleEffects.js:effect_snelle_negate_elimination` — flag logic is correct

---

## Open Questions (RESOLVED)

1. **What is the exact interrupt window trigger condition?**
   - Option A: Any step where human Mosje MP decreases (simplest)
   - Option B: Only steps where human Mosje would reach 0 or be eliminated (less intrusive)
   - RESOLVED: Option B — interrupt fires when damage ≥ 30 MP OR would cause elimination. Implemented in Plan 24-02 Task 2.

2. **Emergency Healings fix scope**
   - The `effect_snelle_emergency_healings` function has a duplicate definition: `effect_emergency_healings` (line 8, the old one) and `effect_snelle_emergency_healings` (line 63, the new alias used by the card data). The old function heals 25/35 MP unconditionally; the new one only heals when `mp <= 0`. Should the new function match the old behavior (flat heal) or become truly reactive?
   - RESOLVED: Match old behavior — flat +25 MP (or +35 with resilient), remove the `<= 0` condition. Implemented in Plan 24-01 Task 2.

3. **Re-computing bot steps after interrupt**
   - After human plays a card during interrupt, do we re-run `driveBotTurnSteps` or apply the original step on top of the modified state?
   - RESOLVED: Re-run `driveBotTurnSteps` from modified gameState and restart from step 0. Simpler and safe. Implemented in Plan 24-02 Task 2.

---

## Sources

All findings from direct source reading in this session. No external references needed.

| File | Lines Read | Confidence |
|---|---|---|
| `src/engine/victoryChecker.js` | 1–145 (full) | HIGH |
| `src/engine/mpManager.js` | 1–288 (full) | HIGH |
| `src/engine/turnManager.js` | 1–1167 (full) | HIGH |
| `src/abilities/snelleEffects.js` | 1–320 (full) | HIGH |
| `src/abilities/piecieEffects.js` | 1–100, 500–537 | HIGH |
| `src/data/snellePiecies.js` | 1–321 (full) | HIGH |
| `src/data/piecies.js` | 470–489 | HIGH |
| `src/bot/botDriver.js` | 1–388 (full) | HIGH |
| `src/ui/modalManager.js` | 1–858 (full) | HIGH |
| `src/main.js` | Selected ranges (390–448, 620–668, 960–1010, 2090–2190) | HIGH |
