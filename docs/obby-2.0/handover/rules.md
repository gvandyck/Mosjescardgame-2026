# Obby Card Game 2.0 — Rules (current, 15 Nov 2026)

One clean statement of the rules as they stand, for the code handover. Sources: the project doc "Rules and Decisions" (through 12 Nov), the Personal Quest List (1 Nov rulings), and `rules-update-14-nov.md` (wording pass). Where an older doc in this folder disagrees, this doc wins. Card texts: `card-list.md` / `cards.json`.

## 1. The three numbers
| Number | Belongs to | What it does | How it changes |
|---|---|---|---|
| Energy | The player | Pays for activating cards and summoning Mosjes | +1 at the start of every turn, unspent Energy carries over, max 6 |
| Power | A Mosje | MP the target loses when this Mosje attacks | Printed per level; cards can change it for a stated time |
| MP | A Mosje | Health and progress bar in one | Quests and cards add; attacks, costs and failed Quests take away |

## 2. Card types
| Card | How it's played | Limit |
|---|---|---|
| **Mosje** | Summoned onto your field for its printed Energy cost | 2 on your field |
| **Piecie** | Placed face-down for free; it waits 1 turn ("ready"); then pay its cost to activate. Subtypes: food, gear, pet, substance, attack, trick | 3 slots per player (attached cards don't use a slot) |
| **Snelle** | Activated straight from the hand at any time, also on the opponent's turn. Needs a free Piecie slot | — |
| **Place** | Activated into the middle. Its text applies to both players | 1 in play; it can't be replaced, only destroyed |
| **Personal Quest** | Played from the hand by a Level 3 Mosje of the right type, as that Mosje's action | In the deck |
| **Quest** | 3 face-up in the middle, one per Mosje type; shared stacks, not in decks | 3 open |

## 3. Setup and turn
1. Coin flip for who starts; no compensation for the second player.
2. Each player starts with 1 Mosje on the field (free), 3 cards in hand and 2 Energy. Flip one Quest per type face-up.
3. Start of turn: +1 Energy (max 6), draw 1 card.
4. Placing a card is free; activating costs Energy; summoning a Mosje costs its printed cost.
5. **Each Mosje does one thing per turn:** attack, or attempt a Quest, or (at Level 3) attempt a Personal Quest. Doing nothing is allowed.
6. **Fresh Mosje:** the turn it is summoned it can't attack and can't be attacked or destroyed, until the start of its owner's next turn. A Mosje that just levelled up gets no such protection.
7. Cards that give MP: you choose which of your Mosjes gets it. There is no "active Mosje".

## 4. Attacking (taksen)
- The target loses MP equal to the attacker's Power.
- **Type triangle, attacks only:** Physical beats Digital, Digital beats Creative, Creative beats Physical. +10 Power when attacking the type you beat; no penalty the other way.
- **Resilient is defence:** each Res ★ of the target takes 5 MP off an attack. An attack always does at least 5. Card effects that make a Mosje lose MP ignore Resilient unless the card says otherwise.
- Attacks don't target (see §9).

## 5. Levels
- **Level up:** at 100 MP a Mosje goes up one level and its MP resets to 10 (or its printed start MP). Power and traits come from that level's row. At Level 3, MP stops at 100.
- **Getemt at Level 2 or 3:** a Mosje that ends at 0 MP or less drops one level; MP goes back to 10.
- **Getemt at Level 1:** MP stays 0, the card turns sideways and skips its owner's next turn (upright at the end of that turn). Hit again while sideways → it goes to the Welloe pile.
- Start MP is never 0 (Gandoe, The Destroyer and Alyssa, The Bulldozer start at 10).
- Level upgrades printed on a Mosje's ability start at Level 2 ("From Level 2: …").

## 6. Quests
- Any Mosje may try any of the 3 open Quests. Success gives MP, failure costs MP. Quests never give trait stars. The type triangle does not apply.
- Rolls: 1 die per ★ in the rolled trait, then the card says what is needed ("Need 2× 4+").
- After one attempt, win or fail, the Quest is shuffled back into its stack and the new top card is turned face-up. Stacks never run out.
- **A Quest roll never uses more than 6 dice** (Personal Quest rolls included).

## 7. Personal Quests (the only way to win)
- **Win:** a Level 3 Mosje completes a Personal Quest.
- **Type-locked:** a Physical Personal Quest can be attempted by any Level 3 Physical Mosje, and so on. The Mosje named on it is who it was designed for, not a lock.
- **Pacing:** a Mosje can attempt a Personal Quest only if it started your turn at Level 3.
- A Personal Quest roll counts as a Quest roll: dice bonuses, rerolls and Je Weet Niet all work on it.
- Card lines, in this order, each optional: **Needs:** (must be true) · **Pay:** (what you give up) · **Roll:**.
- **Fail:** the Piecies named under Needs and the cards under Pay are discarded. Places and Mosjes stay. The Personal Quest goes back into your deck and the deck is reshuffled.
- **A Personal Quest can't be discarded by an opponent's effect.**
- Every deck needs at least 1 Personal Quest.

## 8. Attachments
- Gear, pets and The Protector attach: when activated they move onto one of your Mosjes and free their slot.
- Max 2 per Mosje (Jeffrey, The Strongman: 3). A third replaces one of the two; the replaced card is discarded.
- When the Mosje leaves the field, its attachments go to the pile.
- **Gear attached to a Mosje counts as a "ready gear Piecie"**, for Needs lines and for Pay lines.

## 9. Card text rules
- All text, no glyphs. **Colon = condition. Semicolon = cost.** "You can" = optional.
- **Cost first:** a price before a semicolon is paid when the card is played.
- **MP costs:** you can't pay an MP cost that would take a Mosje to 0 MP or less.
- **Target** is a defined word. Piecies, Snelle and Mosje abilities target; attacks don't. Jensen!, Counter Strikka, Zonnebril, Blensen! and The Protector act on anything that says Target.
- **Durations:** no words = instant · "this turn" · "until the end of your next turn" · "during your opponent's next turn" · Attach (stays while the Mosje does) · Place (stays until destroyed) · **Upkeep** ("At the start of your turn: pay 1 Energy or discard this card.").
- **Keywords:** **Needs:** the card can only be activated if this is true · **Attach:** see §8 · **Entrance:** when you summon this Mosje · **Discarded:** when this card is discarded from your hand by any effect · **Level Down:** when this Mosje drops a level · **Combo:** if this is the 2nd Piecie you activate this turn.
- **Friend bonus, three forms:** "A <Friend> …" (the Mosje the card picked) · "With a <Friend> on your field: …" (a check) · "On a <Friend>: …" (attached gear). "A Coert" means any Mosje card of that friend. DJ 80/20 counts as a Gandoe.
- The die icon appears only in Quest and Personal Quest Roll lines; effect text says "die".

## 10. Piles
- **One pile per player.** The Welloe pile and the discard pile are the same pile. Cards say "Welloe pile" when they are about Mosjes.
- A Mosje summoned from an opponent's pile (Mosje Reborn) is yours while in play, for friend bonuses and Personal Quests, and goes back to its owner's pile when it leaves.

## 11. Deck building
- 40 cards, at least 1 Personal Quest. No type limit for Mosjes.
- Copy limit: 2 per card, 1 for ★★★★★ (`getCopyLimit.js` already does this). The limit is not printed on cards.
- Every Mosje is ★★★★ or ★★★★★. Piecies, Snelle, Places and Personal Quests are ★ to ★★★★★. Quests have no rarity.
- Deck theme rule: kit cards only go in a deck with a matching Mosje. Generic cards go anywhere.
- Starter decks: `../starter-decks-draft.md` (Physical, Digital, Creative; 5 Mosjes, 4 Personal Quests, 3 Places, 28 Piecies and Snelle each).

## 12. Mosje stats
- **Trait curve, standard** (all starter Mosjes): 4 / 5 / 6 stars at Level 1 / 2 / 3. Physical: Str 2/3/3, second trait 1/1/2, third 1/1/1. Digital: Tech 2/2/3, Res 1/2/2, third 1/1/1. Creative: Art 2/3/3, second 1/1/2, Res 1/1/1.
- **Specialist curve** (booster Mosjes only): two traits, main 2/2/3 and second 2/3/3, no third trait.
- **Power curve:** Physical bruisers 20/25/30 (Jeffrey, The Strongman; Gandoe, The Destroyer; Alyssa, The Bulldozer) · other Physical 10/20/25 · Digital and Creative 5/10/15 · the physical ones among them 10/15/20 (Gandoe, The Cloude Wizard; FPS Coert; FPS West; Jeffrey, The Silent Gambler). Power 30 is the ceiling.
- Per Mosje: `card-list.md`.

## 13. Card-specific rulings
- **Ctrl+S:** a protected Mosje that reaches 0 MP stays at 0 and keeps its level; after the protection ends it only drops when it loses MP again.
- **The Protector:** a Snelle that attaches at any time; counts as one of the 2 attachments; pay 1 Energy at the start of your turn or discard it.
- **Mosje Reborn:** needs a free Mosje spot.
- **Rebouleh and Youri's ability:** the extra use still pays the normal cost.
- **Binti:** her 20 MP hit can't be used on two turns in a row (track it).
- **Zwoele Ming Power:** a Quest always needs at least 1 success.
- **Knocked Down, Not Out:** an attack, a failed Quest or a Pay all count as losing MP.
- **Kleine Taks** stays in its slot until its second tick, then is discarded.
- **Tikker:** leave it face-up as a reminder until the lock ends.

## 14. Not in this handover
- **Ultimate Mosjes** (a stat-boost card placed on a Mosje; free at Level 3, 3 Energy below): ruled on 30–31 Oct, but no Ultimate card has been designed yet.
- **The 38 general Quests:** their texts have not been through the wording pass (see the handoff).

## 15. Rulings (during the build)
Answers Gandalf gives on a rule or a card while the design update is being built (milestone v2.1). Newest last. Where a ruling changes a card text, `wording-pass.md` and the generated `cards.json` / `card-list.md` are updated too.

| Date | Phase | Question | Ruling |
|---|---|---|---|
| 15 Nov 2026 | 69 | Aloha Tech Support and Lucky Crescendo have no type in `cards.json`. | Aloha Tech Support is Digital; Lucky Crescendo is Creative. |
| 15 Nov 2026 | 69 | Aloha Tech Support names "Coert, Tech Savant". | That is Coert, The Hawaiian Tech Savant. |
| 15 Nov 2026 | 69 | The deck list says "DJ 80/20", the card list "DJ 80/20, The Lucky Mixer". | The card keeps its full name; "DJ 80/20" is shorthand. |
| 15 Nov 2026 | 69 | Which Mosje starts on the field (§3.2)? | The player picks one of the deck's 5 Mosjes at the start of each game; the bot picks one at random. |

### Claude's calls, for Gandalf to review
Gandalf asked on 15 Nov to keep building without stopping for questions. These gaps were filled by Claude so the build could go on. Each one is easy to change; say so and it is changed in the next build.

| Date | Phase | Gap | Call made |
|---|---|---|---|
| 15 Nov 2026 | 70 | §5 says level-up resets MP "to 10 (or its printed start MP)". | Flat 10 for every Mosje. |
| 15 Nov 2026 | 70 | How do you lose? (not in this doc) | As before: you lose when you have no Mosje left outside your pile. |
| 15 Nov 2026 | 70 | Empty field at the start of your turn; the first player's first draw; running out of deck. (not in this doc) | As before: the cheapest Mosje from hand or deck is placed for free; the first player skips their first draw; on deck-out the pile is shuffled into a new deck and that turn is a cooldown turn. |
| 15 Nov 2026 | 70 | One pile per player: what is reshuffled on deck-out? | Everything in the pile except Mosjes; Mosjes stay in the pile. |
| 15 Nov 2026 | 70 | §4: in what order do bonuses and reductions apply to an attack? | Power (printed + boosts + triangle) → card shields → Resilient (−5 per ★). If a card prevents the whole attack it does nothing; otherwise it does at least 5. |
| 15 Nov 2026 | 70 | §6: fewest dice on a roll? | 1 (a Mosje with no ★ in the trait still rolls 1 die); most is 6. |
| 15 Nov 2026 | 70 | §7: which Piecies are "named under Needs" when several qualify? | The player chooses which ready Piecie counts; that one is discarded on a fail. |
| 15 Nov 2026 | 70 | §7: on a failed Personal Quest, is MP or Energy paid under Pay given back? | No. Pay is never refunded. |
| 15 Nov 2026 | 70 | §7: can your own effects discard your Personal Quest? | Yes. Only an opponent's effect can't. |
| 15 Nov 2026 | 70 | §8: do attachments survive a level-up or level-down? | Yes, they stay while the Mosje is on the field. |
| 15 Nov 2026 | 70 | §8: which cards attach? | The ones whose text has the keyword Attach, not every gear or pet card. |
| 16 Nov 2026 | 70 | §6: a Quest is shuffled back after one attempt. Can the same Quest come up again at once? | Yes. A stack with one Quest always shows that Quest again. |
| 16 Nov 2026 | 70 | Zo is Natuur (−10 on attacks against Res 2+) next to the new Resilient defence. | Both apply; the Place is not a starter card and is left as it is. |
| 16 Nov 2026 | 70 | §10: a Mosje card discarded from a hand, at deck-out. | It stays in the pile like a fallen Mosje. Effects that take a card from the pile can still take it; they can't take a fallen Mosje. |
| 16 Nov 2026 | 70 | §11: is the 40-card deck rule checked at the start of a game? | Not yet. The checker exists and the three starter decks pass; enforcing it would refuse the 30-card Example Decks and custom decks. |
| 16 Nov 2026 | 70 | §8: Dubbele Temminks on an Attach card. | Dubbele Temminks is used up but the card is not attached twice. |
| 16 Nov 2026 | 70 | §9 Target: which cards open the targeted reaction window? | Only cards whose text says Target: Eendjes voeren, Varkenspootjes, Kleine Taks, Ronald Mastermind's Master Plan, Binti's Cutting Words. Affoe, Harde Didde and Klaar Met Jou no longer open it. |
| 16 Nov 2026 | 70 | §9 costs: does a repeat by Dubbele Temminks pay the cost again? | No. |
| 16 Nov 2026 | 70 | §7: Jantje Jantje names a Personal Quest in the opponent's hand. | It counts as a miss. |
| 16 Nov 2026 | 70 | §7: Ronald Chef's Strategic Insight, Binti's Cutting Words or Stookerino when the opponent holds only Personal Quests. | Treated as an empty hand: nothing happens, and Ronald Chef's ability is refused without costing Energy. |
| 16 Nov 2026 | 70 | §9 Combo with copies and repeats. | Combo does not fire for a copy (Gevalletje Klakkeloos); with Dubbele Temminks it fires once, after both runs. |
| 16 Nov 2026 | 70 | §9 Entrance: which arrivals count? | A summon from the hand or the pile. Not the starting Mosje and not the free Mosje on an empty field. |
| 16 Nov 2026 | 70 | §9 Upkeep with 0 Energy. | The card is discarded without asking. |
| 16 Nov 2026 | 70 | §7: on a fail, a Piecie named under Needs that Pay already discarded. | It is skipped, not discarded twice. |
| 16 Nov 2026 | 70 | Does a Personal Quest attempt count as a Quest in the end-of-game stats? | No. |
| 19 Nov 2026 | 71 | Youri (with Chris), FPS West (with FPS Coert) and Binti (with Coert) still had an old synergy line that is not in the 2.1 text. | Switched off for these three. Booster Mosjes keep theirs. |
| 19 Nov 2026 | 71 | Blikje Monsteros: "gain 2 Energy this turn". | A plain gain, max 6; Energy that is not spent carries over like any Energy. |
| 19 Nov 2026 | 71 | Ctrl+S on a Level 1 Mosje. | No effect: the card stops a level drop, and a Level 1 Mosje at 0 MP goes sideways as always. |
| 19 Nov 2026 | 71 | Do Bowie & Stormey and Afblijven! keep a Piecie slot while they last? | Yes. Afblijven! only works during the opponent's turn. |
| 19 Nov 2026 | 71 | "+1 die on one Quest this turn" on a card that names no Mosje (Dikke Plaat, Dubbele Dosis, Gekke Dobbel). | The die goes to that player's next Quest roll this turn, whichever Mosje rolls. Gekke Dobbel gives 2 when that Mosje is a Jeffrey. Controller's and Dancepad's die belongs to the Mosje the card picked. |
| 19 Nov 2026 | 71 | Hawaiishirt ("your first Piecie each turn costs 1 less") and Coert's Caravan ("1 Piecie for 2 less"): does the player choose which Piecie? | No. Hawaiishirt applies to the first Piecie activated each turn, also a 0-cost one; the Caravan to the first Piecie that costs 1 or more. Both add up, never below 0. |
| 19 Nov 2026 | 71 | DJ 80/20 from Level 2: "reroll up to 2 dice". | Two single-die rerolls that turn, on one roll or on two. Only on the owner's own Quest and Personal Quest rolls. |
| 19 Nov 2026 | 71 | Do Oh nee toch niet, Nieuwe Gimma and Punto Banco work on a Personal Quest roll? | Yes (it counts as a Quest roll). Zwoele Ming Power does not, as its text says. |
| 19 Nov 2026 | 71 | FPS Coert: a Quest that rolls "your best trait". | Does not count as a Quest that rolls Str or Tech. |
| 19 Nov 2026 | 71 | FPS West: when do "they draw 1"? | Only when a card was put on the bottom. The 20 MP is a price: he must stay above 0. A Personal Quest can't be picked. |
| 19 Nov 2026 | 71 | Ronald, Dr. Phill-osoof used twice on the same Mosje before it rolls. | The marks add up (2 dice less), never below 1 die. |
| 19 Nov 2026 | 71 | Gandoe, The Cloude Wizard with fewer than 3 cards in the deck. | He looks at what is there. With an empty deck the ability can't be used and costs nothing. |
| 19 Nov 2026 | 71 | How is Punto Banco offered? | A question right before the roll. The bot never plays it (Phase 73). |
| 19 Nov 2026 | 71 | Jensen! and a Mosje ability that targets. | Jensen! reacts to a Piecie or Snelle only, as its text says. |
| 19 Nov 2026 | 71 | In De Groove with two Chrises on the field. | The first one gains the 10 MP. |
| 19 Nov 2026 | 71 | Chris, The BigStepper: "you can" activate another Piecie. | The question has a "no" option. |
| 19 Nov 2026 | 71 | Ronald, The Master Chef: "the first food Piecie each turn gives 10 MP more", when that card gives no MP. | The bonus is used up on it anyway (Late Night Döner, Varkenspootjes on a non-Binti Mosje). |
| 19 Nov 2026 | 71 | Michelle, Iron Tuk, when her reduction takes the whole attack away. | The attack does 0. The 5 minimum is for Resilient only. |
| 19 Nov 2026 | 71 | Binti from Level 2: 20 MP, "not on two turns in a row". | The turn after a 20 MP hit she can still use the ability, but it hits for 10. A 10 MP hit never starts the limit. |
| 19 Nov 2026 | 71 | Which Mosjes count as "a West"? | Parkour West and FPS West. Martin, Señor West is a Martin. |
| 23 Nov 2026 | 73 | How does the bot play towards a Personal Quest? | Its keeper is the own Mosje that matches a Personal Quest in its hand. While the keeper grows, Quests count double and ordinary attacks a quarter; a Level 3 keeper only finishes Mosjes or takes safe Quests. It attempts every legal Personal Quest, best win chance first. |
| 23 Nov 2026 | 73 | What does the bot keep for its Personal Quest? | Near or at Level 3 it keeps the Piecies, hand cards and Energy the quest names, and plays the Place the quest needs before the attempt. |
| 23 Nov 2026 | 73 | Punto Banco and the bot. | The bot now plays it as a Place when nothing better fits and calls it on a Personal Quest roll (1 spare Energy) or a Quest under 85% chance (2 spare Energy). Replaces the Phase 71 call "the bot never plays it". |
| 23 Nov 2026 | 73 | Who pays Te Hard Gaan and Ronalds Fles Fireman for the bot? | A Mosje that can attack and stays above 0 MP, never the Level 3 keeper. No such Mosje: the card is not played. |
| 23 Nov 2026 | 73 | When does the bot press FPS West? | Only with 45+ MP, 2 spare Energy and 2+ cards in the opponent's hand. It bottoms a Snelle if it sees one. |
| 23 Nov 2026 | 73 | A tap on an attached-Gear chip on a Mosje tile (desktop). | Opens the Gear's detail, not the Mosje's action tray (as built in Phase 72). The chips cover about 7% of the tile; left as it is. A phone shows no chips. |
