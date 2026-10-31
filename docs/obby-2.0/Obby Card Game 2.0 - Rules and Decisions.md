# Obby Card Game 2.0 — Rules & Decisions

Status: design locked on 9 Oct 2026, ready for the card rework. Replaces the "Momentum Edition V4" core loop. Updated 29 Oct 2026: card rarity / frame tiers. Updated 30 Oct 2026: one Mosje card with level strip + optional Ultimate, Personal Quest win, full-art-only cards (see "Level cards and Personal Quests" and `Obby Card Game 2.0 - Card Design Lock.md`).
Newbie-friendly rules doc (shareable): https://claude.ai/code/artifact/db0c7bbc-0559-4d39-a29b-2ff2a9a83807
Board + card mockups (design canvas): https://claude.ai/artifact/KeJ62aYvTc96MooGKpWiD5
Card frame / rarity design sheet: https://claude.ai/artifact/MpeFz61Zf4Cfrvc21MsT2T (Tiers 18–22 = current direction; see the Card Design Lock)
Board redesign (Option B) + board-tile tiers and 2.0 states: https://claude.ai/artifact/VG3iSUiuYLu89HeMJtYzoq

## Why 2.0
After playing Hearthstone: the old game used MP for everything (spending, progress, damage), so turns felt flat and attacking was an afterthought. 2.0 splits this into three clear numbers and makes every turn a choice between growing your own Mosje and slowing down your opponent's.

## The three numbers
| Number | Belongs to | What it does | How it changes |
|---|---|---|---|
| Energy | The player | Pays for activating cards | +1 every turn, unspent Energy carries over, max 6 |
| Power | A Mosje | MP the target loses when this Mosje attacks | Printed per level on the Mosje's level strip (Ultimate overrides); cards can boost it "this turn" only |
| MP | A Mosje | Health and XP bar in one | Quests/Piecies add, attacks and failed Quests drain |

A number on a card is its cost: the Energy it takes from your pool. Mosjes never hold Energy.

## Card types
| Card | What it is | How it's played | Limit |
|---|---|---|---|
| Mosje | Fighter; one card with a level strip (Level 1–3 Power + traits); optional Ultimate card on top | Summoned onto your field; Ultimate placed free from hand on top | 2 per player |
| Piecie | Item or action | Placed face-down for free, must wait 1 turn ("ready"), then pay its cost to activate | 3 per player |
| Snelle | Instant | Activated straight from hand, any time, also on opponent's turn — only with a free Piecie slot | — |
| Place | Location, rules for everyone | Activated into the middle; can't be overwritten, only destroyed | 1 per field |
| Personal Quest | Win condition card in your deck, one Mosje type each; requirements per card (board setup, Piecies, roll) | From hand, by a Level 3 Mosje of that type, as its action; fail = back into the deck, reshuffle | rarity limits, ★ to ★★★★★ |
| Quest | Challenge that gives/costs MP | 3 face-up in the middle, one per Mosje type (Fighting, Digital, Artistic); after one attempt (win or fail) it is shuffled back into its stack and the new top card is turned face-up | 3 open |

## All rules
1. Win: a Level 3 Mosje completes a Personal Quest card (ruled 30 Oct 2026; replaces "hold Level 3 until your next turn").
2. Setup: 1 Mosje on your field, draw 3 cards, start with 2 Energy. Flip one Quest per Mosje type face-up.
3. Field: max 2 Mosjes + 3 Piecies per player; 1 Place and 3 Quests in the middle.
4. Start of turn: +1 Energy (max 6), draw 1 card.
5. Unspent Energy stays for next turn.
6. Placing a card is free; activating costs Energy.
7. Piecies wait 1 turn face-down before they can be activated.
8. Snelle: from hand, any time, needs a free Piecie slot.
9. Only 1 Place; it can't be swapped, only destroyed.
10. Each Mosje may do one thing per turn: attack OR Quest OR (at Level 3) its Personal Quest. Doing nothing is allowed.
11. Attack (taksen): target Mosje loses MP equal to attacker's Power.
12. Quest: any Mosje may try any of the 3 Quests; own type is usually smartest (matches traits). Success gives MP, failure costs MP. Quests give MP only, never trait stars.
12b. After one attempt (win or fail) the Quest is shuffled back into its own stack, and the top card of that stack is turned face-up in its place. Stacks never run out. No fail counters (ruled 30 Oct 2026; replaces "replaced after a win or 2 fails").
13. Fresh Mosje: can't attack and can't be attacked or destroyed until the start of its owner's next turn.
14. Cards that give MP: you choose which of your Mosjes gets it (no "active Mosje" concept anymore).
15. Level up: at 100 MP the Mosje goes up one level (level marker), MP resets to 10 (or printed start MP). Power and traits come from that level on the card's level strip. At Level 3, MP stops at 100.
16. Getemt at Level 2 or 3: when it loses MP and ends at 0 or less → it drops one level, MP back to 10 (or printed start MP). With an Ultimate on top: the Ultimate is discarded instead and the Mosje keeps its level at 10 MP.
17. Getemt at Level 1: MP stays 0, card turns sideways, it skips your next turn (upright at the end of that turn). Hit again while sideways → Welloe pile (out).

## Mosje card, levels, Ultimate and Personal Quest (ruled 30 Oct 2026, evening; replaces "one card per level")
- **One card per Mosje.** The card holds all three levels in a **level strip** (Power + traits per level, e.g. `LV1 20 · LV2 30 +Physical★ · LV3 40 +Physical★★`) and one ability that may grow per level. Reason: three cards per Mosje meant 3 artworks per Mosje and fiddly copy limits.
- **Level is tracked on the table**, not with cards: a level marker next to the MP dial.
- **Level up:** at 100 MP the Mosje goes up one level for free; MP resets to 10 (or the card's printed start MP). Levelling up is automatic (ruled 31 Oct; no card needed, so no draw luck).
- **Getemt at Level 2/3:** drop one level, MP back to 10. No card is lost.
- **Personal Quest = its own card type** (ruled 30 Oct, evening; not printed on the Mosje, the level strip already takes that space). PQ cards go in your deck like other cards; you may run several different PQs with different requirements, so you can build e.g. a Fighting deck full of Fighting PQs. **Type-locked:** a Fighting PQ can be attempted by any Level 3 Fighting Mosje (same for Digital, Artistic). **Played straight from hand** when attempted (revealed, opponent can't see it coming); attempting is that Mosje's action. **Fail: the cards it required are discarded; the PQ card goes back into your deck and the deck is reshuffled** (ruled 31 Oct). Every deck needs at least 1 PQ (proposal: minimum 1, since PQs recycle). Frame line **gold** (e.g. `#D4A017`, tint `#FEF3C7`), side label `PERSONAL QUEST · FIGHTING`. **Win: complete a Personal Quest.** The only way to win.
- **Ultimate Mosje** (VMAX/Mega-style chase card): own foil artwork, ★★★★★, limit 1 per deck, not every Mosje has one (rolls out over boosters).
  - Placed from hand on that Mosje at any level: **free at Level 3, 3 Energy at Level 1–2** (ruled 31 Oct; the 3 is a starting value for playtests). The card prints `3` + `OR FREE`.
  - **Stat boost only** for now: replaces the Mosje's Power and traits (and may add a signature ability). No separate Ultimate Quest / win route (considered, parked).
  - The level marker and MP keep working underneath; the Personal Quest still needs Level 3.
  - **Ultimate getemt:** the Ultimate card is discarded, no bonus for the opponent; the Mosje stays (at Level 3 → stays Level 3) at 10 MP. Interpretation for lower levels: it stays at its current level at 10 MP (Ultimate never moves a Mosje up a level).
- Deck: 40 cards (ruled 30 Oct). Copy limits now follow the normal rarity limits; the level-card copy problem is gone.
- Quests: after an attempt shuffle the Quest back first, then flip the new top card (ruled 30 Oct; the same Quest may reappear).
- Personal Quest rarity: spread ★ to ★★★★★ (easy PQs common, hard / flashy ones rare), normal copy limits (ruled 31 Oct).
- Open: Ultimate Energy cost below Level 3 (3 is a playtest start); which Mosjes get an Ultimate first; card layout for the level strip on full art; Ultimate card design; Personal Quest card design (gold line); minimum PQs per deck (proposal 1).

## Mosje design rules
- Each Mosje keeps its own starting MP (low MP + strong ability vs. high MP + safe is a deliberate choice). Default 10; no Mosje card prints 0 MP (raise current 0-MP Mosjes such as Alyssa, The Bulldozer to 10).
- Traits only change by levelling (level strip) or an Ultimate.
- One card per Mosje with a level strip (30 Oct evening; the "three cards per Mosje" idea from earlier that day is dropped). Optional Ultimate card per Mosje.
- Physical play: 1 MP dial per Mosje, 6 Energy crystals per player (the level is the card on top). Boosts last "this turn" only; lasting effects are cards on the table.
- **Rarity: every Mosje is ★★★★ or ★★★★★ (ruled 29 Oct 2026).** ★–★★★ Mosjes do not exist. Ultimates are foil; ★★★★★ Mosjes are foil.

## Card rarity (ruled 29 Oct 2026; frame part superseded 30 Oct by the Card Design Lock)
- Cards are full art only, in two finishes: full art and full art foil (★★★★★ cards and every Ultimate). No rarity mark on the face.
- Piecie, Snelle, Place: ★ to ★★★★★. Mosjes: ★★★★ or ★★★★★. Quests: no rarity.
- Rarity stars still drive deck copy limits and booster drop rates.
- Full visual spec: `Obby Card Game 2.0 - Card Design Lock.md`.

## Quest design rules
- Requirements mix: trait dice (roll 1 die per trait star, e.g. "need two 4+"), Piecie requirements (e.g. discard a ready food Piecie), Energy payments, board state.
- Places can modify Quests (e.g. The Gym: Physical Quests roll 1 extra die).
- Odds for "two 4+ on N dice": 1 die 0%, 2 dice 25%, 3 dice 50%, 4 dice 69%.

## Card face layout
- See `Obby Card Game 2.0 - Card Design Lock.md` (full art only, frame line per type, cost top-left, side labels for type and level, no text box).

## Board (web UI)
- Board v2.4c (Option B) with board tiles in direction A (Card Design Lock, Tiers 22).

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
- Who goes first, and does the second player get compensation (e.g. +1 Energy or a free Kannetje Melk)?
- Conversion of old MP costs to Energy (proposal: 5–10 MP → 1, 15 → 2, 20–25 → 3, 30+ → 4).
- Deck-out under the slower Energy curve (deck = 40 cards).
- Trait list (Physical, Mental, Social, Creative, Technical, Resilient) vs. 3 Mosje types: which traits each type's Quests use.

## Cleanup backlog
Done in Phase 3 (`Obby Card Game 2.0 - Phase 3 Piecies and Snelle.md`); MP Adjuster was cut.
- Reword "your active Mosje" → "one of your Mosjes": Broodje Döner, Ronald Kip, Nature's Gift, Perfect Setup, MP Adjuster, Emergency Swap.
- Mosje Reborn mentions Level 0, which no longer exists.
- Raise every Mosje below ★★★★ to ★★★★ in the card data (e.g. Alyssa Fissa Fissa! and Gandoe show ★★ / ★★★ in the live game).
- Old personal Quests in src/data (Kickboxing Bootcamp etc.) become Level 3 Personal Quest texts.
- **Quest text rework (after the card spec is done):** shorter wording, every Quest's requirement must matter for the game and match its name (e.g. Calculate Odds: "reveal your top 3 cards" does nothing and calculates no odds). Also settle the "First you must:" label (Gated condition vs Prepared cost, align with "Needs:").
