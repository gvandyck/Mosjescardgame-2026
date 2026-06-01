# Phase 12: Implement Unfinished Mechanics & Stubs — Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 6 (mpManager.js, victoryChecker.js, turnManager.js, piecieEffects.js, snelleEffects.js, modalManager.js)
**Analogs found:** 6 / 6 — all files are existing files being modified, with strong internal patterns to mirror

---

## File Classification

| Modified File | Role | Data Flow | Closest Internal Analog | Match Quality |
|---|---|---|---|---|
| `src/engine/mpManager.js` — `loseMP()` | engine/reducer | request-response | `dierenasielActive` block (lines 131–134) + `negateNextPiecie` block (lines 101–105) | exact |
| `src/engine/victoryChecker.js` — `markMosjeDefeated()` | engine/reducer | event-driven | `negateNextElimination` block (lines 94–99) | exact |
| `src/engine/turnManager.js` — `activatePiecie()` | engine/orchestrator | event-driven | `doubleNextPiecie` block already written (lines 593–597) | exact |
| `src/abilities/piecieEffects.js` — push sites | ability/effect | transform | `effect_kleine_taks` statusEffect push (lines 296–300) | exact |
| `src/abilities/snelleEffects.js` — `effect_ff_haaltje_nemen` | ability/effect | transform | `effect_snelle_counter_strikka` flag-set pattern (lines 126–133) | role-match |
| `src/ui/modalManager.js` — Wave 4 flag consumers | UI/modal | request-response | `showOptionSelect` + `showCardChoice` (lines 496–537, 230–265) | exact |

---

## Pattern Assignments

### `src/engine/mpManager.js` — `loseMP()` (STUB-01, STUB-02, STUB-09)

**Role:** engine reducer — pure function, returns new state, never mutates.

**Core insertion pattern — the `dierenasielActive` block (lines 131–134) is the template:**

```javascript
// Dierenasiel passive: PET protection reduces any incoming loss by 25%.
if (state.dierenasielActive) {
  lossAmount = Math.floor(lossAmount * 0.75);
  console.log('[MP] Dierenasiel: PET protection — reduced loss to', lossAmount);
}
```

All new status-effect checks in `loseMP()` MUST be placed in the same "snelle interception" block (lines 97–135), BEFORE `mosje.mp -= lossAmount` at line 137. The block already has this structure:

```javascript
// ── Snelle Piecie interception flags ─────────────────────────────────────
const snelleFlags = state._snelleFlags || {};

// [existing flag checks: negateNextPiecie, negateNextAttack, drainReversal]

// Dierenasiel passive  ← insert STUB-01 and STUB-02 checks BEFORE this line
if (state.dierenasielActive) {
  lossAmount = Math.floor(lossAmount * 0.75);
  ...
}
// ── End snelle interception ───────────────────────────────────────────────

mosje.mp -= lossAmount;   // ← lossAmount is finalized here
```

**STUB-01 (MP_LOSS_HALVED) — exact pattern to insert before `dierenasielActive` check:**

```javascript
// MP_LOSS_HALVED: statusEffect pushed by Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes
const halvingEffect = mosje.statusEffects?.find(
  e => e.type === 'MP_LOSS_HALVED' && e.turnsLeft > 0
);
if (halvingEffect) {
  lossAmount = Math.ceil(lossAmount / 2);
  halvingEffect.turnsLeft -= 1;
  console.log('[MP] MP_LOSS_HALVED: loss halved to', lossAmount);
}
```

Note: `Math.ceil` (round up) matches CONTEXT.md decision. `turnsLeft -= 1` mirrors `effect.turnsLeft -= 1` in `applyStatusEffectMP` (line 217).

**STUB-02 (MP_LOSS_REDUCTION) — exact pattern to insert after STUB-01 check:**

```javascript
// MP_LOSS_REDUCTION: pushed by Laat me chillen (value:20), FF Haaltje Nemen (value:20/30)
// Also covered: snelleFlags.mpLossReduction from The Protector
const reductionEffect = mosje.statusEffects?.find(
  e => e.type === 'MP_LOSS_REDUCTION' && e.turnsLeft > 0
);
if (reductionEffect) {
  lossAmount = Math.max(0, lossAmount - reductionEffect.value);
  reductionEffect.turnsLeft -= 1;
  console.log('[MP] MP_LOSS_REDUCTION: loss reduced by', reductionEffect.value, '→', lossAmount);
}
// Consolidate snelle flag into the same read point (preferred per CONTEXT.md)
if (snelleFlags.mpLossReduction?.[playerId]) {
  lossAmount = Math.max(0, lossAmount - snelleFlags.mpLossReduction[playerId]);
  console.log('[MP] Snelle Protector: loss reduced by', snelleFlags.mpLossReduction[playerId]);
  delete state._snelleFlags.mpLossReduction[playerId];
}
```

**STUB-09 (Dierenasiel 0-MP guard) — NOT in loseMP; goes in ability activation caller:**

The existing `dierenasielActive` check (line 131) already handles MP reduction. The missing zero-MP guard is in the ability activation path in `mosjeAbilities.js` / `turnManager.js`. Pattern to match: the existing Jeffrey guard in `activatePiecie` (lines 543–550):

```javascript
// Jeffrey The Strongman: cannot use FOOD or RESTORE Piecies
const jeffreyActive = player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_jeffrey');
if (jeffreyActive) {
  const blocked = ['FOOD', 'RESTORE'];
  if (knownCardDef.tags?.some(t => blocked.includes(t))) {
    console.log('[ENGINE] Jeffrey The Strongman blocks FOOD/RESTORE Piecies');
    return { state, success: false, error: 'Jeffrey The Strongman cannot use FOOD or RESTORE Piecies' };
  }
}
```

The Dierenasiel guard should follow the same guard shape — but instead of blocking, it ALLOWS 0-MP PET activations by skipping the MP cost deduction.

---

### `src/engine/victoryChecker.js` — `markMosjeDefeated()` (STUB-03)

**Role:** engine reducer — marks knockouts and checks win conditions.

**The `negateNextElimination` block (lines 94–99) is the EXACT template for WELLOE_SHIELD:**

```javascript
// "Not Today!" — negate_elimination flag: stay at 5 MP instead of being sent to Welloe
const negateFlag = state._snelleFlags?.negateNextElimination;
if (negateFlag?.[playerId]) {
  delete state._snelleFlags.negateNextElimination[playerId];
  state.players[playerId].activeSlots[slotIndex].mp = 5;
  console.log(`[ENGINE] Not Today! saved ${mosje.name} — restored to 5 MP`);
  return state;
}
```

**STUB-03 (WELLOE_SHIELD) — insert BEFORE the `negateNextElimination` check, same function:**

```javascript
// WELLOE_SHIELD: pushed by Mosje Shield Piecie. Protects from Welloe pile for turnsLeft turns.
const shieldEffect = mosje.statusEffects?.find(
  e => e.type === 'WELLOE_SHIELD' && e.turnsLeft > 0
);
if (shieldEffect) {
  shieldEffect.turnsLeft -= 1;
  state.players[playerId].activeSlots[slotIndex].mp = 1;
  console.log(`[ENGINE] WELLOE_SHIELD: ${mosje.name} protected — restored to 1 MP`);
  return state;
}
```

Key structural notes:
- Access `mosje` the same way the existing code does: `const mosje = state.players[playerId].activeSlots[slotIndex];` (line 90)
- Use deep clone already at top of function: `const state = JSON.parse(JSON.stringify(gameState));` (line 89) — do NOT re-clone
- Return early just like the negateNextElimination block

---

### `src/engine/turnManager.js` — `activatePiecie()` (STUB-04, STUB-05, STUB-07, STUB-08)

**Role:** engine orchestrator — pure, dispatches to effect functions.

**STUB-05 (`doubleNextPiecie`) — already implemented, lines 593–597:**

```javascript
// Dubbele Temminks: double-trigger
if (flags.doubleNextPiecie?.[playerId]) {
  delete state._snelleFlags.doubleNextPiecie[playerId];
  state = effectFn(state, playerId);
  console.log('[ENGINE] Dubbele Temminks: effect triggered twice');
}
```

This is the working reference for STUB-05. The flag is already consumed at the right point (after the first `effectFn` call at line 591). No change needed here — STUB-05 is already implemented per inspection.

**STUB-04 (`negateNextSearch`) — insertion point is `phaseDrawCard()` (lines 124–151):**

The draw function follows the same `JSON.parse(JSON.stringify(gameState))` clone at line 125. The check should go BEFORE `player.deck` is accessed, mirroring the existing snelleFlags pattern in `loseMP`:

```javascript
// negateNextSearch: Jammertje Gepakt flag — negate opponent-triggered search/draw
// Only applies when this draw is opponent-triggered (not the natural turn draw).
// Check: if called from an opponent's Piecie effect (not phaseDrawCard from startTurn)
const oppId = Object.keys(state.players).find(id => id !== playerId);
if (oppId && state._snelleFlags?.negateNextSearch?.[oppId]) {
  delete state._snelleFlags.negateNextSearch[oppId];
  console.log('[ENGINE] Jammertje Gepakt: opponent search/draw negated for', playerId);
  return state;
}
```

NOTE from CONTEXT.md: "Regular turn draw is NOT negated — only opponent-triggered searches/draws." This means the check only fires when `phaseDrawCard` is called with `isOpponentTriggered = true` (a new optional parameter to add). Natural `startTurn` calls do NOT pass this parameter.

**STUB-07 (`_dingetjeTochActive`) — already commented at lines 552–554:**

```javascript
// Dingetje Toch wildcard: if state._dingetjeTochActive is true, the UI layer must bypass
// any single failing trait/type requirement before calling activatePiecie, then clear the flag.
// state._dingetjeTochActive = false  ← consumed by UI piecie activation validator, not here.
```

This means the engine side already handles the design intent. The implementation goes in the UI-side requirement validator (not in `activatePiecie` itself). The UI validator reads `state._dingetjeTochActive` before blocking a play, then clears it. Pattern: same as `state._baggaDiscard` flag checked by UI after card resolution.

**STUB-08 (SNOEIERTJE_COST dead push) — `effect_snoeiertje` in `piecieEffects.js` lines 265–266:**

```javascript
// REMOVE this dead push — questBonusMP already does the work:
player.activeSlots[si].statusEffects.push({ type: 'SNOEIERTJE_COST', value: -15, turnsLeft: 1 });
```

---

### `src/abilities/piecieEffects.js` — status effect push sites (STUB-01, STUB-02, STUB-03)

**Role:** ability/effect — pure transform, returns cloned state.

**Existing working push pattern — `effect_kleine_taks` (lines 296–300):**

```javascript
state.players[oppId].activeSlots[osi].statusEffects.push(
  { type: 'KLEINE_TAKS', value: -10, turnsLeft: 4 }
);
```

**All MP_LOSS_HALVED push sites (value was zeroed as corruption-prevention) — restore to real value:**

Current (broken) pattern in `effect_bowie_stormey`, `effect_tony`, `effect_gekke_vogels`, `effect_katjegang`, `effect_vianna_poes` (e.g., line 742):
```javascript
slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 0, turnsLeft: 2 });
```

Fixed pattern (value is irrelevant for HALVED — the check reads type only, but remove confusion):
```javascript
slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
```

**MP_LOSS_REDUCTION push sites — restore value from 0:**

`effect_laat_me_chillen` (line 501):
```javascript
// Current (broken):
player.activeSlots[si].statusEffects.push({ type: 'MP_LOSS_REDUCTION', value: 0, turnsLeft: 1 });
// Fixed:
player.activeSlots[si].statusEffects.push({ type: 'MP_LOSS_REDUCTION', value: 20, turnsLeft: 1 });
```

**WELLOE_SHIELD push site — restore value from 0:**

`effect_mosje_shield` (line 521):
```javascript
// Current (broken):
player.activeSlots[si].statusEffects.push({ type: 'WELLOE_SHIELD', value: 0, turnsLeft: 2 });
// Fixed (value used as sentinel — 1 makes the intent clear):
player.activeSlots[si].statusEffects.push({ type: 'WELLOE_SHIELD', value: 1, turnsLeft: 2 });
```

---

### `src/abilities/snelleEffects.js` — `effect_ff_haaltje_nemen` (STUB-06)

**Role:** ability/effect — pure transform.

**The bug — line 51 references undefined `reduction`:**

```javascript
// Current broken code (lines 35–53):
export function effect_ff_haaltje_nemen(gameState, playerId) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return state;

  const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
  if (slotIndex < 0) return state;

  const mosje = player.activeSlots[slotIndex];
  const resilient = mosje.traits?.resilient || 0;
  mosje.statusEffects.push({
    type: 'MP_LOSS_REDUCTION',
    value: 0,                  // ← STUB: was zeroed, must be restored
    turnsLeft: 1,
  });

  console.log('[ABILITY] FF Haaltje Nemen: incoming MP loss reduction set to', reduction); // ← ReferenceError: reduction not defined
  return state;
}
```

**Fixed pattern — copy structure from `effect_snelle_emergency_healings` (lines 72–83) for resilient trait branching:**

```javascript
export function effect_ff_haaltje_nemen(gameState, playerId) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[playerId];
  if (!player) return state;

  const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
  if (slotIndex < 0) return state;

  const mosje = player.activeSlots[slotIndex];
  const resilient = mosje.traits?.resilient || 0;
  const reduction = resilient >= 2 ? 30 : 20;  // ← reintroduce the missing const
  mosje.statusEffects.push({
    type: 'MP_LOSS_REDUCTION',
    value: reduction,          // ← now populated
    turnsLeft: 1,
  });

  console.log('[ABILITY] FF Haaltje Nemen: incoming MP loss reduction set to', reduction);
  return state;
}
```

The resilient-branch pattern (`const resilient = mosje.traits?.resilient || 0; const heal = resilient >= 2 ? X : Y;`) is also used in `effect_eendjes_voeren` (lines 133–134) and `effect_emergency_healings` (lines 26–29).

---

### `src/ui/modalManager.js` — Wave 4 UI integrations (STUB-11, STUB-14, STUB-15)

**Role:** UI/modal — async, DOM-manipulating, NOT pure.

**All Wave 4 stubs consume flags set by engine functions and then call `showOptionSelect` or `showCardChoice`. The integration point is in `main.js` (or whatever handles post-card-resolution), not inside `modalManager.js` itself.**

**The primary reusable selector — `showOptionSelect` (lines 496–537):**

```javascript
async function showOptionSelect({
  title = 'Choose',
  prompt = '',
  options = [],    // [{ id, label, metaLabel? }]
  allowCancel = false,
  autoSelectSingle = false,
} = {}) { ... }
// Returns: Promise<id string | null>
```

**STUB-11 (Bagga of Greed — discard 1 after drawing 2):**

Engine already sets `state._baggaDiscard = true` in `effect_bagga_of_greed` (line 410). The UI caller should check this flag after `activatePiecie` returns and open a discard picker. Pattern to follow — the existing `showCardChoice` (lines 230–265):

```javascript
// In main.js, after activatePiecie resolves and state._baggaDiscard is true:
if (newState._baggaDiscard) {
  const handCards = newState.players[playerId].hand.map(c => ({
    cardId: c.cardId, name: c.cardId, description: ''
  }));
  const chosen = await modal.showCardChoice('Bagga of Greed — Discard 1', handCards);
  if (chosen) {
    const idx = newState.players[playerId].hand.findIndex(c => c.cardId === chosen.cardId);
    if (idx >= 0) newState.players[playerId].hand.splice(idx, 1);
    newState.players[playerId].discard.unshift(chosen.cardId);
  }
  delete newState._baggaDiscard;
}
```

**STUB-15 (MP Adjuster — numeric option select instead of hardcoded 50):**

Engine currently hardcodes `player.activeSlots[si].mp = 50` in `effect_mp_adjuster` (line 665). The UI integration calls `showOptionSelect` for the value, then applies it:

```javascript
// showOptionSelect call shape for MP Adjuster:
const chosen = await modal.showOptionSelect({
  title: 'MP Adjuster',
  prompt: 'Set your Mosje MP to:',
  options: [
    { id: '20', label: '20 MP' },
    { id: '40', label: '40 MP' },
    { id: '60', label: '60 MP' },
    { id: '80', label: '80 MP' },
    { id: '100', label: '100 MP' },
  ],
  allowCancel: false,
});
// chosen is a string '20'|'40'|'60'|'80'|'100'
const mpValue = parseInt(chosen, 10);
```

**STUB-14 (Welloe Force — redirect target):**

Engine sets `state._welloeForceActive = true` in `effect_welloe_force` (line 708). Target selection uses `showTargetSelector` (lines 272–301) which resolves with a `data-id` string. Use `showOptionSelect` as the simpler equivalent:

```javascript
// After welloe_force resolves and state._welloeForceActive is true:
if (newState._welloeForceActive) {
  const allMosjes = Object.entries(newState.players).flatMap(([pid, p]) =>
    p.activeSlots.map((s, i) => s && !s.isDefeated
      ? { id: `${pid}_slot_${i}`, label: `${s.name} (${s.mp} MP)` }
      : null
    ).filter(Boolean)
  );
  const chosen = await modal.showOptionSelect({
    title: 'Welloe Force — Redirect Damage',
    prompt: 'Choose who receives the next incoming damage:',
    options: allMosjes,
    allowCancel: false,
  });
  newState._welloeForceTarget = chosen;
  delete newState._welloeForceActive;
}
```

---

## Shared Patterns

### State cloning — engine files
**Source:** All engine files — `mpManager.js` line 37, `victoryChecker.js` line 89, `turnManager.js` line 125
```javascript
const state = JSON.parse(JSON.stringify(gameState));
// or in piecieEffects.js:
function cloneState(state) { return JSON.parse(JSON.stringify(state)); }
const state = cloneState(gameState);
```
**Apply to:** All engine and ability functions. Never mutate `gameState` directly.

### Status effect check pattern
**Source:** `applyStatusEffectMP` in `mpManager.js` (lines 209–218)
```javascript
for (const effect of mosje.statusEffects) {
  if (effect.value > 0) { ... }
  else { ... }
  effect.turnsLeft -= 1;
}
mosje.statusEffects = mosje.statusEffects.filter(e => e.turnsLeft > 0);
```
**Apply to:** STUB-01, STUB-02, STUB-03 — use `.find()` instead of `.forEach()` since we only want the first matching effect; decrement `turnsLeft` inline (same as the loop does at line 217).

### snelleFlags guard pattern
**Source:** `loseMP` in `mpManager.js` (lines 98–134)
```javascript
const snelleFlags = state._snelleFlags || {};
if (snelleFlags.someFlag?.[playerId]) {
  delete state._snelleFlags.someFlag[playerId];
  // ... effect ...
  return state;  // early return when flag consumed
}
```
**Apply to:** STUB-04 (`negateNextSearch`), STUB-02 (`mpLossReduction` snelle flag consolidation)

### Ability effect function signature
**Source:** Any function in `piecieEffects.js` or `snelleEffects.js`
```javascript
export function effect_name(gameState, playerId) {
  const state = cloneState(gameState);     // or JSON.parse(JSON.stringify(gameState))
  const player = state.players[playerId];
  if (!player) return state;
  // ... logic ...
  console.log('[ABILITY] Name: description');
  return state;
}
```
**Apply to:** All ability effect modifications — keep same signature, always return state.

### Console log prefixes
| File | Prefix |
|---|---|
| `mpManager.js` | `[MP]` or `[ENGINE]` |
| `victoryChecker.js` | `[ENGINE]` |
| `turnManager.js` | `[ENGINE]` |
| `piecieEffects.js` | `[ABILITY]` |
| `snelleEffects.js` | `[ABILITY]` |

### Test file pattern
**Source:** `tests/engine/mp-level-regression.test.ts` (all lines)
```typescript
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { functionUnderTest } from "../../src/engine/module.js";

function makeState(mp: number, level: number) {
  return {
    activePlace: null,
    players: {
      p1: {
        totalDamageTaken: 0,
        activeSlots: [
          {
            cardId: "mosje_test",
            name: "Test",
            mp,
            level,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
      },
    },
  };
}

describe("functionName — description", () => {
  it("specific scenario", () => {
    const state = makeState(50, 1);
    const result = functionUnderTest(state, "p1", 0, 20);
    expect(result.players.p1.activeSlots[0].mp).toBe(30);
  });
});
```
**Apply to:** All Wave 1 tests — minimal `makeState` helper with `statusEffects: []` array, `_snelleFlags` can be added as needed on the state object directly.

---

## No Analog Found

All files being modified already exist in the codebase. No truly new files without analog. However, the following items have implementation patterns that must come from RESEARCH.md (no existing engine code):

| Item | Reason |
|---|---|
| STUB-10 (Synergy Chamber cost reduction) | Ability activation cost reduction has no existing pattern — `loseMP` has place-based loss reduction but not cost waiver for activation. Check `placeEffects.js` JSDoc for exact values before implementing. |
| STUB-12 (Emergency Swap — ability registry) | No ability registry exists; `useMosjeAbility` in `turnManager.js` uses `mosjeAbilities[mosjeDef.abilityId]` as a lookup — this IS the registry. Investigate whether runtime ability ID lookup from opponent's active Mosje is feasible. |
| STUB-13 (Huisbaas — deck search) | `searchDeck` function does not exist. `phaseDrawCard` draws from top of deck only. Investigate before implementing; likely defer. |

---

## Metadata

**Analog search scope:** `src/engine/`, `src/abilities/`, `src/ui/`, `tests/engine/`
**Files read:** 8 (mpManager.js, victoryChecker.js, turnManager.js, piecieEffects.js, snelleEffects.js, mosjeAbilities.js, modalManager.js, placeEffects.js, tests/engine/mp-level-regression.test.ts)
**Pattern extraction date:** 2026-05-31
