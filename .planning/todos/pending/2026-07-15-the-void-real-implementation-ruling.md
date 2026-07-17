---
created: 2026-07-15
title: The Void — full ruling for its real mechanic (replaces the current blanket MP-block)
area: general
files:
  - src/data/places.js:123-134 (place_the_void card data)
  - src/engine/mpManager.js:32-35, 103-109 (current blanket gainMP/loseMP block — too broad, to be replaced)
  - src/engine/turnManager.js:820-827 (current activatePiecie RESTORE/FOOD tag block — too broad, to be narrowed)
  - src/abilities/questLogic.js (baseQuestMpBlocked — removed in Phase 35-07 as dead code; quests should NOT be Void-blocked per this ruling anyway)
  - src/data/piecies.js (every FOOD/RESTORE-tagged Piecie — needs per-card MP-direction classification)
---

## Context

Phase 35 (Places Text-vs-Engine Reconciliation) explicitly DESCOPED The Void this round —
CONTEXT.md called it "an unresolvable ambiguity across 9 play/activate functions," and 35-07
hides it from all player-facing pools (deck-building, boosters) rather than implementing it, while
still cleaning up dead code around the current (wrong) implementation.

During 35-07's Task 2 (removing a redundant `baseQuestMpBlocked` gate in `questLogic.js`), a
side-effect nuance surfaced — the current implementation blocks Quest MP unconditionally while
Void is active, which turns out to be flatly wrong per Gandoe's ruling below. Since Void is about
to be hidden from every player-facing pool in this same phase, the current wrong behavior is
harmless in practice (unreachable), but a future phase must implement it correctly before
un-hiding the card. Ruling captured 2026-07-15.

## Gandoe's Ruling (verbatim intent, 2026-07-15)

1. **The Void does NOT block Quests at all.** Quest MP gains/losses behave completely normally
   while Void is active — this is a full reversal of the current `mpManager.js` gate, which
   currently blocks `gainMP`/`loseMP` unconditionally for ANY reason (quests included) while
   `activePlace === 'place_the_void'`.
2. **The Void does NOT block Mosje abilities, Snelle Piecies, or quest-arming Piecies either.**
   Battle Concert ("redirect Alyssa's next Quest failure to an opponent") behaves exactly as its
   own text says — full damage redirect, no Void interaction. Same for Snoeiertje/Super Saiyan
   Mos/Momentum Boost/F1 Telemetry's "next Quest gives bonus MP" arming and consumption — these
   work completely normally regardless of Void.
3. **The Void ONLY affects FOOD-tagged Piecies that GAIN or RESTORE MP, and only at ACTIVATION,
   not at PLACEMENT.** A blocked FOOD/RESTORE-MP Piecie can still be played face-down as normal;
   it just cannot be flipped/activated for its MP effect while Void is active. Piecies that happen
   to carry the FOOD tag but don't grant/restore MP are entirely unaffected — playable and
   activatable exactly as normal.

Example named explicitly by Gandoe: Varkenspootjes and (Warm) Kannetje Melk are blocked from
activation; Controller and Keyboard Piecies (DIGITAL-EQUIPMENT, not FOOD) are unaffected.

## Current implementation gaps vs this ruling

- `src/engine/mpManager.js`'s `gainMP`/`loseMP` (lines ~32-35, ~103-109) block **everything**
  unconditionally while Void is active — must be removed/narrowed so Quests, abilities, and
  non-FOOD Piecies pass through normally. This is the core fix; everything else follows from it.
- `src/engine/turnManager.js`'s `activatePiecie` (lines ~820-827) blocks activation of **any**
  Piecie tagged `RESTORE` or `FOOD`, regardless of whether it actually grants/restores MP. Needs
  narrowing to only Piecies whose effect actually gains/restores MP.
- No existing data field distinguishes "FOOD/RESTORE Piecie that grants MP" from "FOOD/RESTORE
  Piecie that doesn't" — this is the real source of the "unresolvable ambiguity" CONTEXT.md flagged.
  A future phase will need to either add an explicit data flag or read each Piecie's own
  `description` at implementation time card-by-card.

## Per-card classification (starting point for a future phase — verify each, do not assume complete)

| Piecie | Tags | Effect | MP direction | Void should block activation? |
|---|---|---|---|---|
| Kannetje Melk | FOOD, RESTORE | Gain 25 (50 w/ synergy) | Gain | Yes |
| Broodje Döner | FOOD, RESTORE | Gain 35 (70 w/ synergy) | Gain | Yes |
| Ronald Kip | FOOD, RESTORE | Gain 50/60/100 | Gain | Yes |
| Chef's Special | FOOD | Gain 15 or 30 | Gain | Yes |
| Momentum Boost | RESTORE | Restore 15 + arms next-quest +10 | Gain (+ a separate quest-arming effect — per ruling #2, the arming itself should NOT be blocked even if the immediate MP restore is; a future phase must split these two effects) | Yes (immediate MP portion only) |
| Eendjes voeren | RESTORE | Gain 30 or 40 | Gain | Yes |
| Varkenspootjes | RESTORE | Binti +60 MP; anyone else -30 MP | Ambiguous — direction depends on target Mosje | Needs a ruling: block only when the resolved target actually gains MP? |
| Shoettoe | RESTORE | Gain 20 | Gain | Yes |
| Warm Kannetje Melk | FOOD | **Loses** 10 MP, draws 2 | Loss, not gain | **No** — per literal ruling ("food piecies that GAIN/RESTORE MP"), this one should be unaffected |
| Protein Shake | PHYSICAL-EQUIPMENT, FOOD | Gain 25 (35 w/ Boxing Ring) | Gain | Yes |

## Solution

A future phase (un-descoping The Void) should:
1. Remove the blanket `place_the_void` gate from `mpManager.js`'s `gainMP`/`loseMP` entirely.
2. Narrow `turnManager.js`'s `activatePiecie` Void check from "tagged RESTORE or FOOD" to "tagged
   RESTORE or FOOD AND its effect actually gains/restores MP" — resolve the per-card table above
   first, ruling on Varkenspootjes' ambiguous case and Momentum Boost's split immediate-MP-vs-arming
   effect.
3. Confirm quests, Mosje abilities, Snelle Piecies, Battle Concert, and the 4 quest-arming Piecies
   are completely unaffected by Void (no code changes needed there once step 1 removes the
   blanket block — these were only ever blocked as collateral of the too-broad gate).
4. Re-run the full ability-text audit precedent (per-card ruling table → implement → test) rather
   than assuming the classification table above is complete or final — it was compiled quickly
   during 35-07 and should be treated as a starting point, not a locked ruling.
5. Only then should Drain Zone/The Void be removed from `HIDDEN_PLACE_IDS` in
   `src/data/playerFacingPlaces.js` (added in Phase 35-07) to make The Void player-reachable again.
