# Obby Card Game 2.0 — Effect Library

Drafted 11 Nov 2026 (Gandalf + Claude). Step 1 of Rework Plan **Phase 6 (wording pass + effect library)**. Goal: every card is built from the same small set of parts, so (1) shared effects use the exact same words, (2) cards group cleanly for code and naming, and (3) new cards add new *angles* instead of new numbers.

Source: all 170 active card texts in `src/data` (Piecies, Snelle, Places), the 26 Mosje abilities and the 11 Nov gear round. The 38 generic Quests are left out: they are number tables (win +X / fail −Y), not effects.

---

## Style decisions (Gandalf, 12 Nov) — FINAL: all text
Tested on the "Card Text Style Test" canvas (boards A–G). Decision: **all text, no glyphs, no name tags.** This keeps the Card Design Lock (29 Oct: no STAYS chip, no corner glyphs) intact.

| Topic | Decision | On the card |
|---|---|---|
| Duration | Fixed Yu-Gi-Oh style phrases | "this turn" · "until the end of your next turn" · "during your opponent's next turn" |
| Friend bonus | Words, two forms | "A Coert gains 35 instead." (that Mosje) · "With a Coert on your field: draw 1." (a check) |
| Type requirement | Needs: line | "**Needs:** a Digital Mosje." |
| Energy | The word | "pay 1 Energy" |
| Cost / condition | Yu-Gi-Oh punctuation | **colon** = condition ("Once per turn:"), **semicolon** = cost ("pay 1 Energy; draw 3"), "and if it does" = only if the first part worked |

The plain die icon (9 Nov) stays, but only in Quest / PQ roll lines; in effect text it's the word "die". Durations go only on effects that last (Power, shields, locks), never on "gains X MP".

## 0. Clean text rule (Gandalf, 11 Nov)
Keep effects **easy and clean**:
- One short sentence per effect; two at most.
- At most one condition (*Needs:* or a keyword), no star thresholds on top ("Str ★★★: 25").
- Friend bonus ("A Coert…") only on kit cards, where it's the point of the card.
- Several effects on one card are allowed, as long as the text stays short.

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
| 6 | **Duration** | How long? | *this turn* · *until the end of your next turn* · Attach |
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
| `OPP_TURN` | "during your opponent's next turn" | Only the opponent's turn (shields) | Afblijven!, Welloe Force |
| `UNTIL_NEXT_END` | "until the end of your next turn" | This turn + opponent's turn + your next turn (2 attacks) | Pets, Laat me chillen!, Synergy Field, Mosje Shield, Continuous Assault |
| `ATTACH` | **Attach:** | Under a Mosje until it leaves play or the card is destroyed (max 2 per Mosje) | De Belt, Call of the Welloes, all new gear |
| `PLACE` | *(Place card)* | Until another Place replaces it or it's destroyed | All Places |
| `ONCE` | "The next time …: …. Then discard this card." | Waits for one trigger, then gone | Laat me chillen!, MP Amplifier, Kleine Taks (2 ticks) |

Design note (12 Nov): durations are written out as fixed phrases, never icons. Each phrase means exactly one thing, the way Yu-Gi-Oh does it.

---

## 3. Verb templates

`Count` = how many current cards use it (one card can use several). **Bold** = the canonical phrasing every card should use.

### MP (Momentum)
| ID | Canonical phrasing | Count | Examples | Note |
|---|---|---|---|---|
| `MP_GAIN` | **One of your Mosjes gains X MP.** | **45** | Kannetje Melk, Ronald Kip, Hawaii Pizza, Med Kit | Most-used verb in the game: 1 in 4 cards. Enough. |
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
| **Entrance:** | When you summon this Mosje | Makes *when* you summon a choice | Alyssa, The Bulldozer: *Entrance: one opponent Mosje loses 10 MP.* | **Accepted 11 Nov** |
| **Discarded:** | When this card is discarded from your hand by any effect | Punishes Binti / Stookerino discard; makes Bagga of Greed a combo piece | *Restjes (food): Discarded: one of your Mosjes gains 15 MP.* | **Accepted 11 Nov** |
| **Level Down:** | When this Mosje drops a level (getemt) | Comeback for the player who's behind | *Michelle: Level Down: gains 20 MP.* | **Accepted 11 Nov** |
| **Combo:** | The 2nd Piecie you activate this turn | Sequencing skill: which card first? | *Dancepad: Combo: draw 1.* | **Accepted 11 Nov** |
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
| Food (`FOOD`) | INSTANT | MP_GAIN (+ friend bonus) | Dish names (Late Night Döner, Bento Box) |
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
2. **Duration:** 4+ phrasings → the fixed phrases above (decided 12 Nov).
3. **Friend bonus:** 5 phrasings ("While Ronald, The Master Chef is also on your field", "If a Coert is on your field", "A Gandoe gets", "Named: …", "Chris, The BigStepper on your field:") → only two:
   - **"A <Friend> …"**: extra for that Mosje itself.
   - **"With a <Friend> on your field: …"**: a field check.

   Synergy Chamber's text must follow ("With a <Friend> on your field" texts work without that Mosje).
4. **Type gate:** "Only if a Digital Mosje is on your field" / "While an Artistic Mosje is on your field" (Schetsboek still says *Artistic*) / "Play only if a Coert…" → **"Needs: a Digital Mosje on your field."** "Needs:" is the same keyword as on the PQs.
5. **Energy symbol:** "ϟ" and "Energy" are mixed → **the word Energy** (decided 12 Nov).
6. **Typos and leftovers:** Skiffa "an Creative Mosje"; "Strength ★" still used where the label is now Str★.
7. **SCRY near-copies:** Mouse, Bladmuziek, Minimap, DJ Koptelefoon, Zie je die Dingetjes. Keep 2 at most; give DJ Koptelefoon a reroll payoff instead.
8. **Pets:** 5 cards on one template is good consistency. Give each pet **one unique line** so pulling a pet from a booster feels different.

---

## 7. Balance and variety notes

- **MP_GAIN (45) and DRAW (35) are saturated.** New cards should not add another "gains X MP" or "draw X" unless it has a new trigger.
- **Gaps worth filling** (1–2 cards each): TUTOR, ENERGY_GAIN, LEVEL_DOWN / level up, THORNS, DIE_MINUS, REDIRECT.
- **Biggest lever:** triggers, not verbs. A new trigger on an old verb (*Discarded: gains 15 MP*) is still a new card for the player and almost free to code.

## 8. Accepted reworks (11 Nov)
Nine cards that only gained MP, rewritten with the clean text rule. Final names picked by Gandalf on 11 Nov. Data and code follow at the FINAL handover.

| Card | Was | New text | Template | Deck |
|---|---|---|---|---|
| **Late Night Döner** (was Broodje Döner) | gains 35 MP | One of your Mosjes gains 10 Power until the end of your next turn. | POWER_UP (UNTIL_NEXT_END) | Physical |
| **Snoeiertje** | +10 Power, loses 10 MP (copy of Te Hard Gaan) | One of your Mosjes gets +10 Power this turn. **Combo:** +20 instead. | POWER_UP + Combo | Physical |
| **Aansteker** (was Momentum Rush; draft name Terugslag!) | gains 15 MP | Play when one of your Mosjes is attacked: the attacker loses 15 MP. | THORNS | Physical |
| **Mouse** | +10 MP, look at 2 cards | **Needs:** a Digital Mosje. Take a gear Piecie from your deck into your hand. | TUTOR | Digital |
| **Hawaiishirt** | +10 MP each turn | **Attach:** your first Piecie each turn costs 1 Energy less. | COST_DOWN | Digital |
| **Ctrl+S** (was Momentum Boost; draft name Save State) | gains 15 MP | One of your Mosjes can't drop a level until the end of your next turn. | SAVE | Digital |
| **Oh nee toch niet** (was Emergency Healings; draft name Toch Niet!) | gains 25 MP | Play when your opponent starts a Quest: they roll 1 ▣ less. | DIE_MINUS | Creative |
| **Kladje** (was Shoettoe) | gains 30 MP | Draw 1. **Discarded:** draw 2. | DRAW + Discarded | Creative |
| **Spiegelen** (was Nature's Gift) | gains 30 MP | One of your Mosjes copies an opponent Mosje's Power this turn. | SET_POWER (new) | Creative |

Effect: pure MP-only cards drop from 18 to 9. MP_GAIN 45 → 36. New in the starter decks: THORNS, TUTOR, COST_DOWN, SAVE, DIE_MINUS, SET_POWER and the keywords Combo and Discarded.

**Playtest watch:** Spiegelen (a 15-Power Mosje borrowing 30), Ctrl+S (only useful if levels drop often), Mouse (finds 1 of 10 gear cards every time).

## 9. Wording rules from other TCGs (accepted 14 Nov)
Gandalf accepted all 12 suggestions from the scan of 151 card names and texts. They apply to every card in the wording pass.

**Names**
1. **Friend-group names.** The 26 generic names (Synergy Field, MP Amplifier, Perfect Dodge, …) get names from the group, like Kladje and Aansteker.
2. **Quests as memories.** The 38 generic Quests (Arm Wrestling, Strategy Puzzle, …) are renamed after things that happened.
3. **Flavour line.** One italic line with the inside joke under the rules text, only on cards with short text. The data already has a flavour field.

**Text grammar**
4. **"Target" is a defined word.** "Target 1 opponent Mosje" replaces "choose". Rulebook: only cards target; attacks don't. That defines what Blensen! and Zonnebril protect against.
5. **Numbered effects ① ②** on cards with two separate effects.
6. **Duration at the end** of the sentence, never "Stays until…" at the start.
7. **Fixed trigger phrases** for Snelle: "When an opponent's Mosje attacks:", "When your opponent starts a Quest:", "When your opponent activates a Piecie:".
8. **"You can"** for optional effects ("you may" is retired). Everything else is mandatory.
9. **"One of your Mosjes"** stays the standard target phrase (62 cards). Not Yu-Gi-Oh's "1 Mosje you control".

**Card structure**
10. **Subtypes:** FOOD · GEAR · PET · SUBSTANCE · ATTACK · TRICK. UTILITY, MOMENTUM-GAINING, STRENGTH-/DIGITAL-EQUIPMENT and COUNTER-CHAIN are retired (TRICK replaces UTILITY; COUNTER-CHAIN cards are Snelle).
11. **Quest text = footer only.** "+WIN / −LOSE" lives in the footer; the text area is for the memory or a condition.
12. **Deck limit out of the text.** ★★★★★ = foil = limit 1, stated in the rulebook only.

## 10. Shortened cards (accepted 14 Nov)
The 12 longest texts, rewritten. "Rule change" marks where shorter also changed what the card does.

| Card | Chars | New text | Rule change |
|---|---|---|---|
| **Bowie & Stormey** | 387 → 149 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Gandoe, Michelle or Tuk loses 20 less instead. | Pair bonus cut (open question) |
| **Gekke Vogels** | 300 → 132 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Jisca loses 20 less instead. | Combo with an Alyssa + KatjeGang cut |
| **Tony** | 253 → 132 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Coert loses 20 less instead. | Morning Luck on 3–6 cut |
| **ViannaPoes** | 199 → 132 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Cless loses 20 less instead. | none |
| **KatjeGang** | 190 → 134 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. An Alyssa loses 20 less instead. | "Synergy: Gekke Vogels" note cut |
| **Dingetje toch?!** | 267 → 105 | Discard this card: it counts as any 1 card or Piecie type a requirement asks for. It never adds Quest dice. | No longer counts as a trait requirement; "ready" detail to the rulebook |
| **Call of the Welloes** | 252 → 123 | Summon a Mosje from your Welloe pile at Level 1 and attach this card to it. When either leaves the field, the other does too. | none |
| **Delluft** | 233 → 127 | The first time each player pays Energy on their turn, they pay 1 more. A player with a Coert or Binti on their field pays no fee. | Cless +2 and Parkeren Delft +20 cut |
| **Blensen!** | 198 → 136 | Costs 0 Energy if a Jensen! or Frenssen! was played this turn. Until the end of this turn, your opponent's cards can't target your Mosjes. | none (rule 4 covers attacks) |
| **Chef's Special** | 194 → 155 | One of your Mosjes gains 15 MP. With Ronald, The Master Chef on your field: look at your opponent's hand; it gains 15 MP per Piecie there instead (max 45). | none |
| **Jammertje Gepakt!** | 191 → 117 | Needs: a Mosje with Tech ★★. When your opponent activates a Piecie: cancel it and put it on the bottom of their deck. | Mental ★★★ draw cut; Mental → Tech (14 Nov) |
| **Obby #1** | 191 → 167 | Quest wins give 10 MP more; Quest losses cost 10 MP more. With a Martin, West, Ronald or Gandoe on your field: one of your Mosjes gains 10 MP at the start of your turn. | none |

All five pets now share one template; only the friend's name changes.

### Rulings from the final questions (14 Nov)
- **DJ 80/20 counts as a Gandoe.** One rulebook line; no card names him separately.
- **Jammertje Gepakt! and Counter Strikka:** the requirement changes from Mental ★★ to **Tech ★★**, so both work in the Digital starter deck.
- **New names** (38 Quests, 26 generic cards): a separate round after the wording pass.
- **Bowie & Stormey pair bonus:** still open.

## 11. Next steps

1. ~~Pick trigger keywords~~ Done 11 Nov: **Entrance, Discarded, Level Down, Combo**.
2. ~~Rule on the style choices~~ Done 12 Nov: all text (see top).
3. Wording pass: rewrite every card to the canonical phrasing and tag it with template IDs (in a sheet).
4. Claude Code: one handler per template ID (FINAL handover).
