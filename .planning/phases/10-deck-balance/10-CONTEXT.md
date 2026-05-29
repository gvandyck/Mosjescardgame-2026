---
phase: 10
name: Deck Balance
status: context-captured
date: 2026-05-30
---

# Phase 10 — Deck Balance: Context

## Domain

Fix game stalling across all 3 starter decks. Games currently end in deck-out or MP stagnation before anyone reaches Level 3. Fix via: deck composition changes (Digital Equipment, Substance cards), quest economy changes (higher rewards, capped failure penalties), and a deck-out reshuffle rule with turn penalty.

---

## Canonical Refs

- `src/data/starterDecks.js` — Starter deck compositions (to be modified)
- `src/data/piecies.js` — Piecie card definitions (Equipment cards already defined, need buffing)
- `src/data/quests.js` — Quest definitions (successMP / failMP fields to be updated)
- `src/engine/turnManager.js` — Turn lifecycle (deck-out / draw phase logic lives here)
- `docs/phase0-rulings.md` — Canonical game rules (check before any rule changes)
- `docs/card-reference.md` — Card implementation status
- `docs/developer-handoff.md` — Architecture overview

---

## Decisions

### 1. Digital Control deck composition

**Decision:** Add all 3 Digital Equipment cards (Keyboard, Mouse, Controller) to the Digital Control starter deck. Do NOT remove any existing cards — the deck simply grows. No other deck gets Equipment.

**Rule change (alongside this):** Remove the per-card-type deck limit rule. Only the 60-card cap applies. (Note: no code enforces card-type limits currently — this is a documentation/rule change only. The `deckLimit: null` field on individual cards is per-card, not per-type.)

**Current Digital Control piecies (keep as-is):**
```
pot_of_weed x2, kannetje_melk x2, quest_prep x2, affoe x1, slecht_gezet x1
```

**Add:**
```
piecie_keyboard x1, piecie_mouse x1, piecie_controller x1
```

### 2. Digital Equipment MP scaling

**Decision:** Digital Equipment cards (Keyboard, Mouse, Controller) scale MP based on the active Mosje's level. Requires a Digital-subtype Mosje to be active for the scaling bonus; non-Digital Mosje gets base only.

| Level | With Digital Mosje | Without Digital Mosje |
|---|---|---|
| Lv1 | 15 MP | 5 MP (base) |
| Lv2 | 25 MP | 5 MP (base) |
| Lv3 | 40 MP | 5 MP (base) |

Each card keeps its existing flavor bonus:
- Keyboard: draw 1 card
- Mouse: look at top 2 cards of any deck
- Controller: next Quest roll +1

**Implementation:** Update `effect_keyboard`, `effect_mouse`, `effect_controller` in `src/abilities/piecieEffects.js` (or wherever these effects live) to check `activePlayer.activeMosje.level` and `activeMosje.subtype === 'DIGITAL'`.

### 3. Physical Force — SUBSTANCE fallback for Jeffrey

**Decision:** Add 2 SUBSTANCE-tagged Piecies to the Physical Force starter deck. These are not FOOD or RESTORE, so Jeffrey can use them.

**Add to Physical Force:**
```
piecie_grammetje_pieter x1  — Roll 1d6: 1-3 lose 15 MP, 4-6 gain 30 MP (SUBSTANCE, GAMBLE)
piecie_tikker x1            — Gain 40 MP. Cannot attempt Quests next turn (SUBSTANCE)
```

**Rationale:** When Jeffrey is active and quests fail (or MP is too low to quest), there are now fallback plays. Jeffrey's FOOD/RESTORE restriction stays intact — these cards are neither.

### 4. Artistic Rhythm — SUBSTANCE fallback

**Decision:** Mirror the Physical treatment. Add SUBSTANCE gamble cards to Artistic Rhythm.

**Add to Artistic Rhythm:**
```
piecie_larry_zegeltje x1    — Roll 1d6: 1-2 lose 25+discard, 3-4 gain 20, 5-6 gain 40+draw 2 (SUBSTANCE)
piecie_grammetje_pieter x1  — Roll 1d6: 1-3 lose 15, 4-6 gain 30 (SUBSTANCE)
```

**Rationale:** Artistic's Binti + kannetje_melk synergy is strong but fragile. Substance cards give Binti/DJ a fallback when the synergy Mosje is in Welloe or when hand is dry.

### 5. Quest economy — success rewards and failure caps

**Decision:** Two changes to all quests in `src/data/quests.js`:

1. **Success rewards: all increased by +20 MP**
   - Before range: +20 to +70 MP
   - After range: +40 to +90 MP

2. **Failure penalties: capped at -20 MP maximum**
   - Any `failMP` worse than -20 (e.g. -25, -30, -40, -60) becomes -20
   - Failures that were already ≤ 20 MP stay unchanged

**Implementation:** Update `successMP` and `failMP` fields in `src/data/quests.js` for all quest entries. No logic changes needed in `questLogic.js` or `resolveQuest` — data only.

### 6. Deck-out rule — reshuffle with turn penalty

**Decision:** When a player's draw pile is empty and they would draw:
1. Shuffle the discard pile back into the deck
2. The active player **skips their entire next turn** (no draw phase, no main phase, no quest phase) — this is the "charge up" penalty
3. After the penalty turn, game resumes normally

**Implementation:** Add this logic to the draw phase in `src/engine/turnManager.js`. Need a new player state flag (e.g. `skipNextTurn: true`) that is checked at the start of each turn and cleared after the skip.

**Scope note:** This is a new status effect on the player state. Check `player.skipNextTurn` in `startTurn()` or equivalent. The engine's existing end-of-turn status sweep should also clear this flag.

---

## Code Context — Reusable Assets

- `player.piecieSlots` — 4-slot array for field cards; no changes needed for deck-out rule
- `player.deck` / `player.discard` — arrays used for draw/discard; deck-out logic uses these
- `player.mosjes[].level` — integer 1/2/3; Equipment scaling reads this
- `activatePlace`, `activatePiecie` — existing activation flows; Equipment cards use the same Piecie activation path
- `resolveQuest` in `src/abilities/questLogic.js` — quest resolution; reads `successMP`/`failMP` from data; no logic change needed for reward buff
- DRAW phase in `turnManager.js` — `startTurn()` → DRAW phase block is where deck-out detection goes

---

## Deferred Ideas

- **Passive MP trickle (e.g. +5/turn)** — decided NOT to implement; existing changes should be sufficient. Revisit if stalls persist after playtesting.
- **Artistic post-bug-fix verification** — flag for a dedicated playtest session to verify Artistic is balanced after Phase 8 fixes before and after these balance changes
- **Jeffrey's FOOD/RESTORE restriction** — debated relaxing to FOOD-only; decided to keep full restriction for now. Revisit if Physical still stalls after Substance additions.
- **Custom deck builder** — user mentioned removing per-type limits; full custom deck builder is a future project phase.
