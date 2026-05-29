# Phase 10: Deck Balance - Research

**Researched:** 2026-05-30
**Domain:** Game balance — deck composition, card effects, quest economy, engine draw-phase
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Digital Control deck composition:** Add piecie_keyboard x1, piecie_mouse x1, piecie_controller x1 to Digital Control. Do NOT remove existing cards.
2. **Digital Equipment MP scaling:** All three Equipment cards scale MP by active Mosje's level when a DIGITAL subtype Mosje is active: Lv1=15 MP, Lv2=25 MP, Lv3=40 MP. Non-Digital Mosje gets 5 MP base only. Flavor bonuses unchanged.
3. **Physical Force SUBSTANCE fallback:** Add piecie_grammetje_pieter x1 + piecie_tikker x1 to Physical Force.
4. **Artistic Rhythm SUBSTANCE fallback:** Add piecie_larry_zegeltje x1 + piecie_grammetje_pieter x1 to Artistic Rhythm.
5. **Quest economy:** All successMP +20. failMP capped at -20 (any failMP worse than -20 becomes -20).
6. **Deck-out rule:** When draw pile empty, reshuffle discard into deck + skip entire next turn (skipNextTurn flag on player). No draw, main, or quest phase during penalty turn.
7. **Rule documentation change:** Remove per-card-type deck limit rule from docs. Only 60-card cap applies. No code change needed.

### Claude's Discretion

None specified — all changes are locked.

### Deferred Ideas (OUT OF SCOPE)

- Passive MP trickle (+5/turn)
- Artistic post-bug-fix verification session
- Jeffrey FOOD/RESTORE restriction relaxation
- Custom deck builder
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BAL-01 | Digital Control stalling — too many draw-only cards, not enough reliable MP gain | Equipment scaling change + 3 Equipment cards added to deck |
| BAL-02 | Physical Force — lacks fallback when quests fail | grammetje_pieter + tikker added as SUBSTANCE fallback |
| BAL-03 | Artistic Rhythm — verify balance after Phase 8 fixes | larry_zegeltje + grammetje_pieter added; no engine change |
| BAL-04 | Quest cost vs reward economy | All successMP +20, failMP capped -20 in quests.js |
| BAL-05 | Deck-out vulnerability | Draw phase reshuffle + skipNextTurn flag in turnManager.js |
</phase_requirements>

---

## Summary

Phase 10 is a pure balance pass with five categories of change. Four are data-only or small effect tweaks; one (BAL-05 deck-out rule) requires a new player state flag and engine branching.

**The codebase has two turn-management layers.** There is the legacy `src/engine/turnManager.js` (the JavaScript file called by the live browser UI) and a newer TypeScript engine under `src/engine/` (.ts files — `start-turn.ts`, `end-turn.ts`, `advance-phase.ts`, etc.) used by the TypeScript card system and tests. Both layers must be updated for the deck-out rule. The CONTEXT.md references `turnManager.js` specifically, and that is the correct target for the browser game fix.

**Primary recommendation:** Make all five changes as discrete, isolated tasks — data change, data change, effect update, data change, engine addition — in that order. Each can be verified independently. The Equipment scaling update is the trickiest (adds `subtype` and `level` awareness to three effect functions). The deck-out rule is the only structural addition to engine logic.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deck composition changes | Data (starterDecks.js) | — | Pure data — no logic |
| Equipment MP scaling | Effects (piecieEffects.js) | — | Effect functions read player/Mosje state |
| Quest reward/penalty values | Data (quests.js) | — | Pure data — no logic in questLogic.js |
| Deck-out reshuffle | Engine (turnManager.js draw phase) | Engine (phaseDrawCard) | Draw phase owns deck state |
| skipNextTurn turn skip | Engine (turnManager.js startTurn) | Player state shape | Player state flag read at turn start |
| Documentation change | Docs (phase0-rulings.md) | — | No code enforcement exists |

---

## Standard Stack

### Core (relevant to this phase)
| File | Role | Notes |
|------|------|-------|
| `src/abilities/piecieEffects.js` | Equipment effect functions | `effect_keyboard`, `effect_mouse`, `effect_controller` live here |
| `src/data/piecies.js` | Piecie card definitions | All 3 Equipment and all 3 Substance cards already defined here |
| `src/data/starterDecks.js` | Starter deck compositions | Add cards to 3 decks |
| `src/data/quests.js` | Quest `successMP`/`failMP` values | 36 quests need updating |
| `src/engine/turnManager.js` | Turn lifecycle — draw phase | `phaseDrawCard()` is the exact insertion point |

### No new dependencies needed
All changes are internal. No new npm packages required.

---

## Architecture Patterns

### System Architecture Diagram

```
startTurn()
  ├── skipNextTurn check (NEW: if true, clear flag, return early)
  └── phaseDrawCard()
        ├── deck.length > 0 → draw normally
        └── deck.length === 0 (NEW: deck-out path)
              ├── shuffle discard → deck
              ├── draw 1 from reshuffled deck
              └── set player.skipNextTurn = true

activatePiecie()
  └── effect_keyboard/mouse/controller (MODIFIED)
        ├── check activeMosje.subtype === 'DIGITAL'
        ├── if DIGITAL: MP = {Lv1:15, Lv2:25, Lv3:40}
        └── if not DIGITAL: MP = 5 (base)

quests.js (DATA CHANGE)
  └── all entries: successMP += 20, failMP = max(failMP, -20)
```

### Recommended Project Structure
No new folders. All changes to existing files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shuffling discard pile | Custom shuffle | `shuffleDeck()` from `src/engine/deckEngine.js` | Already imported in turnManager.js at line 5 |
| Mosje subtype check | Custom type lookup | `player.activeSlots[si].cardId` → look up in MOSJES data | Subtype is on the Mosje definition, or use `activeMosje.subtype` if already stored in slot |
| Level-scaled MP | Custom branching | Simple if/else on `mosje.level` (1, 2, or 3) | No utility function needed |

---

## Key Findings — Detailed

### Finding 1: Equipment Effects — Current State vs. Needed State [VERIFIED: piecieEffects.js]

**Current `effect_keyboard` (lines 871–879):**
```js
export function effect_keyboard(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;
  const si = getFirstActiveSlotIndex(player);
  if (si >= 0) player.activeSlots[si].mp += 15;
  player.questPrepBonus = (player.questPrepBonus || 0) + 1;
  console.log('[ABILITY] Keyboard: +15 MP, +1 quest bonus (DIGITAL Mosjes)');
  return state;
}
```

**Current `effect_mouse` (lines 882–889):** Draws 1 card only. No MP gain at all currently.

**Current `effect_controller` (lines 891–900):** Gains +10 MP + draws 1. No Digital check.

**What CONTEXT.md requires:**
- All three: check if active Mosje has `subtype === 'DIGITAL'` (field: Mosje definition `subtype`)
- If DIGITAL: MP = `{ 1: 15, 2: 25, 3: 40 }[mosje.level]`
- If not DIGITAL: MP = 5 (base only)
- Keyboard keeps: draw 1 card
- Mouse keeps: look at top 2 cards of any deck (currently only draws 1 — needs fix)
- Controller keeps: next Quest roll +1

**How to read Mosje subtype:** The Mosje slot object (in `player.activeSlots[si]`) does NOT store `subtype` directly — the slot only has `cardId`, `mp`, `level`, `traits`, `statusEffects`, etc. [VERIFIED: turnManager.js createMosjeSlotFromDefinition, lines 728–743]. The subtype must be looked up from the MOSJES data by `cardId`.

**Pattern to follow:** `effect_ronald_kip` (line 73) looks up by `cardId` using `player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef')`. For Equipment, the check is: find the slot at `si`, get its `cardId`, look up in `MOSJES` array for `subtype === 'DIGITAL'`. The MOSJES import is already available in `turnManager.js` but NOT in `piecieEffects.js` — must import it, OR pass the check differently.

**Alternative approach (simpler):** Store `subtype` onto the slot object at `playMosje()` time in `turnManager.js` → `createMosjeSlotFromDefinition()`. This is the cleanest pattern because the slot already stores other definition-derived fields like `traits`. Add `subtype: mosjeDef.subtype` to the slot. Then Equipment effects can read `player.activeSlots[si].subtype` directly.

**Mosje.level field:** [VERIFIED: piecieEffects.js line 72] `effect_ronald_kip` reads `mosje.level` from the slot. The slot has a `level` integer (0 starts, 1/2/3 after level-ups). The CONTEXT.md table maps Lv1=15, Lv2=25, Lv3=40. Level 0 (not yet leveled) is an edge case — use the same as Lv1 (15 MP) since a Mosje at Lv0 is functionally pre-first-level-up.

### Finding 2: Tikker Effect — CONTEXT.md vs. Current Code [VERIFIED: piecieEffects.js lines 831–843]

**CONTEXT.md says:** "piecie_tikker: Gain 40 MP. Cannot attempt Quests next turn (SUBSTANCE)"

**Current `effect_tikker`:**
```js
export function effect_tikker(gameState, playerId) {
  // ...
  const roll = rollDie(6);
  const gain = roll * 5;      // <-- rolls 1d6, gains roll*5 MP (5-30 MP)
  player.activeSlots[si].mp += gain;
}
```

**This is a significant discrepancy.** The legacy `piecieEffects.js` Tikker rolls a d6 for MP (5–30 MP range). The `src/data/piecies.js` description says "Gain 40 MP. Cannot complete any Quests on your next turn (QUEST_BLOCKED status)." The newer TypeScript card definition `src/cards/piecies/conditional/tikker.ts` implements the flat +40 MP + `quest_locked` buff version.

**For Phase 10:** CONTEXT.md specifies Tikker should "Gain 40 MP. Cannot attempt Quests next turn (SUBSTANCE)." The plan needs to fix `effect_tikker` in `piecieEffects.js` to match: flat +40 MP + set `QUEST_BLOCKED` status. This is a bug-fix bundled into Phase 10.

**The QUEST_BLOCKED flag pattern:** The TypeScript engine uses `applyBuff("quest_locked", ...)` checked in `src/engine/quest-manager.ts` line 307. The legacy JavaScript engine uses `player.activeSlots[si].statusEffects` array for status effects. The plan must use the legacy pattern for consistency with the JS layer: push `{ type: 'QUEST_BLOCKED', value: 1, turnsLeft: 1 }` to `statusEffects`. The quest resolution code in `questLogic.js` must be checked to ensure `QUEST_BLOCKED` is handled. [ASSUMED: questLogic.js checks QUEST_BLOCKED — verify during execution].

### Finding 3: Deck-Out Rule — Insertion Points [VERIFIED: turnManager.js]

**`phaseDrawCard()` (lines 98–113):**
```js
export function phaseDrawCard(gameState, playerId, count = 1) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];

  if (player.deck.length === 0) {
    console.log('[ENGINE] Draw phase: deck is empty, no card drawn');
    return state;                        // <-- THIS IS WHERE DECK-OUT GOES
  }
  // ... normal draw
}
```

**`startTurn()` (lines 45–91):** Resets per-turn trackers then calls `phaseDrawCard()`. The `skipNextTurn` check must happen at the TOP of `startTurn()`, before any phase runs, to skip the entire turn.

**`shuffleDeck` import:** Already imported at line 5: `import { drawCards, shuffleDeck } from './deckEngine.js';`. No new import needed.

**skipNextTurn flag location:** Must be on `state.players[playerId]` (not on `activeSlots`). The player state shape in `turnManager.js` is a plain object with `deck`, `discard`, `hand`, `activeSlots`, `piecieSlots`, etc. Adding `skipNextTurn: true` is a new field — no type definitions to update for the JS layer. The end-of-turn sweep in `endTurn()` handles the existing per-turn flag resets. `skipNextTurn` should be cleared at the start of the skipped turn (checked → cleared → returned), not at the end of the prior turn.

**Implementation sketch for `phaseDrawCard`:**
```js
if (player.deck.length === 0) {
  if (player.discard.length === 0) {
    // Both empty — no cards to reshuffle, no penalty
    console.log('[ENGINE] Draw phase: deck AND discard empty, no draw');
    return state;
  }
  // Reshuffle discard into deck
  player.deck = shuffleDeck([...player.discard]);
  player.discard = [];
  // Draw 1 from reshuffled deck
  const { drawn, remaining } = drawCards(player.deck, 1);
  player.deck = remaining;
  player.hand.push(...drawn);
  // Set turn penalty
  player.skipNextTurn = true;
  console.log('[ENGINE] Draw phase: deck-out — reshuffled discard, drew 1, skip next turn set');
  return state;
}
```

**Implementation sketch for `startTurn` (at top, before tracker resets):**
```js
if (activePlayer.skipNextTurn === true) {
  activePlayer.skipNextTurn = false;
  console.log('[ENGINE] startTurn: skipNextTurn active — skipping this turn');
  // Advance to next player immediately
  const playerIds = getAllPlayerIds(state);
  const currentIndex = playerIds.indexOf(playerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  state.activePlayerId = playerIds[nextIndex];
  return state;
}
```

### Finding 4: Quest Economy — Complete Table [VERIFIED: quests.js]

The following lists all quest `successMP` / `failMP` values and their values after the Phase 10 change (successMP +20, failMP = max(current, -20)):

| Quest ID | Current successMP | New successMP | Current failMP | New failMP |
|----------|------------------|---------------|----------------|------------|
| quest_arm_wrestling | 40 | 60 | -60 | -20 |
| quest_parkour_challenge | 50 | 70 | -30 | -20 |
| quest_endurance_test | 35 | 55 | -15 | -15 |
| quest_sprint_race | 60 | 80 | -20 | -20 |
| quest_quick_thinking | 20 | 40 | -20 | -20 |
| quest_strategy_puzzle | 45 | 65 | -25 | -20 |
| quest_calculate_odds | 40 | 60 | -20 | -20 |
| quest_master_plan | 70 | 90 | -40 | -20 |
| quest_inspire_crowd | 50 | 70 | -15 | -15 |
| quest_form_alliance | 40 | 60 | -10 | -10 |
| quest_negotiation | 55 | 75 | -30 | -20 |
| quest_team_building | 35 | 55 | -10 | -10 |
| quest_artistic_expression | 40 | 60 | -10 | -10 |
| quest_improvise | 35 | 55 | -10 | -10 |
| quest_create_masterpiece | 65 | 85 | -20 | -20 |
| quest_lucky_break | 55 | 75 | -35 | -20 |
| quest_debug_system | 40 | 60 | -20 | -20 |
| quest_hack_mainframe | 70 | 90 | -40 | -20 |
| quest_build_gadget | 45 | 65 | -15 | -15 |
| quest_precision_work | 35 | 55 | -10 | -10 |
| quest_leap_of_faith | 60 | 80 | -20 | -20 |
| quest_survive_storm | 45 | 65 | -30 | -20 |
| quest_endure_pain | 40 | 60 | -10 | -10 |
| quest_never_give_up | 50 | 70 | -20 | -20 |
| quest_tough_it_out | 30 | 50 | 0 | 0 |
| quest_momentum_master | 60 | 80 | -40 | -20 |
| quest_the_gauntlet | 80 | 100 | -50 | -20 |
| quest_ultimate_challenge | 100 | 120 | -60 | -20 |
| quest_speed_run | 45 | 65 | -15 | -15 |
| quest_sustained_assault | 50 | 70 | -25 | -20 |
| quest_perfect_timing | 90 | 110 | 0 | 0 |
| quest_elimination_challenge | 30 | 50 | -30 | -20 |
| quest_chain_master | 65 | 85 | -25 | -20 |
| quest_synergy_mastery | 60 | 80 | -20 | -20 |
| quest_regelaar | 50 | 70 | -25 | -20 |
| quest_late_night_questing | 30 | 50 | -15 | -15 |
| quest_larry_temmen | 40 | 60 | -20 | -20 |
| quest_geen_raad_vraag_aad | 50 | 70 | -25 | -20 |
| quest_parkeren_delft | 35 | 55 | -35 | -20 |
| quest_shotje_obby | 45 | 65 | -20 | -20 |
| quest_west_perfect_read | 80 | 100 | -30 | -20 |
| quest_personal_iron_will | 90 | 110 | -30 | -20 |
| quest_personal_perfect_sync | 70 | 90 | -20 | -20 |
| quest_personal_lucky_crescendo | 80 | 100 | -10 | -10 |

**Quests with failMP that change:** arm_wrestling, parkour_challenge, master_plan, negotiation, lucky_break, hack_mainframe, survive_storm, momentum_master, the_gauntlet, ultimate_challenge, sustained_assault, elimination_challenge, chain_master, regelaar, geen_raad_vraag_aad, parkeren_delft, west_perfect_read, personal_iron_will. (18 quests have failMP capped from worse than -20 to -20.)

**Note on `description` fields:** The `description` string on each quest also embeds the MP values (e.g. "Success: +40 MP. Failure: -60 MP."). These should be updated to match, but are cosmetic only — the engine reads `successMP`/`failMP` fields directly.

### Finding 5: Starter Deck — Current Compositions [VERIFIED: starterDecks.js]

**Digital Control current piecies (8 cards):**
`pot_of_weed x2, kannetje_melk x2, quest_prep x2, affoe x1, slecht_gezet x1`
Adding: `piecie_keyboard x1, piecie_mouse x1, piecie_controller x1` → 11 piecies total.

**Physical Force current piecies (8 cards):**
`broodje_doner x2, affoe x2, quest_prep x2, pot_of_weed x1, slecht_gezet x1`
Adding: `piecie_grammetje_pieter x1, piecie_tikker x1` → 10 piecies total.

**Artistic Rhythm current piecies (8 cards):**
`kannetje_melk x2, affoe x2, pot_of_weed x2, quest_prep x1, slecht_gezet x1`
Adding: `piecie_larry_zegeltje x1, piecie_grammetje_pieter x1` → 10 piecies total.

**All 6 Substance/Equipment card IDs confirmed present in piecies.js:**
- `piecie_keyboard` ✓ (line 983)
- `piecie_mouse` ✓ (line 999)
- `piecie_controller` ✓ (line 1014)
- `piecie_grammetje_pieter` ✓ (line 883)
- `piecie_tikker` ✓ (line 936)
- `piecie_larry_zegeltje` ✓ (line 967)

### Finding 6: Two-Layer Engine Architecture [VERIFIED: src/engine/]

The codebase has **two distinct turn-management layers** that both need attention for the deck-out rule:

1. **Legacy JS layer** (`src/engine/turnManager.js`) — used by the live browser UI. This is the primary target per CONTEXT.md.
2. **TypeScript engine** (`src/engine/start-turn.ts`, `end-turn.ts`, `advance-phase.ts`) — used by the TypeScript card test system and simulation runner.

The TypeScript `PlayerState` (in `src/types/player-state.ts`) has a `flags: Record<string, unknown>` field, which is where a `skipNextTurn` flag would live in that layer. The TS layer's `startTurn` function does not currently handle per-player turn-skip logic. The deck/discard arrays in the TS player state use `ReadonlyArray<CardId>`.

**Phase 10 scope decision (ASSUMED):** CONTEXT.md only references the `turnManager.js` (JS) layer. For consistency with prior phases, only update the JS layer. If the simulation runner (which uses TS starter decks) needs deck-out handling too, that can be deferred.

### Finding 7: Tikker in Simulation vs. Browser [VERIFIED: simulation/starter-decks.ts, data/piecies.js]

The simulation starter decks use the TypeScript `tikker` card (id: `"tikker"` in `src/cards/piecies/conditional/tikker.ts`), which correctly implements +40 MP + `quest_locked` buff. The browser game uses the legacy `piecie_tikker` card (id `"piecie_tikker"`) via `effect_tikker` in `piecieEffects.js`, which currently rolls 1d6 and gains `roll * 5` MP — incorrect. Phase 10 must fix `effect_tikker` to match the spec (+40 MP flat, QUEST_BLOCKED next turn).

---

## Common Pitfalls

### Pitfall 1: Mosje subtype not stored in activeSlots
**What goes wrong:** Code checks `player.activeSlots[si].subtype` but field doesn't exist — returns `undefined`, condition always false, Digital check never fires.
**Why it happens:** `createMosjeSlotFromDefinition()` in turnManager.js does not copy `subtype` from mosjeDef.
**How to avoid:** Either (a) add `subtype: mosjeDef.subtype` to `createMosjeSlotFromDefinition()`, or (b) import MOSJES in piecieEffects.js and look up by cardId. Option (a) is cleaner and consistent with how `traits` are already copied.
**Warning signs:** Test passes with a Digital Mosje but shows base-only MP (5) instead of scaled MP.

### Pitfall 2: Forgetting to update `description` strings in quests.js
**What goes wrong:** successMP/failMP numbers are updated but the human-readable `description` field still shows old values — UI displays wrong numbers.
**Why it happens:** The `description` field is a separate string, not derived from successMP/failMP.
**How to avoid:** Update both `successMP`/`failMP` numbers AND the `description` string for each quest entry.

### Pitfall 3: skipNextTurn skip doesn't advance to next player
**What goes wrong:** `startTurn()` returns early when `skipNextTurn` is true, but `activePlayerId` is not advanced — the same player gets a blank turn in the UI and the game appears stuck.
**Why it happens:** `endTurn()` normally advances the player. If we return early from `startTurn()`, we must manually advance `activePlayerId` to the next player.
**How to avoid:** In the skip branch of `startTurn()`, advance `activePlayerId` before returning, exactly as `endTurn()` does it (via `getAllPlayerIds()` + index math).

### Pitfall 4: Deck-out with empty discard too
**What goes wrong:** deck.length === 0 AND discard.length === 0 — no cards to reshuffle. Attempting to draw from an empty deck after reshuffle throws or silently fails.
**Why it happens:** Late game with very small decks (Digital Control's 11-card deck can empty fast).
**How to avoid:** Check both: if discard is also empty, skip the reshuffle and do not set skipNextTurn (nothing to reshuffle, no penalty).

### Pitfall 5: Ronald Kip stacking test — successMP changes
**What goes wrong:** Changing successMP values may affect simulation outcomes tested in the Ronald Kip stacking test if that test uses a fixed sequence of quest outcomes with specific MP values.
**Why it happens:** The Ronald Kip test (CLAUDE.md) validates MP calculation stack order. If it uses hardcoded quest MP values, increasing successMP by 20 will break the expected total.
**How to avoid:** Run `npm test` after quest data changes and check specifically for Ronald Kip test failures. Adjust expected values in tests if needed.

### Pitfall 6: Tikker in JS layer uses rollDie, not flat gain
**What goes wrong:** The plan forgets to fix `effect_tikker` in `piecieEffects.js`, and the browser game continues to use the roll-based version. Physical Force deck now has Tikker but it still doesn't match the spec.
**Why it happens:** There are two Tikker implementations (TS and JS) and the JS one is wrong.
**How to avoid:** Explicitly include a task for fixing `effect_tikker` to +40 MP flat + QUEST_BLOCKED status effect.

---

## Code Examples

### Equipment MP Scaling Pattern (new logic to implement)
```javascript
// Source: piecieEffects.js pattern — modeled on effect_ronald_kip
export function effect_keyboard(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;
  const si = getFirstActiveSlotIndex(player);
  if (si < 0) return state;
  const mosje = player.activeSlots[si];

  // Digital subtype check — requires subtype stored on slot (see Pitfall 1)
  const isDigital = mosje.subtype === 'DIGITAL';
  let mp = 5;  // base for non-Digital
  if (isDigital) {
    const level = mosje.level || 1;
    mp = level === 3 ? 40 : level === 2 ? 25 : 15;
  }

  player.activeSlots[si].mp += mp;

  // Existing flavor bonus: draw 1 card
  if (player.deck.length > 0) player.hand.push(player.deck.shift());

  console.log(`[ABILITY] Keyboard: +${mp} MP${isDigital ? ' (Digital)' : ' (base)'}, drew 1`);
  return state;
}
```

### Subtype Storage in createMosjeSlotFromDefinition (addition needed)
```javascript
// Source: turnManager.js lines 728–743 — add subtype field
function createMosjeSlotFromDefinition(mosjeDef) {
  let mp = Number(mosjeDef.startMP || 0);
  if (mp > 0 && mp < 10) mp = 10;
  return {
    cardId: mosjeDef.id,
    name: mosjeDef.name,
    subtype: mosjeDef.subtype,   // ADD THIS LINE
    traits: { ...(mosjeDef.traits || {}) },
    mp,
    level: 0,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    immuneThisTurn: false,
    mpLostThisTurn: 0,
  };
}
```

### Deck-Out in phaseDrawCard (new branch)
```javascript
// Source: turnManager.js — replace the "deck is empty, no card drawn" branch
if (player.deck.length === 0) {
  if (player.discard.length === 0) {
    console.log('[ENGINE] Draw phase: deck AND discard empty — no draw, no penalty');
    return state;
  }
  // Reshuffle discard → deck
  player.deck = shuffleDeck([...player.discard]);
  player.discard = [];
  // Draw 1 card from reshuffled deck
  const { drawn, remaining } = drawCards(player.deck, 1);
  player.deck = remaining;
  player.hand.push(...drawn);
  // Penalty: skip entire next turn
  player.skipNextTurn = true;
  console.log('[ENGINE] Draw phase: deck-out — reshuffled discard, drew 1, skipNextTurn set');
  return state;
}
```

### skipNextTurn Check in startTurn (new guard)
```javascript
// Source: turnManager.js — insert at top of startTurn(), before tracker resets
const activePlayer = state.players[playerId];
if (activePlayer.skipNextTurn === true) {
  activePlayer.skipNextTurn = false;
  console.log(`[ENGINE] startTurn: ${playerId} skips turn (deck-out penalty)`);
  // Advance to next player
  const playerIds = getAllPlayerIds(state);
  const idx = playerIds.indexOf(playerId);
  state.activePlayerId = playerIds[(idx + 1) % playerIds.length];
  if ((playerIds.indexOf(state.activePlayerId)) === 0) {
    state.turnNumber += 1;
  }
  return state;
}
```

### Tikker fix (flat +40 MP + QUEST_BLOCKED)
```javascript
// Source: piecieEffects.js — replace effect_tikker
export function effect_tikker(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;
  const si = getFirstActiveSlotIndex(player);
  if (si < 0) return state;
  player.activeSlots[si].mp += 40;
  player.activeSlots[si].statusEffects.push({ type: 'QUEST_BLOCKED', value: 1, turnsLeft: 1 });
  console.log('[ABILITY] Tikker: +40 MP, QUEST_BLOCKED next turn');
  return state;
}
```

---

## Runtime State Inventory

> Omitted — this is not a rename/refactor/migration phase. No stored data, live service config, OS state, secrets, or build artifacts are affected.

---

## Open Questions

1. **questLogic.js QUEST_BLOCKED enforcement**
   - What we know: The TypeScript quest-manager reads `quest_locked` buff. The JS layer uses `statusEffects` array with `QUEST_BLOCKED`.
   - What's unclear: Does `questLogic.js` / the JS quest resolution path currently check for a `QUEST_BLOCKED` status effect before allowing an attempt?
   - Recommendation: Read `src/abilities/questLogic.js` during plan execution to verify. If missing, add the check as part of the Tikker fix task.

2. **Mouse "look at top 2" flavor — is it implemented?**
   - What we know: Current `effect_mouse` only draws 1 card. The piecies.js description says "look at top 2 cards of any deck." The CONTEXT.md states Mouse's flavor bonus is "look at top 2 cards of any deck."
   - What's unclear: Whether the plan should implement the full peek UI or just leave the draw-1 behavior.
   - Recommendation: Given Phase 10 is a balance pass, implement as draw 1 (existing) for now. The peek requires UI infrastructure. Document this as a deferred UI enhancement.

3. **`description` field update scope**
   - What we know: Each quest has a human-readable `description` string that also lists MP values.
   - What's unclear: Are description strings used in the UI, tests, or purely cosmetic?
   - Recommendation: Update them along with the data fields. Low risk, high correctness.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all changes are to existing in-repo source files).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts (inferred from scripts) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BAL-01 | Equipment MP scaling with Digital/non-Digital Mosje | unit | `npm test -- --reporter=verbose` | ❌ Wave 0 |
| BAL-02 | Physical Force deck contains grammetje_pieter + tikker | unit (schema) | `npm test` | ❌ Wave 0 |
| BAL-03 | Artistic Rhythm deck contains larry_zegeltje + grammetje_pieter | unit (schema) | `npm test` | ❌ Wave 0 |
| BAL-04 | All successMP +20 / failMP capped at -20 | unit (data integrity) | `npm test` | ❌ Wave 0 |
| BAL-05 | Deck-out reshuffles discard + sets skipNextTurn | unit (engine) | `npm test` | ❌ Wave 0 |
| BAL-05 | skipNextTurn causes turn to be skipped and advances player | unit (engine) | `npm test` | ❌ Wave 0 |
| BAL-05 (Tikker) | effect_tikker gives flat +40 MP + QUEST_BLOCKED | unit (effect) | `npm test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/engine/deck-out.test.ts` — covers BAL-05 draw phase + skipNextTurn behavior
- [ ] `tests/effects/equipment-scaling.test.ts` — covers BAL-01 Equipment MP by level and subtype
- [ ] `tests/data/deck-balance.test.ts` — covers BAL-02 through BAL-04 data integrity checks
- [ ] `tests/effects/tikker-flat-gain.test.ts` — covers Tikker +40 + QUEST_BLOCKED (bundled in BAL-02)

---

## Security Domain

> This phase makes no network calls, authentication changes, input validation changes, or cryptographic operations. No ASVS categories apply. Security domain is not applicable.

---

## Project Constraints (from CLAUDE.md)

- One function per file rule applies to any new test files and effect files
- All engine and effects functions must be pure (same input → same output, no mutation) — use `cloneState()` at top of each effect function
- Run `npm test` after every change; do not stack changes on a broken base
- Branch naming: use `fix/phase-10-deck-balance` or similar
- Never commit directly to `main`
- The Ronald Kip stacking test must pass after quest MP changes

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `questLogic.js` does not currently enforce QUEST_BLOCKED status effect on the JS layer | Finding 2 / Open Questions | If it already does, Tikker fix is simpler (just change the MP gain). If it doesn't, an extra fix to questLogic.js is needed. |
| A2 | Phase 10 only targets the JS turnManager.js layer, not the TS engine layer for deck-out | Finding 6 | If TS simulation runner also needs deck-out, a second set of changes is required in the TS layer |
| A3 | Mouse "look at top 2 cards" flavor bonus is deferred to UI phase (not implemented in Phase 10) | Finding 1 / Open Questions | If the plan expects full peek implementation, this needs UI work not currently scoped |

---

## Sources

### Primary (HIGH confidence)
- `src/abilities/piecieEffects.js` — effect_keyboard, effect_mouse, effect_controller, effect_tikker, effect_grammetje_pieter, effect_larry_zegeltje implementations
- `src/data/piecies.js` — card IDs, tags, subtypes for all 6 relevant cards
- `src/data/quests.js` — all 44 quest entries with current successMP/failMP values
- `src/data/starterDecks.js` — current deck compositions for all 3 starter decks
- `src/engine/turnManager.js` — phaseDrawCard(), startTurn(), createMosjeSlotFromDefinition()
- `src/data/mosjes.js` — Mosje subtype field ("DIGITAL", "FIGHTING", "ARTISTIC")
- `src/types/player-state.ts` — TypeScript PlayerState shape
- `docs/phase0-rulings.md` — canonical rules (deck-out rule: "If your deck is empty, shuffle your discard pile to form a new deck" — the turn-skip penalty is a new addition)

### Secondary (MEDIUM confidence)
- `src/cards/piecies/conditional/tikker.ts` — TypeScript Tikker implementation (confirms +40 MP + quest_locked is the canonical behavior)
- `src/engine/quest-manager.ts` — confirms `quest_locked` buff is the TS-layer pattern for Tikker QUEST_BLOCKED

### Tertiary (LOW confidence)
- None — all findings verified directly from source files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly
- Architecture: HIGH — execution paths traced through source code
- Pitfalls: HIGH — identified from actual code inspection
- Quest MP table: HIGH — computed directly from quests.js values

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (stable codebase, no fast-moving dependencies)
