---
phase: 10
date: 2026-05-30
areas_discussed: 4
---

# Phase 10 — Discussion Log

## Area 1: Digital Deck Composition

**Question:** Digital Control has 4 Piecies that don't generate MP or cost net MP. What should replace or supplement them?

**Options presented:** Swap 1-2 draw cards for MP gainers / Add Digital Equipment to the deck / Buff quest_prep so it's not a drain / You decide

**Selected:** Add Digital Equipment to the deck

---

**Question:** Keyboard/Mouse/Controller give only 10 MP — buff them when adding to deck?

**Options presented:** Yes — buff to 20–25 MP / Keep at 10 MP but add multiple copies / Buff only with Digital Mosje active

**Selected (freeform):** "yes - make buffs very dependent on mosje type and level for how much MP it gains (lvl 1 lower mp gain than lvl 2)"

→ Locked: 15 / 25 / 40 MP scaling at Lv1 / Lv2 / Lv3, requires Digital Mosje active

---

**Question:** How many Equipment cards to add, and what to replace?

**Selected (freeform):** "Remove the max cardtype per deck rules for now, only keep max 60 cards. This way we can add the new utility cards AND keep pot of weed and such."

→ Locked: Add all 3 Equipment cards to Digital Control, no removals. Per-type deck limits removed (documentation only — not enforced in code).

---

## Area 2: Physical Force & Artistic Rhythm

**Question:** What's the main Physical Force problem?

**Selected:** You decide → Claude assessment: Jeffrey (quest Mosje) can't use FOOD/RESTORE, but broodje_doner x2 in deck is FOOD — zero fallback when Jeffrey is active and quests fail.

---

**Question:** How to fix Jeffrey's FOOD/RESTORE block vs deck composition?

**Options presented:** Add 1-2 SUBSTANCE cards / Relax restriction to FOOD only / Remove restriction entirely

**Selected:** Add 1–2 SUBSTANCE cards to Physical deck

→ Locked: Add piecie_grammetje_pieter + piecie_tikker

---

**Question:** What to do with Artistic Rhythm?

**Options presented:** Playtest first / Add Equipment-scaling treatment / Mirror Physical SUBSTANCE fix

**Selected:** Mirror Physical's SUBSTANCE fix

→ Locked: Add piecie_larry_zegeltje + piecie_grammetje_pieter to Artistic Rhythm

---

## Area 3: Quest Economy

**Question:** Is quest risk/reward a stalling factor?

**Selected (freeform):** "make the rewards of completion higher and adding a small gain when failing"

---

**Question:** Specific numbers — which direction?

**Options presented:** Boost success +20, cap fail at -20 / Halve failure penalties / Success +15, failure +5 consolation / You decide

**Selected:** Boost all success rewards by +20 MP; cap failure penalty at -20 MP

→ Locked: successMP +20 across all quests; failMP capped at -20 maximum

---

## Area 4: Deck-out Rule + Passive Income

**Question:** What happens when a deck runs out of cards?

**Options presented:** Shuffle discard back / Skip draw phase only / Deck-out = level reset

**Selected (freeform):** "option 1 but add 1 turn penalty (1 turn you skip any actions/drawphase as a sort of 'charge up' after deck out)"

→ Locked: Reshuffle discard into deck + skip next turn entirely

---

**Question:** Should Mosjes gain passive MP each turn?

**Selected:** No passive income — the deck changes + quest buffs are enough

→ Locked: No passive income

---

## Claude Discretion Items

- Equipment base MP (without Digital Mosje): set to 5 MP — user specified scaling with/without Digital Mosje but didn't specify the non-Digital base; 5 MP keeps the card playable but clearly inferior
- Jeffrey restriction assessment: decided by Claude after user chose "You decide" — concluded FOOD/RESTORE conflict with broodje_doner is the root issue; SUBSTANCE fix chosen over removing restriction
