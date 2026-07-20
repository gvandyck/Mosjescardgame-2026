# Phase 46: Thematic Piecie Cards for Specific Mosjes - Context

**Gathered:** 2026-07-19 (updated after post-implementation code review)
**Status:** Ready for planning

<domain>
## Phase Boundary

Add **4 new thematic Piecie cards**, each tied to a Mosje that currently lacks a
dedicated item, plus bookkeeping for two no-code decisions. The cards follow one
shared design principle settled in discussion:

> **Generic effect anyone can use + a small kicker if the named Mosje/tag-family
> is on the field. Nothing hard-gated to one Mosje. Simple, not too strong, low
> rarity.** Future Mosjes sharing the tag families should benefit automatically.

**In scope:**
- 4 new Piecie definitions in `src/data/piecies.js` + 4 effect functions in
  `src/abilities/piecieEffects.js` + tests (card-test-library specs + unit tests
  where applicable).
- Docs: `docs/card-reference.md` rows for the 4 new cards + a note that Keyboard
  is Coert Hawaiian Tech Savant's thematic item (existing card, no code change).

**Out of scope:**
- No changes to existing passives (Perfect Combo Chain, Lucky Beats, Morning
  Luck, Brute Force). Kickers are independent bolt-ons.
- No starter/duo deck composition changes — all 4 cards are booster-pool cards.
- Coert Kast-elein stays hidden (`disabled: true` already set — verified, no work).
- Chris All-Rounder deliberately gets **no** dedicated item (user ruling).

</domain>

<decisions>
## Implementation Decisions

### Approved card specs (user-approved 2026-07-19, incl. Dikke Plaat revision)

- **D-01 — Loaded Dice (Jeffrey), ★★:** Your next Quest roll this turn gets +1.
  If a JEFFREY-tagged Mosje is on your field: +2 instead.
- **D-02 — Boosterpackkie (Coert KasteLuck), ★★:** Draw 1 card, then roll 1d6 —
  on 5-6 draw 1 additional card. If any COERT-tagged Mosje is on your field:
  also gain 10 MP.
- **D-03 — Perfect Rhythm (Chris DDR), ★:** Your next Piecie activation this
  turn also draws 1 card. If Dancing/DDR Chris (`mosje_chris_ddr`) is on your
  field: also gain 10 MP.
- **D-04 — Dikke Plaat (DJ 80/20), ★★:** Same effect shape as Loaded Dice —
  next Quest roll this turn +1; DJ-tagged Mosje on field: +2 instead.
  (User revision: originally MP-gain, changed to mirror Loaded Dice.)
- **D-05 — Shared card fields:** `mpCost: 0`, `requirement: "any"`, subtype
  UTILITY, `artPath: "assets/piecies/placeholder.png"`, `isBoosterOnly: true`
  (booster pool only, no starter deck slots).
- **D-06 — Kicker detection by tag family, not exact cardId** (except Perfect
  Rhythm's DDR-Chris check which is a specific card): JEFFREY tag, COERT tag,
  DJ tag — so future Mosjes in those families benefit automatically. Matches
  the user's "not TOO locked" instruction.
- **D-07 — Keyboard documentation only:** Coert Hawaiian Tech Savant's thematic
  item is the existing `piecie_keyboard` — record the pairing in
  card-reference.md; no code change.
- **D-08 — MP five-grid rule:** all MP values are multiples of 5 (10 MP kickers
  comply; see memory rule mp-five-grid-rule).

### Post-review gap-closure rulings (user delegated recommended choices)

- **D-09 — Every resolved Piecie activation counts for Perfect Rhythm.**
  Manual field-slot activations and automatic Piecies chained from hand by
  Chris DDR each draw 1 after that Piecie's own effect resolves. Draw-triggered
  Place effects run normally for each card drawn.
- **D-10 — Self-trigger is determined from the pre-activation state.** A
  Perfect Rhythm cannot draw from the flag it arms itself. If a Rhythm was
  already armed before a later Perfect Rhythm copy activates, that later copy
  does draw 1 from the earlier effect. This applies equally inside a DDR chain.
- **D-11 — Multiple Perfect Rhythm copies do not multiply the payoff.** The
  effect remains a boolean turn flag: while one or more copies have armed it,
  each later Piecie activation draws exactly 1, not 1 per copy.
- **D-12 — Perfect Rhythm visibly persists until end of turn.** Add the same
  `persistUntilEndOfTurn` lifecycle used by other turn-long Piecies. Each
  activated copy stays face-up, then the normal end-turn sweep moves it to the
  graveyard. Once armed, the turn flag remains active until the normal end-turn
  clear even if the visible card leaves its slot early.
- **D-13 — The thematic Mosje receives the +10 MP kicker.** Boosterpackkie
  awards the first active, non-defeated COERT-tagged Mosje; Perfect Rhythm
  awards exact active `mosje_chris_ddr`. Do not fall back to the first unrelated
  active Mosje. Existing cap and `allowLevelUp: false` behavior remain; excess
  does not spill to another Mosje.
- **D-14 — Non-ruling review cleanup is approved.** Clarify Boosterpackkie's
  description so the 5-6 gate applies only to its extra draw while COERT's
  +10 MP is unconditional on the roll; change Perfect Rhythm logs from "next"
  to "later"; normalize the four new documentation IDs to the existing
  kebab-case convention; add focused regression tests for D-09 through D-13.

### Claude's Discretion
- Exact wording of `description` strings (keep the existing terse house style,
  e.g. "Your next Quest roll this turn gets +1. JEFFREY Mosje on field: +2 instead.").
- Loaded Dice / Dikke Plaat continue using `persistUntilEndOfTurn: true`;
  D-12 now locks the same lifecycle for Perfect Rhythm.
- Flavour text (may be left empty like most Piecies).
- Helper names and extraction boundaries for sharing the Perfect Rhythm draw
  hook between manual and DDR-chain activation paths.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Card data + effect patterns
- `src/data/piecies.js` — card definition shape; UTILITY block; `isBoosterOnly`
  + `persistUntilEndOfTurn` usage (see piecie_quest_prep / Dubbele Dosis).
- `src/abilities/piecieEffects.js` — effect function pattern (`cloneState`,
  `getFirstActiveSlotIndex`); `questPrepBonus` consumers at lines ~502/990/1047/1113
  (Dubbele Dosis +2, Controller +1, Skipping Rope +1) — Loaded Dice / Dikke Plaat
  reuse this exact mechanism; tag-family field checks (e.g. effect_bowie_stormey's
  petTags scan, Boxing Gloves GANDOE check).
- `src/data/boosterEngine.js` — booster pool inclusion (new cards flow in
  automatically unless `disabled`).

### Process (mandatory)
- `CLAUDE.md` §"full verification sequence" — node --check → npm test → sim
  (cards touch quest-roll bonuses and MP gain → run Ronald Kip stacking + sim).
- `docs/card-reference.md` — add rows for all 4 new cards + Keyboard pairing note.
- `.planning/phases/39-.../39-CONTEXT.md` — precedent for tag-family checks and
  MP five-grid compliance.

### Post-review closure
- `.planning/phases/46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load/46-REVIEW.md`
  — source of the three warnings and four informational cleanup findings.
- `docs/phase0-rulings.md` — canonical game rules; code must conform where the
  review closure touches MP and card lifecycle behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`questPrepBonus` player field**: already consumed by quest roll resolution;
  Loaded Dice and Dikke Plaat are pure setters (+1 or +2) — no new engine path.
- **Tag scan pattern**: `player.activeSlots.some(s => s && !s.isDefeated && <check>)`
  used throughout piecieEffects.js for Ronald/Martin/Binti checks; tags live on
  the mosje data (`tags: ["JEFFREY"]` etc.) and on slots.
- **Card-test-library** (`tests/ui/cards/`): data-driven factory for new Piecie
  specs — add entries per the registry pattern (uses real engine values).

### Established Patterns
- Draw = `player.hand.push(...player.deck.splice(0, n))` with deck-length guard.
- Dice roll inside effects = same 1d6 pattern as effect_grammetje_pieter /
  effect_kan_het.
- One-shot "next X this turn" flags cleaned up in end-of-turn sweep
  (turnManager) — mirror how questPrepBonus resets.

### Integration Points
- `src/data/piecies.js` UTILITY section (4 new entries).
- `src/abilities/piecieEffects.js` (4 new exported functions; effectId naming:
  `effect_loaded_dice`, `effect_boosterpackkie`, `effect_perfect_rhythm`,
  `effect_dikke_plaat`).
- Perfect Rhythm's draw-on-later-activation flag must be observed from both
  `activatePiecie` and `maybeChainChrisDdrCombo`; the planner should use one
  shared helper so draw timing and Place-on-draw behavior cannot diverge.

</code_context>

<specifics>
## Specific Ideas

- Names are locked: **Loaded Dice, Boosterpackkie, Perfect Rhythm, Dikke Plaat**.
- Dutch flavour is part of the game's identity (Boosterpackkie, Dikke Plaat) —
  keep the names exactly as given.
- "Dikke Plaat" = a banger of a song; "Boosterpackkie" = a literal booster pack
  (meta-nod to the game's own booster store).

</specifics>

<deferred>
## Deferred Ideas

- **Ming, The Hacker, FPS Coert/FPS West, Youri thematic items** — suggested in
  the pre-discussion brainstorm (Crystal Ball, Backdoor.exe, 360 No-Scope,
  Speedrun Route Notes) but not selected by the user this round. Future phase
  if desired.

### Reviewed Todos (not folded)
- All 7 todo matches from cross-reference were false positives (generic
  "mosjes/piecies" keyword hits on the reconciliation/audit track, Phases 38-45).
  None folded.

</deferred>

---

*Phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load*
*Context gathered: 2026-07-19; review closure updated: 2026-07-19*
