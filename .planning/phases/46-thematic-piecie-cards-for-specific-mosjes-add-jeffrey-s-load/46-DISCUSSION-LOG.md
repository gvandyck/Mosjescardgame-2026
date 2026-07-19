# Phase 46: Thematic Piecie Cards for Specific Mosjes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
**Areas discussed:** Design principle (all 4 cards), card spec approval

---

## Pre-phase brainstorm (in-conversation, before /gsd-discuss-phase)

Claude presented a full Mosje ↔ Piecie thematic-fit inventory + 8 new card
suggestions. User rulings that scoped this phase:

| Suggestion | User ruling |
|---|---|
| Loaded Dice (Jeffrey) | "great - keep" |
| Coert Hawaiian Tech item | "= Keyboard (exists)" — document only |
| Coert Kast-elein | Hide from game/deckbuilder/booster (already `disabled: true` — verified, no work). Note: Kastelein = "big closet" surname joke, not caretaker |
| Boosterpackkie (Coert KasteLuck) | Approved name (booster pack) |
| Perfect Rhythm (Chris DDR) | Approved name (DDR = dancing game) |
| Chris All-Rounder | "no item" |
| Dikke Plaat (DJ 80/20) | Approved name (big banger of a song) |
| Ming / Hacker / FPS / Youri items | Not selected — deferred |

---

## Design principle (all 4 cards)

| Option | Description | Selected |
|--------|-------------|----------|
| Boosterpackkie mechanic | Lucky-bonus gating questions | |
| Perfect Rhythm mechanic | Threshold-change vs bolt-on | |
| Dikke Plaat mechanic | Stacking with Lucky Beats | |
| Rarity/booster/deck placement | Pool + tier questions | |

**User's choice:** Free-text overriding the per-card deep-dives: "make all those
cards simple, not too strong and maybe a bit thematic towards those mosjes (but
not TOO locked, we might have mosjes in the future who might want to use those)
— prepare them all and present me the ideas for approval. Make them low tier
rarity."
**Notes:** This collapsed all four areas into one principle: generic base
effect + small tag-family kicker, low rarity, no hard gating.

---

## Card spec approval

| Option | Description | Selected |
|--------|-------------|----------|
| Approve all 4 as-is | Lock effects/rarities into CONTEXT.md | |
| Tweak one or more | Change before locking | ✓ |

**User's choice:** "dikke plaat; same as loaded dice effect"
**Notes:** Dikke Plaat changed from MP-gain (+10 MP base) to the Loaded Dice
shape: next Quest roll +1, DJ tag on field → +2 instead. Other 3 cards approved
as presented.

## Claude's Discretion

- Description string wording (house style)
- persistUntilEndOfTurn flags for the questPrepBonus cards (follow Dubbele
  Dosis/Skipping Rope precedent)
- Flavour text
- Perfect Rhythm one-shot flag naming + consumption point

## Deferred Ideas

- Thematic items for Ming, The Hacker, FPS Coert/FPS West, Youri (brainstormed:
  Crystal Ball, Backdoor.exe, 360 No-Scope, Speedrun Route Notes) — future phase.
