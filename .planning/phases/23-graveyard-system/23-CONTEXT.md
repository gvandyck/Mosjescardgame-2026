# Phase 23: Graveyard System — Context

**Gathered:** 2026-06-04
**Updated:** 2026-06-04 (revised: eliminate player.welloe[], unify into single graveyard)
**Status:** Ready for planning
**Source:** User direction + graveyard audit + design session

<domain>
## Phase Boundary

One unified graveyard per player. Every card that gets destroyed/defeated/discarded/played goes into `player.graveyard[]` — Mosjes, Piecies, Places, Snelle Piecies, Personal Quests, and hand cards. No exceptions. The separate `player.welloe[]` array is eliminated; revival cards (Mosje Reborn, Call of the Welloes) read from `player.graveyard` filtered by `type === 'MOSJE'` instead.

Think of the graveyard as a trashcan: it holds all types of cards, they all end up in the same place regardless of how they got there.

**In scope:**
- Eliminate `player.welloe[]` entirely — remove from state init, all writes, all reads
- `markMosjeDefeated` pushes a FULL Mosje object (not slimmed) to `player.graveyard` with `type: 'MOSJE'`
- Fix Mosje Reborn: read from `player.graveyard` filtered by type='MOSJE'
- Fix Call of the Welloes (effect + confirmCallOfWelloes): read from `player.graveyard` filtered by type='MOSJE'
- Fix Klaar met Jou: silent `hand.pop()` → splice + push typed entry to opponent's graveyard
- Fix Those Eyelashes: silent `hand.shift()` → splice + push typed entry to each opponent's graveyard
- Normalize ALL graveyard entries to typed objects: `{ cardId, name, type, ...meta }`
- New helper: `src/engine/graveyardUtils.js` — `toGraveyardEntry()` + `addToGraveyard()`
- Rename `player.discard` → `player.graveyard` everywhere (engine, UI, tests, docs)
- UI label "Discard Pile" → "Graveyard"; modal header "{Player}'s Graveyard"
- Card descriptions: "discard pile" → "Graveyard" in all `src/data/*.js` files

**Out of scope:**
- Renaming card names ("Call of the Welloes", "Welloe Force") — those are card flavour names, not data structures
- Opponent graveyard viewing UI
- Graveyard-count-based card effects
- Banish/exile zone

</domain>

<decisions>
## Implementation Decisions

### Eliminate player.welloe[]
- **D-01** `player.welloe[]` is removed from all player state objects. Remove from `startTurn`, any game init, Firebase sync paths.
- **D-02** `markMosjeDefeated` currently pushes to BOTH `welloe` AND `discard`. After this phase: push ONE full entry to `player.graveyard` only. The entry must be the full slot object + `type: 'MOSJE'` so revival cards can restore stats.
- **D-03** Any test that initialises `player.welloe = []` or asserts on `player.welloe` must be updated.

### Graveyard entry format — full typed objects
- **D-04** All entries in `player.graveyard[]` are objects with at minimum:
  ```js
  { cardId, name, type, source }
  // type: 'MOSJE' | 'PIECIE' | 'SNELLE_PIECIE' | 'PLACE' | 'QUEST' | 'HAND_CARD'
  // source: 'defeated' | 'played' | 'discarded' | 'destroyed'
  ```
- **D-05** Mosje entries carry the FULL slot object merged with type+source:
  ```js
  { ...mosjeSlot, type: 'MOSJE', source: 'defeated' }
  // Preserves: cardId, name, level, mp, traits, statusEffects, etc.
  // Revival cards splice this entry out of graveyard and restore it to activeSlots
  ```
- **D-06** Non-Mosje entries carry: `{ cardId, name, type, source }` (resolved via card data lookup).

### graveyardUtils.js — modular foundation
- **D-07** New file `src/engine/graveyardUtils.js` (pure functions, no side effects):
  ```js
  // Returns a typed graveyard entry for any non-Mosje card
  toGraveyardEntry(cardId, allCardData, source)
  // Returns new state with entry pushed to player.graveyard
  addToGraveyard(state, playerId, cardId, allCardData, source)
  // Returns graveyard entries filtered to a specific type
  getGraveyardByType(player, type)  // e.g. getGraveyardByType(player, 'MOSJE')
  ```
- **D-08** All callers use these helpers instead of ad-hoc `discard.push` scattered across files.

### Fix revival cards to use graveyard
- **D-09** **Mosje Reborn** (`effect_mosje_reborn`):
  - Was: `player.welloe.shift()` (takes first defeated Mosje)
  - Now: `getGraveyardByType(player, 'MOSJE')[0]` → splice that entry from `player.graveyard`
  - Behaviour identical — just reads from graveyard instead of welloe

- **D-10** **Call of the Welloes** (`effect_call_of_welloes`):
  - Was: `player.welloe.map(w => ({ cardId, name, mp, level }))`
  - Now: `getGraveyardByType(player, 'MOSJE').map(...)` — full objects already there
  - `_callOfWelloesPending.welloeOptions` label stays (it's a pending flag key, not user-visible)

- **D-11** **confirmCallOfWelloes** (turnManager.js):
  - Was: `player.welloe.findIndex/splice` to remove the chosen Mosje
  - Now: find entry in `player.graveyard` where `cardId === chosen && type === 'MOSJE'`, splice it out
  - The entry is a full object so `createMosjeSlotFromDefinition` + mp/level override still applies

- **D-12** **Welloe Force** (`effect_welloe_force`): does NOT touch `player.welloe[]` at all. No code change needed — just verify it still works after the rename.

### Fix silent removal bugs
- **D-13** **Klaar met Jou** (`effect_klaar_met_jou`): `opp.hand.pop()` → splice last card, call `addToGraveyard(state, oppId, card.cardId, allCardData, 'discarded')`. Card goes to the OPPONENT's graveyard (they held it).
- **D-14** **Those Eyelashes** (`effect_those_eyelashes`): for each opponent, `hand.shift()` → splice, `addToGraveyard` per player. Each discarded card goes to the graveyard of the player who held it.

### Rename player.discard → player.graveyard
- **D-15** Pure rename. Every `player.discard`, `.discard.push`, `.discard.unshift`, `.discard.shift`, `.discard.splice`, `.discard.length`, `.discard.find` becomes `player.graveyard` equivalent.
- **D-16** Deck reshuffle (deck-out rule in turnManager.js): `player.discard` → `player.graveyard`. Behaviour unchanged.
- **D-17** `toBoardViewModel` in main.js: `discard: player.discard` → `graveyard: player.graveyard`.
- **D-18** boardRenderer.js: `player.discard` → `player.graveyard` in the render call.

### UI rename
- **D-19** Board button/label: "Discard" / "Discard Pile" → "Graveyard".
- **D-20** `showDiscardViewerModal` → `showGraveyardModal` (keep alias for safety).
- **D-21** Modal header: "{Player}'s Graveyard ({count} cards)".
- **D-22** Card descriptions: grep `src/data/*.js` for "discard pile" → "Graveyard". Keep "Welloe" card name references.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read before planning/implementing.**

### Files to change — engine
- `src/engine/victoryChecker.js` — `markMosjeDefeated`: remove welloe.push, upgrade graveyard entry to full object
- `src/engine/turnManager.js` — `confirmCallOfWelloes`: welloe → graveyard filter; deck-reshuffle; all player.discard refs
- `src/abilities/piecieEffects.js` — `effect_mosje_reborn`, `effect_call_of_welloes`, `effect_klaar_met_jou`, `effect_those_eyelashes`; all player.discard refs
- `src/abilities/mosjeAbilities.js` — all player.discard refs (Binti, Stookerino)
- `src/abilities/placeEffects.js` — all player.discard refs (Tesla, Huisbaas)
- `src/abilities/snelleEffects.js` — check for any discard refs

### Files to change — UI
- `src/main.js` — `toBoardViewModel` discard→graveyard; showDiscardViewerModal→showGraveyardModal call
- `src/ui/modalManager.js` — rename function, update header text, graveyard: player.graveyard
- `src/ui/boardRenderer.js` — button label, player.discard→player.graveyard

### Files to change — data descriptions
- `src/data/piecies.js` — "discard pile" → "Graveyard"
- `src/data/mosjes.js` — "discard pile" → "Graveyard"
- `src/data/snellePiecies.js` — "discard pile" → "Graveyard"
- `src/data/places.js` — "discard pile" → "Graveyard"

### Tests to update
- All test files with `.discard`, `player.welloe`, `welloe.length` references

### Project rules
- `CLAUDE.md` — pure functions, one function per file
- Discard pile rule (memory): ALL destroyed/discarded cards visible in graveyard

</canonical_refs>

<specifics>
## Wave Plan

**Wave 1 — Engine (TDD)**
Plan 23-01: Create `graveyardUtils.js` + eliminate `player.welloe[]` + fix revival cards + fix silent-removal bugs + rename `player.discard`→`player.graveyard` across all engine/abilities files + update all tests.

**Wave 2 — UI + data (execute)**
Plan 23-02: UI rename (label, modal function, header) + card description grep-replace + boardRenderer + main.js viewModel + docs.

Wave 2 depends on Wave 1 (player.graveyard must exist before UI wiring).

## Test coverage required (Wave 1)
- `graveyardUtils.test.ts` — toGraveyardEntry, addToGraveyard, getGraveyardByType
- `mosje-reborn.test.ts` or additions to existing — reads from graveyard not welloe
- `call-of-welloes.test.ts` — existing tests updated; effect reads from graveyard
- `klaar-met-jou.test.ts` or piecieEffects additions — discarded card appears in opponent graveyard
- `those-eyelashes.test.ts` — discarded cards appear in each holder's graveyard
- All existing tests that reference `.discard` or `.welloe` updated

</specifics>

<deferred>
- Opponent graveyard viewing
- Graveyard-count card mechanics
- Banish zone
- Card names ("Call of the Welloes", "Welloe Force") — flavour names, not renamed
</deferred>

---

*Phase: 23-graveyard-system*
*Context updated: 2026-06-04*
