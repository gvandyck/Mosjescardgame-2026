# Phase 15: Deck Reworks — Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 3 data files (starterDecks.js, simulation/starter-decks.ts, supporting data files)
**Analogs found:** 8 / 8 (all targets directly read — this is data-only archaeology, no new files)

---

## Scope Note

Phase 15 makes DATA-ONLY changes to two existing files:
- `src/data/starterDecks.js` — the lobby UI deck picker
- `src/simulation/starter-decks.ts` — the simulation balance test decks

No new files. No new functions. No engine changes. All patterns below are extracted
directly from the target files and the supporting data files they reference.

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/data/starterDecks.js` | config (data-only) | static | itself | exact |
| `src/simulation/starter-decks.ts` | config (data-only) | static | itself | exact |

---

## Pattern Assignments

### `src/data/starterDecks.js` (lobby deck config, data-only)

**Source:** `src/data/starterDecks.js` (lines 1–101, full file)

**Object shape** (lines 6–37, PHYSICAL_FORCE example):
```js
{
  id: "PHYSICAL_FORCE",               // ALL_CAPS snake_case string — must be unique
  name: "Physical Force",             // Human-readable display name
  description: "...",                 // One sentence for the lobby tooltip
  mosjes: ["mosje_jeffrey", "mosje_michelle"],  // exactly 2 mosje IDs from src/data/mosjes.js
  piecies: [                          // array of piecie IDs (duplicates allowed for 2x copies)
    "piecie_broodje_doner",
    "piecie_broodje_doner",           // repeat ID = 2 copies
    "piecie_affoe",
    "piecie_affoe",
    "piecie_quest_prep",
    "piecie_quest_prep",
    "piecie_pot_of_weed",
    "piecie_slecht_gezet",
    "piecie_grammetje_pieter",
    "piecie_tikker"
  ],                                  // 10 entries total in this example
  snellePiecies: [                    // 4 entries in all 3 decks
    "snelle_emergency_healings",
    "snelle_emergency_healings",
    "snelle_ff_haaltje_nemen",
    "snelle_lucky_coin"
  ],
  places: [                           // exactly 2 entries in all 3 decks
    "place_the_gym",
    "place_quest_haven"
  ],
  quests: [                           // exactly 1 entry in all 3 decks (personal quest)
    "quest_personal_iron_will"
  ]
}
```

**All three deck IDs in use** (lines 7, 39, 71):
```
"PHYSICAL_FORCE"
"DIGITAL_CONTROL"
"ARTISTIC_RHYTHM"
```

**ID naming rules** — all card IDs must exist verbatim in their respective data files:
- Mosje IDs: `src/data/mosjes.js` → field `id:` on each MOSJES entry
- Piecie IDs: `src/data/piecies.js` → field `id:` on each PIECIES entry
- Snelle Piecie IDs: `src/data/snellePiecies.js` → field `id:` on each SNELLE_PIECIES entry
- Place IDs: `src/data/places.js` → field `id:` on each PLACES entry
- Quest IDs: `src/data/quests.js` → field `id:` on each QUESTS entry

**isBoosterOnly guard** — only cards with `isBoosterOnly: false` may appear in starter decks.
The following confirmed targets are `isBoosterOnly: false` and safe to add:
- `piecie_dumbbells` — PHYSICAL-EQUIPMENT, isBoosterOnly: false (piecies.js line 976)
- `piecie_boxing_gloves` — PHYSICAL-EQUIPMENT, isBoosterOnly: false (piecies.js line 992)
- `piecie_skipping_rope` — PHYSICAL-EQUIPMENT, isBoosterOnly: false (piecies.js line 1007)
- `piecie_protein_shake` — PHYSICAL-EQUIPMENT, isBoosterOnly: false (piecies.js line 1022)
- `place_boxing_ring` — isBoosterOnly: false (places.js line 285)
- `quest_personal_iron_will` — isBoosterOnly: true (already used in starter deck — this is the one exception: personal quests with `isBoosterOnly: true` ARE included in the quests array of their matching deck)

---

### `src/simulation/starter-decks.ts` (simulation deck config, data-only)

**Source:** `src/simulation/starter-decks.ts` (lines 1–200, full file)

**Type definitions** (lines 15–25):
```typescript
export interface MosjeConfig {
  readonly cardId: CardId;
  readonly startMP: number;         // must match startMP in mosjes.js for that Mosje
}

export interface DeckConfig {
  readonly name: string;
  readonly mosjes: readonly [MosjeConfig, MosjeConfig];  // exactly 2 — tuple not array
  readonly deck: ReadonlyArray<CardId>;                  // all drawable cards flat
}
```

**`id()` helper** (lines 10–12) — wraps bare strings as `CardId` branded type:
```typescript
function id(value: string): CardId {
  return value as CardId;
}
```
Every card reference in this file MUST go through `id(...)`. Never use bare strings.

**Mosje config block pattern** (lines 29–32, PHYSICAL_FORCE_MOSJES):
```typescript
const PHYSICAL_FORCE_MOSJES: readonly [MosjeConfig, MosjeConfig] = [
  { cardId: id("alyssa-the-bulldozer"), startMP: 10 },
  { cardId: id("jeffrey-the-strongman"), startMP: 15 }
];
```
Note: simulation deck Mosje IDs use HYPHENATED format (e.g. `"jeffrey-the-strongman"`)
while data/mosjes.js uses underscore format (`"mosje_jeffrey"`). These are TWO SEPARATE
ID namespaces — the simulation uses the TypeScript engine's CardId type, not the JS data layer IDs.

**Deck card array pattern** (lines 34–77, PHYSICAL_FORCE_DECK_CARDS):
```typescript
const PHYSICAL_FORCE_DECK_CARDS: ReadonlyArray<CardId> = [
  // Piecies ×20 — annotated comment describing focus
  id("kannetje-melk"),
  id("kannetje-melk"),
  // ...
  // Snelle Piecies ×5
  id("snelle_jensen"),
  // ...
  // Places ×3
  id("place_the_gym"),
  // ...
  // Quests ×10
  id("quest_endurance_test"),
  // ...
];
```
Convention: section comments (`// Piecies ×N`, `// Snelle Piecies ×N`, `// Places ×N`, `// Quests ×N`)
annotate the groups. Piecie IDs here use hyphens (e.g. `"kannetje-melk"`) for most cards,
but snelle/place/quest IDs use underscore prefix (`"snelle_jensen"`, `"place_the_gym"`, `"quest_endurance_test"`).

**Export pattern** (lines 79–83):
```typescript
export const PHYSICAL_FORCE: DeckConfig = {
  name: "Physical Force",
  mosjes: PHYSICAL_FORCE_MOSJES,
  deck: PHYSICAL_FORCE_DECK_CARDS
};
```

**Three named exports**: `PHYSICAL_FORCE`, `DIGITAL_CONTROL`, `ARTISTIC_RHYTHM`.

---

## Supporting Data File Patterns

### Mosje `synergyWith` and `synergyEffect` fields

**Source:** `src/data/mosjes.js`

**Pattern: wired synergy with effect description** (mosje_azn_cless, lines 93–100):
```js
synergyWith: ["mosje_martin_senor_west"],
synergyEffect: "Physical Quests give +15 bonus MP",
```

**Pattern: wired synergy, no effect string on this side** (mosje_alyssa_bulldozer, lines 57–58):
```js
synergyWith: ["mosje_jisca"],
synergyEffect: null,
```
(The effect text lives on `mosje_jisca` side instead — each pair only needs one side to carry the text.)

**Pattern: Binti — multiple synergy partners** (mosje_binti, lines 521–522):
```js
synergyWith: ["mosje_coert_tech", "mosje_coert_kasteluck", "mosje_coert_kastelein"],
synergyEffect: "DOUBLE MP from FOOD cards",
```

**Pattern: Coert Tech — paired with Binti** (mosje_coert_tech, lines 263–264):
```js
synergyWith: ["mosje_binti"],
synergyEffect: "DOUBLE MP from FOOD cards",
```

**Pattern: no synergy** (mosje_jeffrey, lines 39–40):
```js
synergyWith: [],
synergyEffect: null,
```

**Pattern: missing/gap** — mosje_alyssa_bulldozer has `synergyWith: ["mosje_jisca"]`
but `synergyEffect: null` (line 58), meaning the engine reads the effect from `mosje_jisca`'s
entry, not from Alyssa's.

**Relevant Mosje IDs for Physical Force deck rework:**

| Mosje ID | synergyWith | synergyEffect |
|----------|-------------|---------------|
| `mosje_jeffrey` | `[]` | `null` |
| `mosje_michelle` | `[]` | `null` |
| `mosje_alyssa_bulldozer` | `["mosje_jisca"]` | `null` |
| `mosje_binti` | `["mosje_coert_tech", "mosje_coert_kasteluck", "mosje_coert_kastelein"]` | `"DOUBLE MP from FOOD cards"` |
| `mosje_coert_tech` | `["mosje_binti"]` | `"DOUBLE MP from FOOD cards"` |

---

### `hasFoodDoubleSynergy()` in `src/engine/synergyResolver.js`

**Source:** `src/engine/synergyResolver.js` (lines 76–78)

```js
export function hasFoodDoubleSynergy(gameState, playerId) {
  return hasSynergy(gameState, playerId, 'mosje_binti', 'mosje_coert_tech');
}
```

**Hard-coded pair:** `'mosje_binti'` and `'mosje_coert_tech'` are the only two IDs checked.
The FOOD doubling synergy only fires when BOTH these Mosjes are simultaneously active.

`hasSynergy()` delegates to `getActiveSynergies()` which reads `mosje.synergyWith` arrays
from `src/data/mosjes.js` at runtime. The check is bidirectional (either side can list the other).

**Implication for Phase 15:** If the Physical Force deck should gain access to food-double,
it requires both `mosje_binti` AND `mosje_coert_tech` on the same player's field. Neither is
currently in PHYSICAL_FORCE. The synergy function itself does not need modification — it
will activate automatically when the right pair is fielded.

---

### Quest `isBoosterOnly` and `questType: "PERSONAL"` pattern

**Source:** `src/data/quests.js`

**PERSONAL quest full shape** (lines 856–873, quest_personal_iron_will):
```js
{
  id: "quest_personal_iron_will",
  type: "QUEST",
  questType: "PERSONAL",
  category: "Physical",
  requiredMosjeId: "mosje_jeffrey",       // must match a mosje id exactly
  name: "Iron Will",
  requirementId: "quest_req_iron_will",
  roll: { trait: null, thresholds: { 1: 4, 2: 4, 3: 4 } },
  requirementDescription: "Requires Jeffrey on field and 40+ total damage taken. Roll 4+.",
  successMP: 110,
  failMP: -20,
  description: "Requires [Jeffrey] The Strongman on field. ...",
  difficulty: "HIGH",
  isBoosterOnly: true,                    // ALL personal quests are isBoosterOnly: true
  rarity: "★★★★",
  flavourText: "Pain is just weakness leaving the body.",
  artPath: "assets/quests/placeholder.png"
}
```

**All PERSONAL quests and their `requiredMosjeId`:**

| Quest ID | requiredMosjeId | isBoosterOnly |
|----------|-----------------|---------------|
| `quest_west_perfect_read` | `mosje_martin_senor_west` | true |
| `quest_personal_iron_will` | `mosje_jeffrey` | true |
| `quest_personal_perfect_sync` | `mosje_martin_senor_west` | true |
| `quest_personal_lucky_crescendo` | `mosje_dj_8020` | true |

**Rule:** `questType: "PERSONAL"` always has `isBoosterOnly: true`. Despite this,
personal quests ARE included in the `quests: [...]` array of their matching starter deck
(see starterDecks.js lines 35, 67, 98). This is intentional — the starter deck quests
array is the player's personal quest slot, separate from isBoosterOnly enforcement.

There is currently NO personal quest with `requiredMosjeId: "mosje_alyssa_bulldozer"`.
If Phase 15 adds one, it must follow the exact shape above.

---

### Physical Equipment cards in `src/data/piecies.js`

**Source:** `src/data/piecies.js` lines 973–1032

All four Physical Equipment cards share this pattern:

```js
{
  id: "piecie_dumbbells",
  type: "PIECIE",
  subtype: "PHYSICAL-EQUIPMENT",           // subtype is "PHYSICAL-EQUIPMENT"
  name: "Dumbbells",
  mpCost: 0,                               // all 4 have mpCost: 0
  requirement: "any",                      // all 4 are "any" requirement
  effectId: "effect_dumbbells",            // links to piecieEffects.js
  tags: ["PHYSICAL-EQUIPMENT"],            // at minimum this tag; protein_shake also has "FOOD"
  description: "Physical Mosje on field: +20 MP. Physical ★★★: also draw 1 card.",
  flavourText: "",
  artPath: "assets/piecies/placeholder.png",
  rarity: "★",                             // dumbbells/skipping_rope ★; gloves/protein_shake ★★
  isBoosterOnly: false,
}
```

**Specific card data:**

| Card ID | mpCost | tags | rarity | Description summary |
|---------|--------|------|--------|---------------------|
| `piecie_dumbbells` | 0 | `["PHYSICAL-EQUIPMENT"]` | ★ | Physical Mosje: +20 MP. Phys ★★★: draw 1 |
| `piecie_boxing_gloves` | 0 | `["PHYSICAL-EQUIPMENT"]` | ★★ | Phys ★★+: +25 MP. GANDOE tag: +40 MP + MP loss halved 1 turn |
| `piecie_skipping_rope` | 0 | `["PHYSICAL-EQUIPMENT"]` | ★ | Physical Mosje: +1 next Quest roll + draw 1. No Phys: draw 1 only |
| `piecie_protein_shake` | 0 | `["PHYSICAL-EQUIPMENT", "FOOD"]` | ★★ | +25 MP to active Physical Mosje. +35 MP if Boxing Ring active |

`piecie_protein_shake` also carries the `"FOOD"` tag, which means it is affected by
`hasFoodDoubleSynergy()` if Binti + Coert Tech are both active.

---

### `place_boxing_ring` in `src/data/places.js`

**Source:** `src/data/places.js` (lines 273–286)

```js
{
  id: "place_boxing_ring",
  type: "PLACE",
  name: "Boxing Ring",
  trigger: "ON_QUEST",                // also has END_PHASE secondary trigger in description
  effectId: "effect_boxing_ring",
  tags: ["PHYSICAL"],
  description: "On Quest: Physical Mosjes +15 MP any outcome; GANDOE tag: +25 MP instead. End Phase: FIGHTING Mosjes +10 MP; non-FIGHTING -5 MP.",
  flavourText: "",
  artPath: "assets/places/placeholder.png",
  goodFor: ["FIGHTING"],
  badFor: ["DIGITAL", "ARTISTIC"],
  rarity: "★★★",
  isBoosterOnly: false
}
```

**Interaction with `piecie_protein_shake`:** Protein Shake checks `if Boxing Ring is active place`
to upgrade its MP gain from +25 to +35. This is entirely effect-side logic in `piecieEffects.js`
— no data change needed in either the place or piecie definition.

**Boxing Ring is already a valid starter deck place** (`isBoosterOnly: false`). It is NOT
currently in any starter deck. Adding `"place_boxing_ring"` to the PHYSICAL_FORCE `places`
array is a straightforward data change.

---

## Shared Patterns

### ID cross-reference consistency rule
**Apply to:** Every edit in starterDecks.js and simulation/starter-decks.ts

Any ID added to a deck array must exist verbatim in the corresponding data file.
The two files use different ID conventions:

| Layer | ID format example | File |
|-------|-------------------|------|
| `starterDecks.js` mosjes | `"mosje_jeffrey"` | src/data/mosjes.js |
| `starterDecks.js` piecies | `"piecie_dumbbells"` | src/data/piecies.js |
| `starterDecks.js` snellePiecies | `"snelle_lucky_coin"` | src/data/snellePiecies.js |
| `starterDecks.js` places | `"place_boxing_ring"` | src/data/places.js |
| `starterDecks.js` quests | `"quest_personal_iron_will"` | src/data/quests.js |
| `simulation/starter-decks.ts` piecies | `id("kannetje-melk")` (hyphens) | TypeScript CardId namespace |
| `simulation/starter-decks.ts` snelle/place/quest | `id("snelle_jensen")` (underscores) | TypeScript CardId namespace |

### Duplicate copies pattern
**Source:** starterDecks.js lines 11–22 (PHYSICAL_FORCE piecies)
**Apply to:** starterDecks.js piecies array

Repeat the ID string twice in the array to include 2 copies. No special syntax:
```js
"piecie_dumbbells",
"piecie_dumbbells",   // second copy
```

### isBoosterOnly guard
**Source:** piecies.js, places.js, quests.js — `isBoosterOnly` field on every card
**Apply to:** Every card reference added to starterDecks.js

Only cards with `isBoosterOnly: false` may appear in starter decks, EXCEPT personal quests
in the `quests` array which are `isBoosterOnly: true` by design but still allowed.

---

## No Analog Found

None — all targeted structures are directly present in the codebase.

---

## Metadata

**Analog search scope:** src/data/, src/simulation/, src/engine/synergyResolver.js
**Files scanned:** 7 (starterDecks.js, starter-decks.ts, mosjes.js, piecies.js, places.js, quests.js, synergyResolver.js)
**Pattern extraction date:** 2026-06-01
