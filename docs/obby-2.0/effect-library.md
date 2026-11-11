# Obby Card Game 2.0 — Effect Library

Drafted 11 Nov 2026 (Gandalf + Claude). Step 1 of Rework Plan **Phase 6 (wording pass + effect library)**. Goal: every card is built from the same small set of parts, so (1) shared effects use the exact same words, (2) cards group cleanly for code and naming, and (3) new cards add new *angles* instead of new numbers.

Source: all 170 active card texts in `src/data` (Piecies, Snelle, Places), the 26 Mosje abilities and the 11 Nov gear round. The 38 generic Quests are left out: they are number tables (win +X / fail −Y), not effects.

---

## 1. Anatomy of an effect

Every effect is built from up to 7 parts, always in this order on the card:

| # | Part | Question | Example |
|---|---|---|---|
| 1 | **Trigger** | When does it happen? | *When this Mosje is attacked:* |
| 2 | **Needs** | What must be true? | *Needs: a Digital Mosje on your field.* |
| 3 | **Target** | Who does it hit? | *one of your Mosjes* · *one opponent Mosje* · *each player* |
| 4 | **Verb** | What happens? (a template below) | *gains* |
| 5 | **Amount** | How much? | *15 MP* |
| 6 | **Duration** | How long? | *this turn* · ⏳1 · Attach |
| 7 | **Friend bonus** | Extra for the right friend | *A Coert gains 25 instead.* |

In code: one handler per **verb template**, with the other parts as parameters.

```js
{ effect: "MP_GAIN", target: "OWN_MOSJE", amount: 15,
  trigger: "ON_PLAY", duration: "INSTANT",
  needs: { typeOnField: "DIGITAL" },
  friendBonus: { friend: "coert", amount: 25 } }
```

---

## 2. Durations (6, with one fixed phrasing each)

Today there are 4+ ways to say how long something lasts ("Stays until the start of your next turn", "Stays until the end of your next turn", "Stays as long as that Mosje does", "Attach:"…). Proposal: 6 durations, each with one phrasing and a card icon.

| ID | On the card | Means | Cards today |
|---|---|---|---|
| `INSTANT` | *(nothing)* | Happens now, card goes to the discard pile | Kannetje Melk, Pot of Weed, most Piecies |
| `THIS_TURN` | **this turn** | Ends at the end of this turn | Super Saiyan Mos, Dubbele Dosis, TweedeKANs |
| `STAYS_1` | **⏳1** "Stays until your next turn." | Covers the opponent's turn, ends when yours starts | Afblijven!, Welloe Force |
| `STAYS_2` | **⏳2** "Stays until the end of your next turn." | One extra turn | Pets, Laat me chillen!, Synergy Field, Mosje Shield, Continuous Assault |
| `ATTACH` | **Attach:** | Under a Mosje until it leaves play or the card is destroyed (max 2 per Mosje) | De Belt, Call of the Welloes, all new gear |
| `PLACE` | *(Place card)* | Until another Place replaces it or it's destroyed | All Places |
| `ONCE` | "The next time …: …. Then discard this card." | Waits for one trigger, then gone | Laat me chillen!, MP Amplifier, Kleine Taks (2 ticks) |

Design note: the ⏳ number is the graphic-design win. Players can see at a glance how long a card stays, without reading.

---

## 3. Verb templates

`Count` = how many current cards use it (one card can use several). **Bold** = the canonical phrasing every card should use.

### MP (Momentum)
| ID | Canonical phrasing | Count | Examples | Note |
|---|---|---|---|---|
| `MP_GAIN` | **One of your Mosjes gains X MP.** | **45** | Kannetje Melk, Broodje Döner, Momentum Rush, Med Kit | Most-used verb in the game: 1 in 4 cards. Enough. |
| `MP_LOSS` | **One opponent Mosje loses X MP.** | 6 | Affoe, Straffoe, Roast-boekje | |
| `MP_COST` | **One of your Mosjes loses X MP.** (as a price) | 10 | Te Hard Gaan, Stripje Bennies, Warm Kannetje Melk | Always written *before* the reward. |
| `MP_SHIELD` | **loses X less** (each time / from attacks) | 12 | Afblijven!, 5 pets, Perfect Dodge, The Protector | Shown as shield + number (Resilient style). |
| `MP_CAP` | **can't lose more than X MP at once** | 1 | Momentum Stabilizer | |
| `MP_DOUBLE` | **gains double** | 2 | MP Amplifier, Synergy Field | |
| `MP_SWAP` | **Swap the MP of …** | 1 | Leipe Swap | |
| `MP_DRAIN` | **… loses X MP and one of your Mosjes gains X MP** | 3 | Affoe, Jantje Jantje… Jantje? | Combo of LOSS + GAIN; one template. |

### Power and combat
| ID | Canonical phrasing | Count | Examples |
|---|---|---|---|
| `POWER_UP` | **gets +X Power this turn** / **Attach: +X Power** | 15 | Super Saiyan Mos, Boxing Gloves, Koksmes |
| `POWER_DOWN` | **gets −X Power** | 6 | Places, Smoke Grenade |
| `KO` | **Send one opponent Mosje with X MP or less to the Welloe pile.** | 2 | Harde Didde, Klaar Met Jou |
| `DOT` | **At the end of each turn, it loses X MP (N times).** | 2 | Kleine Taks, MP Hemorrhage |
| `THORNS` | **Each time an opponent Mosje attacks one of yours, the attacker loses X MP.** | 1 | Welloe Force |
| `LOCK` | **can't attack / can't attempt a Quest / can't play Snelle** | 4 | Señor West, Tikker, Those Eyelashes Tho… |
| `LEVEL_DOWN` | **drops one level** | 1 | Gandoe, The Destroyer |

### Cards (hand, deck, discard)
| ID | Canonical phrasing | Count | Examples | Note |
|---|---|---|---|---|
| `DRAW` | **Draw X.** | **35** | Pot of Weed, Ff Haaltje Nemen, Keyboard | Second most-used. |
| `LOOT` | **Draw X, then discard Y.** | 3 | Bagga of Greed, Kabelbak | |
| `SCRY` | **Look at the top X cards of your deck and put them back in any order.** | 8 | Mouse, Bladmuziek, Minimap, Ming, Cloude Wizard | Too many near-copies; see §6. |
| `PEEK_HAND` | **Look at your opponent's hand.** | 5 | Night Vision, Chef's Special, FPS West | |
| `DISCARD_OPP` | **Your opponent discards 1 card (your / their choice).** | 5 | Stookerino, Binti, Those Eyelashes Tho… | |
| `RECYCLE` | **Take 1 X from your discard pile into your hand.** | 3 | TemPiecie, Chillingsvoorbij!, Reserve-onderdelen | |
| `TUTOR` | **Search your deck for a X and put it in your hand.** | 1 | Huisbaas (MagicPrompt draft) | Gap. |
| `REVIVE` | **Summon a Mosje from your Welloe pile …** | 2 | Mosje Reborn, Call of the Welloes | |

### Dice
| ID | Canonical phrasing | Count | Examples |
|---|---|---|---|
| `DIE_PLUS` | **+1 ▣ on one Quest this turn.** | 15 | Dubbele Dosis, Controller, Sleutelpuntje, Gym |
| `REROLL` | **Reroll 1 ▣.** | 8 | TweedeKANs, Dikke Plaat, Skiffa, Handdoek, DJ 80/20 |
| `REROLL_OPP` | **Your opponent rerolls all those dice.** | 1 | Je Weet Niet |
| `DIE_MINUS` | **… rolls 1 ▣ less.** | 1 | Ronald, Dr. Phill-osoof |
| `GAMBLE` | **Roll 1 ▣: ⚀–⚁ … · ⚂–⚃ … · ⚄–⚅ …** | 6 | Kan het?!, Grammetje Pieter, Larry / Zegeltje | One table layout for every roll card. |

### Energy and tempo
| ID | Canonical phrasing | Count | Examples |
|---|---|---|---|
| `ENERGY_GAIN` | **Gain X Energy this turn.** | 2 | Tesla Laadkabel, Blikje Monsteros | Gap. |
| `COST_DOWN` | **… costs X Energy less (min 0).** | 3+ | Coert's Caravan, Dierenasiel, Silverstone |
| `COST_UP` | **… pays X Energy more.** | 1 | Delluft |
| `EXTRA_USE` | **may use its once-per-turn ability one more time** / **activate one more ready Piecie** | 7 | Rebouleh, Chain Reaction, Double Trigger |
| `COPY` | **its effect happens a second time** / **you get the same effect** | 2 | Dubbele Temminks, Gevalletje Klakkeloos |

### Interaction and protection
| ID | Canonical phrasing | Count | Examples |
|---|---|---|---|
| `CANCEL` | **Cancel it.** | 4 | Jensen!, Jammertje Gepakt!, Frenssen! |
| `REDIRECT` | **… takes it instead.** | 2 | Counter Strikka, Bodyguard |
| `UNTARGETABLE` | **Your opponent's cards can't target this Mosje.** | 2 | Blensen!, Zonnebril |
| `SAVE` | **… isn't sent to the Welloe pile.** | 2 | Not Today!, Mosje Shield |
| `PLACE_DESTROY` | **Destroy the Place.** | 5 | Bong Hit Demolition, Slecht Gezet, Huisbaas |
| `WILDCARD` | **counts as …** | 3 | Dingetje toch?!, Perfect Setup, Synergy Chamber |

---

## 4. Triggers: what we use, what we don't

Today about **120 of 170 cards** only do something *the moment you play them* (`ON_PLAY`). That's the real reason cards feel alike: same trigger + same verb = same card with another number.

| Trigger | Cards today |
|---|---|
| `ON_PLAY` | ~120 |
| `START_OF_TURN` | 10 |
| `ON_ACTIVATE_PIECIE` | 8 |
| `ON_QUEST_WIN` | 6 |
| `WHEN_ATTACKED` / `WOULD_LOSE_MP` | 6 |
| `END_OF_TURN` · `ON_OPP_CARD` · `ON_ROLL` | 5 each |
| `ON_QUEST_FAIL` | 2 |
| `ON_KO` · `ON_PLACE` · `ON_DRAW` | 1 each |
| `ON_SUMMON` · `ON_DISCARDED` · `ON_LEVEL_UP` · `ON_WELLOE` | **0** |

Note: the keyword list below was renamed to English on 11 Nov (Entrance, Discarded, Level Down, Combo…).

### New angles: trigger keywords (ideas)
**Language rule (Gandalf, 11 Nov):** core functions and keywords are **English**. Dutch stays for card names and flavour.

A trigger keyword is a rule: a bold label at the start of a line that says **when** the effect happens (like *Battlecry* in Hearthstone). Each keyword costs 1 rulebook line, 1 code handler and 1 label in the card design; after that, any card can use it. Start with 3–6 per set.

| Keyword | Trigger | What it does to the game | Sample card (draft) | Status |
|---|---|---|---|---|
| **Entrance:** | When you summon this Mosje | Makes *when* you summon a choice | Alyssa, The Bulldozer: *Entrance: one opponent Mosje loses 10 MP.* | Recommended |
| **Discarded:** | When this card is discarded from your hand by any effect | Punishes Binti / Stookerino discard; makes Bagga of Greed a combo piece | *Restjes (food): Discarded: one of your Mosjes gains 15 MP.* | Recommended |
| **Level Down:** | When this Mosje drops a level (getemt) | Comeback for the player who's behind | *Michelle: Level Down: gains 20 MP.* | Recommended |
| **Combo:** | The 2nd Piecie you activate this turn | Sequencing skill: which card first? | *Dancepad: Combo: draw 1.* | Recommended |
| **Fresh:** | If this Mosje is fresh (summoned this turn) | Fresh-only bonus on Piecies | *Kannetje Melk: Fresh: gains 35 instead.* | Overlaps Entrance |
| **Last Words:** | When this Mosje goes to the Welloe pile | KO-ing a Mosje has a price | *Coert, Tech Savant: Last Words: draw 2.* | Later (only 2 KO cards) |
| **Level Up:** | When this Mosje levels up | Rewards the core loop directly | *Cloude Wizard: Level Up: look at your top 3, take 1.* | Later |
| **Each ⚅:** | Each 6 in a roll | One keyword for Lucky Streak / Mixer / Omafiets | *Gekke Dobbel: Each ⚅: +5 MP.* | Later, luck booster |
| **On Draw:** | When you draw your 2nd card in a turn | Payoff for draw decks | *Kabelbak: On Draw: +10 MP.* | Skip (draw saturated) |
| **Detached:** | When this gear leaves its Mosje | Gear isn't just lost | *Omafiets: Detached: draw 1.* | Skip (gear only) |
| **Saved Up:** | End of your turn, per unspent Energy | Rewards patience | *Pokerfiches: Saved Up: +5 MP per Energy.* | Skip (fiddly at the table) |
| **Everyone:** | Each player gets it, you pick first | Group-night flavour, symmetric cards | *Rondje Shotjes: Everyone: Mosjes gain 10 MP, yours 20.* | Later, booster |

### New angles: mechanics (ideas)
| Mechanic | How it works | Fit |
|---|---|---|
| **Counters** | Put a die on the card; +1 each turn; cash in for an effect that scales | Spaarvarken, Tikker-style cards |
| **Trap** | Pay now, place face-down; flips when its trigger happens | Called It already does this |
| **Bodyguard** | Attacks must target this Mosje if able | Kast-elein, De Belt champion |
| **Steal** | Take an attached card from an opponent Mosje | De Belt already moves |
| **Discard Top** | Opponent puts their top card in the discard pile | New angle for Places and Huisbaas |
| **Empty Hand** | Bonus while you hold 0–1 cards | Aggro decks |

---

## 5. Card families and naming (for code and data)

| Family (`subtype`) | Default duration | Template focus | Naming |
|---|---|---|---|
| Food (`FOOD`) | INSTANT | MP_GAIN (+ friend bonus) | Dish names (Broodje Döner, Bento Box) |
| Substance (`SUBSTANCE`) | INSTANT | GAMBLE, MP_COST + reward | Slang names |
| Gear (`GEAR`) | ATTACH | POWER_UP, DIE_PLUS, REROLL, triggers | Object names |
| Pet (`PET`) | STAYS_2 | MP_SHIELD + friend bonus | Pet names |
| Attack (`ATTACK`) | THIS_TURN | POWER_UP, KO, DOT | Shouts / slang |
| Utility (`UTILITY`) | INSTANT | DRAW, SCRY, RECYCLE, EXTRA_USE | Phrases |
| Snelle (`SNELLE`) | INSTANT (reaction) | CANCEL, REDIRECT, MP_SHIELD, REROLL | Shouts with "!" |
| Place (`PLACE`) | PLACE | Rules for everyone + friend bonus | Real spots |

Recommendation: retire `MOMENTUM-GAINING` and `STRENGTH-EQUIPMENT` / `DIGITAL-EQUIPMENT` as subtypes. Use `FOOD` and `GEAR` plus a `typeGate` field (`PHYSICAL` / `DIGITAL` / `CREATIVE` / none).

---

## 6. Wording fixes found (for the Phase 6 pass)

1. **Dice:** "+1 die" and "+1 ▣" are both in use → **▣ everywhere** (ruled 9 Nov).
2. **Duration:** 4+ phrasings → the 6 durations above, with ⏳1 / ⏳2 icons.
3. **Friend bonus:** 5 phrasings ("While Ronald, The Master Chef is also on your field", "If a Coert is on your field", "A Gandoe gets", "Named: …", "Chris, The BigStepper on your field:") → only two:
   - **"A <Friend> …"**: extra for that Mosje itself.
   - **"With a <Friend> on your field: …"**: a field check.

   Synergy Chamber's text must follow ("With a <Friend> on your field" texts work without that Mosje).
4. **Type gate:** "Only if a Digital Mosje is on your field" / "While an Artistic Mosje is on your field" (Schetsboek still says *Artistic*) / "Play only if a Coert…" → **"Needs: a Digital Mosje on your field."** "Needs:" is the same keyword as on the PQs.
5. **Energy symbol:** "ϟ" and "Energy" are mixed → pick one. Energy is safer for print and fonts.
6. **Typos and leftovers:** Skiffa "an Creative Mosje"; "Strength ★" still used where the label is now Str★.
7. **SCRY near-copies:** Mouse, Bladmuziek, Minimap, DJ Koptelefoon, Zie je die Dingetjes. Keep 2 at most; give DJ Koptelefoon a reroll payoff instead.
8. **Pets:** 5 cards on one template is good consistency. Give each pet **one unique line** so pulling a pet from a booster feels different.

---

## 7. Balance and variety notes

- **MP_GAIN (45) and DRAW (35) are saturated.** New cards should not add another "gains X MP" or "draw X" unless it has a new trigger.
- **Gaps worth filling** (1–2 cards each): TUTOR, ENERGY_GAIN, LEVEL_DOWN / level up, THORNS, DIE_MINUS, REDIRECT.
- **Biggest lever:** triggers, not verbs. A new trigger on an old verb (*Weggegooid: gains 15 MP*) is still a new card for the player and almost free to code.

## 8. Next steps

1. Gandalf picks which new trigger keywords and mechanics go in (§4).
2. Rule on the open style choices: ⏳ icons, two friend-bonus forms, "Needs:" for type gates, Energy vs ϟ.
3. Wording pass: rewrite every card to the canonical phrasing and tag it with template IDs (in a sheet).
4. Claude Code: one handler per template ID (FINAL handover).
