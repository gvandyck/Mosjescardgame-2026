# Obby Card Game 2.0 — Rules & Decisions

Status: design locked on 9 Oct 2026, ready for the card rework. Replaces the "Momentum Edition V4" core loop.
Newbie-friendly rules doc (shareable): https://claude.ai/code/artifact/db0c7bbc-0559-4d39-a29b-2ff2a9a83807
Board + card mockups (design canvas): https://claude.ai/artifact/KeJ62aYvTc96MooGKpWiD5
Card frame / rarity design sheet: https://claude.ai/artifact/MpeFz61Zf4Cfrvc21MsT2T (Tiers 7 + 8 = final style)

## Why 2.0
After playing Hearthstone: the old game used MP for everything (spending, progress, damage), so turns felt flat and attacking was an afterthought. 2.0 splits this into three clear numbers and makes every turn a choice between growing your own Mosje and slowing down your opponent's.

## The three numbers
| Number | Belongs to | What it does | How it changes |
|---|---|---|---|
| Energy | The player | Pays for activating cards | +1 every turn, unspent Energy carries over, max 6 |
| Power | A Mosje | MP the target loses when this Mosje attacks | Printed on its level row; cards can boost it "this turn" only |
| MP | A Mosje | Health and XP bar in one | Quests/Piecies add, attacks and failed Quests drain |

A number on a card is its cost: the Energy it takes from your pool. Mosjes never hold Energy.

## Card types
| Card | What it is | How it's played | Limit |
|---|---|---|---|
| Mosje | Fighter with own starting MP, Power, traits, level path | Summoned onto your field | 2 per player |
| Piecie | Item or action | Placed face-down for free, must wait 1 turn ("ready"), then pay its cost to activate | 3 per player |
| Snelle | Instant | Activated straight from hand, any time, also on opponent's turn — only with a free Piecie slot | — |
| Place | Location, rules for everyone | Activated into the middle; can't be overwritten, only destroyed | 1 per field |
| Quest | Challenge that gives/costs MP | 3 face-up in the middle, one per Mosje type (Fighting, Digital, Artistic); a finished Quest is replaced by the next of that type | 3 open |

## All rules
1. Win: get a Mosje to Level 3 and keep it there until the start of your next turn.
2. Setup: 1 Mosje on your field, draw 3 cards, start with 2 Energy. Flip one Quest per Mosje type face-up.
3. Field: max 2 Mosjes + 3 Piecies per player; 1 Place and 3 Quests in the middle.
4. Start of turn: +1 Energy (max 6), draw 1 card.
5. Unspent Energy stays for next turn.
6. Placing a card is free; activating costs Energy.
7. Piecies wait 1 turn face-down before they can be activated.
8. Snelle: from hand, any time, needs a free Piecie slot.
9. Only 1 Place; it can't be swapped, only destroyed.
10. Each Mosje may do one thing per turn: attack OR Quest. Doing nothing is allowed.
11. Attack (taksen): target Mosje loses MP equal to attacker's Power.
12. Quest: any Mosje may try any of the 3 Quests; own type is usually smartest (matches traits). Success gives MP, failure costs MP. Quests give MP only, never trait stars.
13. Fresh Mosje: can't attack and can't be attacked or destroyed until the start of its owner's next turn.
14. Cards that give MP: you choose which of your Mosjes gets it (no "active Mosje" concept anymore).
15. Level up: 100 MP → next level (1 → 2 → 3), MP resets to 0.
16. Getemt at Level 2 or 3: at 0 MP or less → drops one level, back to 50 MP.
17. Getemt at Level 1: MP stays 0, card turns sideways, it skips your next turn (upright at the end of that turn). Hit again while sideways → Welloe pile (out).

## Mosje design rules
- Each Mosje keeps its own starting MP (low MP + strong ability vs. high MP + safe is a deliberate choice).
- Traits only change by levelling: the card prints a level path, e.g. `LVL 1: Physical ★★ · Power 20` / `LVL 2: Physical ★★★ · Power 30` / `LVL 3: hold to win`.
- No separate Level 2 cards (Pokémon-style evolution rejected for now).
- Physical play: 1 level marker + 1 MP dial per Mosje, 6 Energy crystals per player. Boosts last "this turn" only; lasting effects are cards on the table.

## Quest design rules
- Requirements mix: trait dice (roll 1 die per trait star, e.g. "need two 4+"), Piecie requirements (e.g. discard a ready food Piecie), Energy payments, board state.
- Places can modify Quests (e.g. The Gym: Physical Quests roll 1 extra die).
- Odds for "two 4+ on N dice": 1 die 0%, 2 dice 25%, 3 dice 50%, 4 dice 69%.

## Card face layout (final style, Tiers 7/8)
- Cost top-left, no box, label "COST". Name left-aligned next to it.
- Mosje footer: Power bottom-left, LVL chip + type centre, MP bottom-right. Field mode drops the cost.
- Description box: frosted/transparent with blur (as Tier 7), seigaiha frame on ★–★★★, plain black full art at ★★★★.
- Few colours: black, white, one type colour per card.

## Board (web UI)
- Felt table with wood rim and stitched seam; field cards 180×132; face-down Piecies 88×132; per player one row: 3 Piecies + 2 Mosjes; middle: Place left, 3 Quests + Quest deck centre, End Turn right; hand of 3 at the bottom with real card frames.

## Sample reworked cards (reference)
- Gandoe, The Unpredictable Wizard — Mosje, Fighting, cost 3, Power 20. Chaos Roll at turn start: 1–2 lose 10 MP, 3–4 nothing, 5–6 +10 Power this turn.
- Ronald, The Master Chef — Mosje, Digital, cost 3, Power 20, MP 0. Strategic Insight: once per turn pay 2 Energy, look at opponent's hand and block one card until their next turn. LVL 2: Physical ★★ · Power 30.
- Alyssa, The Bulldozer — Mosje, Fighting, cost 4, Power 30. When taksed for 30+ MP in one turn: regains 25 MP and +10 Power this turn.
- Te Hard Gaan — Piecie, cost 2: one of your Mosjes gets +20 Power this turn; at end of turn it loses 10 MP.
- Kannetje Melk — Piecie (food), cost 0: gain 25 MP to one of your Mosjes.
- Lucky Cóin — Snelle, cost 1: reroll any dice (Creative ★★★: choose result). Requires Creative ★.
- The Gym — Place, cost 3: Fighting Mosjes +10 Power; Physical Quests roll 1 extra die; non-Fighting Mosjes lose 10 MP at turn start.
- Arm Wrestling — Fighting Quest: roll 1 die per Physical ★, need two 4+. +40 / −30 MP.
- Endurance Test — Fighting Quest: discard 1 ready food Piecie; roll 1 die per Physical ★, need one 4+. +50 / −30 MP.

## Open questions
- Does summoning a Mosje cost Energy (Ronald/Alyssa show a cost), or is it free like placing?
- Rename "Getemt" too (e.g. "Getakst"), since "temmen" was dropped?
- Level 3 starts at 0 MP, so holding it is hard — enter Level 3 with 50 MP instead?
- Who goes first, and does the second player get compensation (e.g. +1 Energy or a free Kannetje Melk)?
- Conversion of old MP costs to Energy (proposal: 5–10 MP → 1, 15 → 2, 20–25 → 3, 30+ → 4).
- Deck size and deck-out under the slower Energy curve.
- Trait list (Physical, Mental, Social, Creative, Technical, Resilient) vs. 3 Mosje types: which traits each type's Quests use.

## Cleanup backlog
Done in Phase 3 (`Obby Card Game 2.0 - Phase 3 Piecies and Snelle.md`); MP Adjuster was cut.
- Reword "your active Mosje" → "one of your Mosjes": Broodje Döner, Ronald Kip, Nature's Gift, Perfect Setup, MP Adjuster, Emergency Swap.
- Mosje Reborn mentions Level 0, which no longer exists.
