# Phase 14: Physical Equipment Cards - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 7 (4 new piecies + 1 new place + 1 place patch + 1 test file)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/data/piecies.js` (append 4 entries) | data/config | CRUD | `src/data/piecies.js` lines 921-967 (DIGITAL-EQUIPMENT block) | exact |
| `src/data/places.js` (append 1 entry + patch The Gym description) | data/config | CRUD | `src/data/places.js` lines 12-26 (place_the_gym entry) | exact |
| `src/abilities/piecieEffects.js` (append 4 effect functions) | service | request-response | `src/abilities/piecieEffects.js` lines 906-957 (effect_keyboard/mouse/controller) | exact |
| `src/abilities/placeEffects.js` (append effect_boxing_ring + patch effect_the_gym) | service | event-driven | `src/abilities/placeEffects.js` lines 26-40 (effect_the_gym) | exact |
| `src/abilities/placeEffects.js` (patch resolvePlaceEffect switch) | service | request-response | `src/abilities/placeEffects.js` lines 436-536 (resolvePlaceEffect dispatcher) | exact |
| `tests/effects/equipment-scaling.test.ts` (append describe blocks) | test | request-response | `tests/effects/equipment-scaling.test.ts` lines 56-160 | exact |
| `docs/card-reference.md` (append rows) | docs | - | `docs/card-reference.md` lines 58-125 (Piecie table) + lines 151-170 (Place table) | exact |

---

## Pattern Assignments

### `src/data/piecies.js` — DIGITAL-EQUIPMENT block to copy for PHYSICAL-EQUIPMENT

**Analog:** `src/data/piecies.js` lines 921-967

The three DIGITAL-EQUIPMENT piecies are the direct template for the four new PHYSICAL-EQUIPMENT ones. Copy the block structure wholesale, change `subtype`, `tags`, `id`, `name`, `effectId`, and `description`.

**Exact block to copy (lines 921-967):**
```js
  {
    id: "piecie_keyboard",
    type: "PIECIE",
    subtype: "DIGITAL-EQUIPMENT",
    name: "Keyboard",
    mpCost: 0,
    requirement: "any",
    effectId: "effect_keyboard",
    tags: ["DIGITAL-EQUIPMENT"],
    description: "Digital Mosje on field: gain 10 MP and draw 1 card.",
    flavourText: "",
    artPath: "assets/piecies/placeholder.png",
    rarity: "★",
    isBoosterOnly: false,
  },
```

**What to change for PHYSICAL-EQUIPMENT cards:**
- `subtype: "PHYSICAL-EQUIPMENT"`
- `tags: ["PHYSICAL-EQUIPMENT"]`
- `id`, `name`, `effectId`, `description` per card
- `rarity` as specified per card

**The four new entries follow this exact shape:**
```js
  // ─────────────────────────────────────────
  // PHYSICAL EQUIPMENT
  // ─────────────────────────────────────────

  {
    id: "piecie_dumbbells",
    type: "PIECIE",
    subtype: "PHYSICAL-EQUIPMENT",
    name: "Dumbbells",
    mpCost: 0,
    requirement: "any",
    effectId: "effect_dumbbells",
    tags: ["PHYSICAL-EQUIPMENT"],
    description: "...",
    flavourText: "",
    artPath: "assets/piecies/placeholder.png",
    rarity: "★",
    isBoosterOnly: false,
  },
  // ... repeat for Boxing Gloves, Skipping Rope, Protein Shake
```

---

### `src/abilities/piecieEffects.js` — PHYSICAL-EQUIPMENT effect functions

**Analog:** `src/abilities/piecieEffects.js` lines 902-957

The DIGITAL-EQUIPMENT block has a shared private helper `getDigitalMP(mosje)` (line 906) that centralises scaling logic. The PHYSICAL-EQUIPMENT block must follow this exact pattern with a parallel `getPhysicalMP(mosje)` helper.

**Shared helper pattern to replicate (lines 906-912):**
```js
function getDigitalMP(mosje) {
    if (mosje.subtype !== 'DIGITAL') return 5;
    const level = mosje.level || 1;
    if (level >= 3) return 40;
    if (level === 2) return 25;
    return 15;
}
```

**New parallel helper — copy this shape:**
```js
function getPhysicalMP(mosje) {
    if (mosje.subtype !== 'FIGHTING') return 5;
    const level = mosje.level || 1;
    if (level >= 3) return 40;
    if (level === 2) return 25;
    return 15;
}
```

**Individual effect function pattern (lines 914-927):**
```js
export function effect_keyboard(gameState, playerId) {
    const state = cloneState(gameState);
    const player = state.players[playerId];
    if (!player) return state;
    const si = getFirstActiveSlotIndex(player);
    if (si < 0) return state;
    const mosje = player.activeSlots[si];
    const mp = getDigitalMP(mosje);
    applyMPGain(player, si, mp, state, playerId);
    // Flavor bonus: draw 1 card
    if (player.deck.length > 0) player.hand.push(player.deck.shift());
    console.log(`[ABILITY] Keyboard: +${mp} MP${mosje.subtype === 'DIGITAL' ? ' (Digital Lv' + (mosje.level||1) + ')' : ' (base)'}, drew 1`);
    return state;
}
```

**Pattern for Dumbbells (MP gain + flavor bonus):**
```js
export function effect_dumbbells(gameState, playerId) {
    const state = cloneState(gameState);
    const player = state.players[playerId];
    if (!player) return state;
    const si = getFirstActiveSlotIndex(player);
    if (si < 0) return state;
    const mosje = player.activeSlots[si];
    const mp = getPhysicalMP(mosje);
    applyMPGain(player, si, mp, state, playerId);
    // <flavor bonus unique per card>
    console.log(`[ABILITY] Dumbbells: +${mp} MP${mosje.subtype === 'FIGHTING' ? ' (Physical Lv' + (mosje.level||1) + ')' : ' (base)'}`);
    return state;
}
```

**Section header comment to prepend (matches lines 902-904):**
```js
// ─────────────────────────────────────────
// PHYSICAL EQUIPMENT
// ─────────────────────────────────────────
```

---

### `src/abilities/piecieEffects.js` — MP_LOSS_HALVED status push (Bowie & Stormey / Protein Shake pattern)

**Analog:** `src/abilities/piecieEffects.js` lines 754-815

Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, and ViannaPoes all push `MP_LOSS_HALVED` identically. The Protein Shake card (if it reduces MP loss) follows this same push pattern.

**Exact push pattern (lines 762-764 from effect_bowie_stormey):**
```js
for (const slot of player.activeSlots) {
    if (!slot || slot.isDefeated) continue;
    slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
}
console.log('[ABILITY] Bowie & Stormey: MP loss halved for 2 turns');
```

The effect is consumed in `src/engine/mpManager.js` lines 144-152:
```js
const halvingEffect = mosje.statusEffects?.find(
    e => e.type === 'MP_LOSS_HALVED' && e.turnsLeft > 0
);
if (halvingEffect) {
    lossAmount = Math.ceil(lossAmount / 2);
    halvingEffect.turnsLeft -= 1;
}
```

No change to mpManager.js is required — the existing halving logic already picks up any `MP_LOSS_HALVED` push, regardless of which piecie pushed it.

---

### `src/data/places.js` — Boxing Ring entry

**Analog:** `src/data/places.js` lines 12-26 (place_the_gym)

Boxing Ring should live in the same ORIGINAL STARTERS or NEW PLACES section and follow the exact object shape. Use `trigger: "END_PHASE"` or `trigger: "ON_QUEST"` as required by the card design.

**Template to copy (lines 12-26):**
```js
  {
    id: "place_the_gym",
    type: "PLACE",
    name: "The Gym",
    trigger: "END_PHASE",
    effectId: "effect_the_gym",
    tags: ["PHYSICAL"],
    description: "End Phase: All Mosjes lose 10 MP. Physical ★★ gain 25 MP instead. Physical ★★★ gain 35 MP instead.",
    flavourText: "Alleen de sterksten overleven.",
    artPath: "assets/place-art/Place The Gym.jpg",
    goodFor: ["FIGHTING"],
    badFor: ["DIGITAL"],
    rarity: "★★",
    isBoosterOnly: false
  },
```

**Boxing Ring entry shape:**
```js
  {
    id: "place_boxing_ring",
    type: "PLACE",
    name: "Boxing Ring",
    trigger: "END_PHASE",           // or "ON_QUEST" — determined by card design
    effectId: "effect_boxing_ring",
    tags: ["PHYSICAL"],
    description: "...",
    flavourText: "",
    artPath: "assets/places/placeholder.png",
    goodFor: ["FIGHTING"],
    badFor: ["DIGITAL"],
    rarity: "★★",
    isBoosterOnly: false
  },
```

---

### `src/data/places.js` — The Gym CLESS-tag bonus patch

**The Gym description line to update (line 19):**
```js
    // BEFORE:
    description: "End Phase: All Mosjes lose 10 MP. Physical ★★ gain 25 MP instead. Physical ★★★ gain 35 MP instead.",

    // AFTER (add CLESS bonus clause):
    description: "End Phase: All Mosjes lose 10 MP. Physical ★★ gain 25 MP instead. Physical ★★★ gain 35 MP instead. CLESS-tagged Mosjes: gain <X> MP instead of losing.",
```

(The exact MP value for the CLESS bonus is a design decision — leave a placeholder until confirmed.)

---

### `src/abilities/placeEffects.js` — effect_the_gym CLESS patch

**Analog:** `src/abilities/placeEffects.js` lines 26-40 (full function body)

**Current function (lines 26-40):**
```js
export function effect_the_gym(gameState) {
    const state = cloneState(gameState);
    for (const playerId of Object.keys(state.players)) {
        const player = state.players[playerId];
        for (const mosje of player.activeSlots) {
            if (!mosje || mosje.isDefeated) continue;
            const physical = mosje.traits?.physical || 0;
            if (physical >= 3) mosje.mp += 35;
            else if (physical >= 2) mosje.mp += 25;
            else applyDamage(mosje, 10);
        }
    }
    console.log('[ABILITY] The Gym end phase effect applied');
    return state;
}
```

**How CLESS tag is stored on Mosje cards** (read from `src/data/mosjes.js` lines 85-101 and 548-562):
- CLESS tag is in the `tags` array on the Mosje definition in mosjes.js: `tags: ["CLESS"]`
- At runtime, the active slot object carries a `cardId` field (e.g., `"mosje_azn_cless"`)
- The slot does NOT automatically carry `tags` from the definition — the effect must check `mosje.cardId` against MOSJES lookup, or the tags must be copied onto the slot at Mosje-play time

**Two options for CLESS check in effect_the_gym:**

Option A — check `mosje.cardId` substring (mirrors how Coert's Caravan checks for Coert in placeEffects.js lines 238-240):
```js
// From effect_coerts_caravan lines 238-240 — the existing CLESS/name check pattern:
const id = String(mosje.cardId || mosje.mosjeId || '').toLowerCase();
const isCless = id.includes('cless');
```

Option B — check `mosje.tags` array if tags are copied onto the slot (mirrors how piecieEffects checks slot traits):
```js
const isCless = (mosje.tags || []).includes('CLESS');
```

**Patched effect_the_gym shape:**
```js
export function effect_the_gym(gameState) {
    const state = cloneState(gameState);
    for (const playerId of Object.keys(state.players)) {
        const player = state.players[playerId];
        for (const mosje of player.activeSlots) {
            if (!mosje || mosje.isDefeated) continue;
            const physical = mosje.traits?.physical || 0;
            const id = String(mosje.cardId || '').toLowerCase();
            const isCless = id.includes('cless');
            if (physical >= 3) mosje.mp += 35;
            else if (physical >= 2) mosje.mp += 25;
            else if (isCless) mosje.mp += <CLESS_BONUS>;   // new branch
            else applyDamage(mosje, 10);
        }
    }
    console.log('[ABILITY] The Gym end phase effect applied');
    return state;
}
```

---

### `src/abilities/placeEffects.js` — effect_boxing_ring (new END_PHASE or ON_QUEST effect)

**Analog:** `src/abilities/placeEffects.js` lines 26-40 (effect_the_gym) for END_PHASE trigger
or lines 121-143 (effect_obby_1) for ON_QUEST trigger

**END_PHASE pattern (copy of effect_the_gym structure):**
```js
export function effect_boxing_ring(gameState) {
    const state = cloneState(gameState);
    for (const playerId of Object.keys(state.players)) {
        const player = state.players[playerId];
        for (const mosje of player.activeSlots) {
            if (!mosje || mosje.isDefeated) continue;
            const physical = mosje.traits?.physical || 0;
            if (physical >= 2) {
                mosje.mp += <BONUS>;
                console.log('[ABILITY] Boxing Ring: +<BONUS> MP (Physical 2+)');
            } else {
                applyDamage(mosje, <PENALTY>);
                console.log('[ABILITY] Boxing Ring: -<PENALTY> MP (non-Physical)');
            }
        }
    }
    return state;
}
```

**ON_QUEST pattern (copy of effect_obby_1 structure, lines 121-143):**
```js
export function effect_boxing_ring(gameState, questCard, didSucceed) {
    const state = cloneState(gameState);
    const playerId = state.activePlayerId;
    const player = state.players[playerId];
    const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
    if (slotIndex < 0) return state;
    const mosje = player.activeSlots[slotIndex];
    const physical = mosje.traits?.physical || 0;
    if (physical >= 2) {
        if (didSucceed) {
            mosje.mp += <BONUS>;
            console.log('[ABILITY] Boxing Ring: +<BONUS> MP on success');
        } else {
            applyDamage(mosje, <PENALTY>);
            console.log('[ABILITY] Boxing Ring: -<PENALTY> MP on failure');
        }
    }
    return state;
}
```

---

### `src/abilities/placeEffects.js` — resolvePlaceEffect dispatcher patch

**Analog:** `src/abilities/placeEffects.js` lines 436-536

Two additions required:
1. Add `case 'place_boxing_ring':` to the switch (inside `resolvePlaceEffect`)
2. The existing `case 'place_the_gym':` needs no change — effect_the_gym is called directly and the CLESS logic is inside the function

**Where to insert new case (after line 454, the existing `case 'place_the_gym'` block):**
```js
        case 'place_boxing_ring':
            nextState = effect_boxing_ring(state, context.questCard, context.didSucceed);
            break;
```

---

### `tests/effects/equipment-scaling.test.ts` — PHYSICAL-EQUIPMENT test describe blocks

**Analog:** `tests/effects/equipment-scaling.test.ts` lines 1-54 (file header + makeState helper) and lines 56-160 (describe blocks for keyboard/mouse/controller)

**Import line to add at top of file (line 5 pattern):**
```ts
import { effect_keyboard, effect_mouse, effect_controller, effect_tikker,
         effect_dumbbells, effect_boxing_gloves, effect_skipping_rope, effect_protein_shake
} from '../../src/abilities/piecieEffects.js';
```

**makeState helper — already handles subtype; new tests use `subtype: 'FIGHTING'`:**
```ts
// Existing makeState at lines 9-54 — no changes needed.
// New test calls use:
const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
```

**Test describe block pattern to copy for each new piecie (copy lines 57-95 and adapt):**
```ts
  describe('effect_dumbbells', () => {
    it('gives 15 MP with Fighting Mosje at level 1', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(15);
    });

    it('gives 25 MP with Fighting Mosje at level 2', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 2, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 40 MP with Fighting Mosje at level 3', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 3, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('gives 5 MP base with non-Fighting Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(5);
    });

    // Add flavor-bonus test specific to this card's secondary effect
  });
```

**The Gym CLESS patch tests — follow effect_the_gym pattern (see test-placeEffects.js lines 12-55):**
```ts
  describe('effect_the_gym (CLESS bonus patch)', () => {
    it('CLESS-tagged Mosje gains bonus MP instead of losing', () => {
      const state = createEngineState({
        players: {
          player_1: {
            activeSlots: [
              { cardId: 'mosje_azn_cless', name: '[AZN Cless]', traits: { physical: 2, social: 2 },
                mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
              null,
            ],
          },
          player_2: { activeSlots: [null, null] },
        },
      });
      const result = placeEffects.effect_the_gym(state);
      expect(result.players.player_1.activeSlots[0].mp).toBeGreaterThan(20); // gained, not lost
    });
  });
```

Note: `createEngineState` is from `tests/helpers/testHelpers.js`. The `.test.ts` files use vitest `describe/it/expect`, while the legacy `.js` test files use the custom `test/assertEqual` helpers. New tests for Phase 14 should use the vitest pattern (`.test.ts`) matching the equipment-scaling file.

---

### `docs/card-reference.md` — new table rows

**Analog:** `docs/card-reference.md` lines 58-125 (Piecie table) and lines 151-170 (Place table)

**Piecie table row format:**
```
| <id-slug> | <Name> | PHYSICAL-EQUIPMENT | no | no | free | <effect summary> | implemented |
```

Example row for Keyboard (line 75):
```
| keyboard | Keyboard | DIGITAL-EQUIPMENT | yes | no | free | gainMP+drawCards | implemented |
```

**New Piecie rows to add (insert in alphabetical order within PHYSICAL-EQUIPMENT group or at end of Piecie section):**
```
| boxing-gloves | Boxing Gloves | PHYSICAL-EQUIPMENT | no | no | free | gainMP+<flavor> | implemented |
| dumbbells | Dumbbells | PHYSICAL-EQUIPMENT | no | no | free | gainMP+<flavor> | implemented |
| protein-shake | Protein Shake | PHYSICAL-EQUIPMENT | no | no | free | gainMP+<flavor> | implemented |
| skipping-rope | Skipping Rope | PHYSICAL-EQUIPMENT | no | no | free | gainMP+<flavor> | implemented |
```

**Place table row format (lines 153-170):**
```
| <place_id> | <Name> | PLACE | no | no | free | <trigger>, <condition>, <effect> | implemented |
```

Example (The Gym, line 167):
```
| place_the_gym | The Gym | PLACE | yes | no | free | turn_end, Physical 3→+35, Physical 2→+25, else -10 MP | implemented |
```

**New Place row:**
```
| place_boxing_ring | Boxing Ring | PLACE | no | no | free | <trigger>, Physical 2+→<bonus>, else -<penalty> MP | implemented |
```

**The Gym patch note** — append to existing The Gym row's effect column:
```
| place_the_gym | The Gym | PLACE | yes | no | free | turn_end, Physical 3→+35, Physical 2→+25, CLESS→+<X> MP, else -10 MP | implemented |
```

**Card Counts block** (top of file, lines 13-18) — increment Piecie count from 64 to 68, Place count from 16 to 17:
```
- Piecie: 68
- Place: 17
```

---

## Shared Patterns

### cloneState (immutable reducer — applied everywhere)
**Source:** `src/abilities/piecieEffects.js` line 11-13
**Apply to:** All new effect functions
```js
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
```
Every effect function starts with `const state = cloneState(gameState);` and returns `state`. Never mutate `gameState` directly.

### getFirstActiveSlotIndex helper
**Source:** `src/abilities/piecieEffects.js` lines 15-17
**Apply to:** All new piecie effect functions
```js
function getFirstActiveSlotIndex(player) {
    return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}
```
Use this instead of a direct `findIndex` call inline.

### applyMPGain (respects mpAmplifier)
**Source:** `src/abilities/piecieEffects.js` lines 38-48
**Apply to:** All MP-gaining piecie effects
```js
function applyMPGain(player, si, amount, state, playerId) {
    let total = amount;
    if (player.mpAmplifierActive) {
        total = Math.floor(amount * 1.5);
        player.mpAmplifierActive = false;
    }
    player.activeSlots[si].mp += total;
    return total;
}
```
Always call `applyMPGain(player, si, mp, state, playerId)` instead of `player.activeSlots[si].mp += mp` directly. This ensures MP Amplifier piecie interacts correctly.

### applyDamage (level regression)
**Source:** `src/abilities/placeEffects.js` lines 13-24 (identical copy also in piecieEffects.js lines 25-36)
**Apply to:** All effect functions that deal MP loss to Mosjes
```js
function applyDamage(mosje, amount) {
    if (!mosje || mosje.isDefeated || amount <= 0) return;
    mosje.mp -= amount;
    while (mosje.mp < 0) {
        if (mosje.level === 0) { mosje.mp = 0; break; }
        const overflow = -mosje.mp;
        mosje.level -= 1;
        mosje.mp = 100 - overflow;
    }
    mosje.mp = Math.max(0, mosje.mp);
    mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + amount;
}
```
Note: `applyDamage` is a local function inside each file — it is not exported. Each file has its own copy.

### CLESS tag check pattern
**Source:** `src/abilities/placeEffects.js` lines 237-240 (effect_coerts_caravan)
**Apply to:** effect_the_gym CLESS patch and effect_boxing_ring if needed
```js
const id = String(mosje.cardId || mosje.mosjeId || '').toLowerCase();
const isCless = id.includes('cless');
```
CLESS-tagged Mosjes in mosjes.js: `mosje_azn_cless` and `mosje_cless_teacher`. Both contain the substring `cless` in their `cardId`.

### Console log prefix convention
**Source:** Throughout piecieEffects.js and placeEffects.js
**Apply to:** All new effect functions
- Piecie effects: `console.log('[ABILITY] <CardName>: <description>');`
- Place effects: `console.log('[ABILITY] <PlaceName> <description>');`

---

## No Analog Found

All Phase 14 files have strong analogs in the codebase. No files require falling back to RESEARCH.md patterns.

---

## Key Observations for Planner

1. **PHYSICAL-EQUIPMENT is a new `subtype` string** — it does not yet exist in piecies.js. The string must be spelled exactly `"PHYSICAL-EQUIPMENT"` to match the `"DIGITAL-EQUIPMENT"` naming convention.

2. **The `getPhysicalMP` helper is new** — copy `getDigitalMP` (piecieEffects.js line 906) and replace `'DIGITAL'` with `'FIGHTING'`. MP scaling values (5/15/25/40) are a design decision; the helper shape is fixed.

3. **resolvePlaceEffect switch must be patched** — every new Place needs a `case` entry in the switch at the bottom of placeEffects.js (lines 452-523). Without it the place trigger fires nothing. Follow the existing `case` blocks exactly.

4. **The Gym description patch is cosmetic only** — the `description` field in places.js is display text. The engine reads it for nothing; only `effectId` and `trigger` drive behavior. Patch both the description string AND the function body.

5. **MP_LOSS_HALVED is already wired in mpManager.js** — no mpManager.js change needed for Protein Shake if it uses the same `MP_LOSS_HALVED` status push. The existing consumer at mpManager.js lines 144-152 picks it up automatically.

6. **Test file is `.test.ts` (vitest), not `.js` (custom runner)** — Phase 14 tests go in `tests/effects/equipment-scaling.test.ts` (or a new sibling file). Do not add to the legacy `.js` test files in `tests/cards/`.

---

## Metadata

**Analog search scope:** `src/data/`, `src/abilities/`, `src/engine/`, `tests/effects/`, `tests/cards/`, `docs/`
**Files scanned:** 9
**Pattern extraction date:** 2026-05-31
