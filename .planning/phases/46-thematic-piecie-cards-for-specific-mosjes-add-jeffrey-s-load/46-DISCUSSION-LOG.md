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

---

## Post-implementation review closure

**Date:** 2026-07-19
**Areas discussed:** DDR chain draws, multiple Perfect Rhythm copies, Perfect
Rhythm lifecycle, thematic MP recipient

### DDR chain draws

| Option | Description | Selected |
|--------|-------------|----------|
| Every activation | Manual and DDR-chained activations each draw after their own effect resolves | ✓ |
| Manual only | Chained activations do not count; card text would need an exception | |
| One per chain | An entire automatic chain produces at most one draw | |

**User's choice:** Every activation. The user separately selected
"after that Piecie resolves" for draw timing.

### Multiple Perfect Rhythm copies

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-activation snapshot, non-stacking | A later copy draws from an earlier armed copy, never from its own newly armed flag; all copies together still yield one draw per later activation | ✓ |
| Exclude all Rhythm copies | No Perfect Rhythm copy can ever trigger a prior one | |
| Stack copies | Each armed copy adds another draw to every later activation | |

**User's choice:** Delegated to Codex's recommendation.

### Perfect Rhythm lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Face-up until end of turn | Board state visibly represents the continuing effect and uses the existing persistent-card sweep | ✓ |
| Immediate graveyard | Keep the invisible boolean flag as the only indicator | |

**User's choice:** Delegated to Codex's recommendation.

### Thematic MP recipient

| Option | Description | Selected |
|--------|-------------|----------|
| Qualifying thematic Mosje | First matching COERT receives Boosterpackkie; exact DDR Chris receives Perfect Rhythm | ✓ |
| First active Mosje | Existing generic fallback may award an unrelated Mosje | |

**User's choice:** Delegated to Codex's recommendation.

## Codex's Discretion

- The user said, "just go with what you recommend each time." Codex selected
  the marked recommendations for all remaining review questions.
- Helper naming and code extraction boundaries remain implementation details
  for planning.

## Deferred Ideas

None — the review discussion stayed within Phase 46.
