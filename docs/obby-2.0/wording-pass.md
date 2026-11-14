# Obby Card Game 2.0 — Wording Pass

Started 14 Nov 2026 (Gandalf + Claude). Rework Plan **Phase 6**. This doc is the single place a card's final text lives. Rules for the wording: `effect-library.md` (style decisions, §0 clean text rule, §9 the 12 wording rules).

Status per card: **Approved** (Gandalf said yes) · **By rule** (booster cards reworded with the ruled rules, not approved one by one) · **To do**. 86 starter cards approved; 129 booster cards reworded by rule or decided (215 texts in total); every cost set and confirmed. **The three starter decks are complete** (Piecies, Snelle, Places, Personal Quests, Mosje abilities).

Conventions used so far:
- "One of your Mosjes" for your own Mosjes; "Target" only for opponent Mosjes.
- The word "die" in effect text (style decision 12 Nov). Still to rule: §6.1 of the Effect Library says "▣ everywhere".
- "A <Friend> …" = extra for that Mosje. "With a <Friend> on your field: …" = a field check.

---

## Approved

### Batch 1 — Physical starter deck (14 Nov)
Wording only; no rule changed.

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Kannetje Melk | food · ★ · 0 | One of your Mosjes gains 25 MP. | MP_GAIN · INSTANT |
| Late Night Döner | food · ★★ · 1 | One of your Mosjes gets +10 Power until the end of your next turn. | POWER_UP · UNTIL_NEXT_END |
| Dancepad (NEW) | gear · 0 | One of your Mosjes gains 10 MP. A Chris also gets +1 die on one Quest this turn. | MP_GAIN · DIE_PLUS · friend bonus |
| Rugbybal (NEW) | gear · 2 | **Attach:** +10 Power. An Alyssa also gains 10 MP each time she attacks. | POWER_UP · ATTACH · MP_GAIN · friend bonus |
| Koksmes (NEW) | gear · 2 | **Attach:** +10 Power. A Ronald gets +20 instead. | POWER_UP · ATTACH · friend bonus |
| Snoeiertje | attack · ★ · 0 | One of your Mosjes gets +10 Power this turn. **Combo:** +20 instead. | POWER_UP · THIS_TURN · COMBO |
| Super Saiyan Mos | attack · ★★★ · 3 | One of your Mosjes gets +30 Power this turn. | POWER_UP · THIS_TURN |

Note on Rugbybal: "when it attacks" was cut. Power only counts in an attack, so nothing changes at the table.

### Cards without text in the repo (14 Nov)
Source text was in the project docs (Card Cleanup List, Personal Quest List).

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| In De Groove | trick · 1 · kit: Chris | This turn, each time you activate another Piecie: draw 1 (max 2). A Chris also gains 10 MP each time. | DRAW · THIS_TURN · on activate Piecie · friend bonus |

---

### Rule changes approved (14 Nov)
Gandalf picked option A on all eight. Each of these changes what the card does.

| Card | Kind · ★ · cost | Final text | Template | Rule change |
|---|---|---|---|---|
| Ronald Kip | food · ★★★ · 2 | One of your Mosjes gains 40 MP. With a Ronald on your field: draw 1. | MP_GAIN · DRAW · friend check | "60 instead" cut; works with both Ronalds; 50 → 40 in the balance round |
| Protein Shake | food · ★★ · 0 | **Needs:** a Physical Mosje. One of your Mosjes gains 30 MP. | MP_GAIN · needs PHYSICAL | Strength ★★★ / Boxing Ring step cut; gate is the type; 25 → 30 |
| Dumbbells | gear · ★ · 0 | **Attach:** +1 die on Quests that roll Str. | DIE_PLUS · ATTACH | Now an Attach card (balance round): no MP, no draw |
| Te Hard Gaan | attack · ★★ · 2 | One of your Mosjes loses 10 MP; it gets +20 Power this turn. | MP_COST · POWER_UP · THIS_TURN | The 10 MP is paid when played, not at the end of the turn |
| Ronald's Fles Fireman (NEW) | substance · ★★★ · 1 | One of your Mosjes loses 20 MP; it gets +20 Power this turn. A Ronald loses nothing. | MP_COST · POWER_UP · THIS_TURN · friend bonus | The 20 MP is paid when played |
| Gekke Dobbel | trick · 0 · kit: Jeffrey | +1 die on one Quest this turn. A Jeffrey gets +2 dice instead. | DIE_PLUS · THIS_TURN · friend bonus | Reroll cut; a Jeffrey rolls 2 extra dice. **Playtest watch.** |
| Schetsboek | gear · ★ · 0 | **Needs:** a Creative Mosje. Look at the top 2 cards of your deck. Take 1 and put the other on the bottom. | SCRY · DRAW · needs CREATIVE | The plain "draw 1" without a Creative Mosje is cut |
| Hawaii Pizza | food · ★★ · 1 · kit: Coert | One of your Mosjes gains 30 MP. With a Coert on your field: draw 1. | MP_GAIN · DRAW · friend check | 25 → 30 for everyone; "a Coert gains 35" cut |

---

### Batch 2 — Physical rest + Digital gear (14 Nov)
Wording only, except Afblijven!.

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Kleine Taks | attack · ★★ · 1 | Target 1 opponent Mosje. It loses 10 MP at the end of this turn and at the end of your next turn. | DOT · 2 ticks · target |
| Bowie & Stormey | pet · ★★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Gandoe, Michelle or Tuk loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |
| Afblijven! | trick · ★★ · 1 | One of your Mosjes loses 20 less MP each time it loses MP, during your opponent's next turn. | MP_SHIELD · OPP_TURN |
| Chris's Handdoek (NEW) | Snelle · 0 · kit: Chris | When one of your Mosjes rolls for a Quest: reroll 1 die. A Chris also gains 10 MP. | REROLL · friend bonus |
| Aansteker | Snelle · ★ · 0 | When an opponent's Mosje attacks: the attacker loses 15 MP. | THORNS · on opponent attack |
| Jensen! | Snelle · ★★ · 1 | When an opponent's Piecie or Snelle targets one of your Mosjes: cancel it. | CANCEL · on opponent card |
| Keyboard | gear · ★ · 0 | **Needs:** a Digital Mosje. One of your Mosjes gains 10 MP. Draw 1. | MP_GAIN · DRAW · needs DIGITAL |
| Mouse | gear · ★ · 1 | **Needs:** a Digital Mosje. Search your deck for a gear Piecie and put it in your hand. | TUTOR · needs DIGITAL |
| Controller | gear · ★ · 0 | **Needs:** a Digital Mosje. One of your Mosjes gains 10 MP and gets +1 die on one Quest this turn. | MP_GAIN · DIE_PLUS · needs DIGITAL |
| Headset (NEW) | gear · 0 · kit: FPS duo | **Needs:** a Digital Mosje. Look at the top 2 cards of your opponent's deck. With an FPS Mosje on your field: it gets +10 Power this turn. | PEEK_DECK · POWER_UP · friend check |
| MagicPrompt (NEW) | gear · 1 · kit: Gandoe | Search your deck for a gear Piecie and put it in your hand. With a Gandoe on your field: it gains 10 MP. | TUTOR · MP_GAIN · friend check |
| Hawaiishirt | gear · ★ · 2 · kit: Coert | **Attach:** your first Piecie each turn costs 1 Energy less. | COST_DOWN · ATTACH |

Rule change: Afblijven! goes from 10 less to 20 less and now covers only the opponent's next turn (at 10 it was a pet that ended sooner, for the same cost). Kleine Taks: "Stays" and the discard line move to the rulebook. Jensen!: with Target as a defined word it only stops cards that say Target.

---

### Batch 3 — Digital rest + Creative start (14 Nov)

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Blikje Monsteros (NEW) | substance · 0 · kit: Youri | One of your Mosjes loses 15 MP; gain 2 Energy this turn. A Youri also draws 1. | MP_COST · ENERGY_GAIN · THIS_TURN · friend bonus |
| Zie je die Dingetjes | trick · ★★ · 0 | Look at the top 3 cards of your deck. Take 1 and put the rest back in any order. | SCRY · DRAW |
| Rebouleh | trick · ★★ · 2 | One of your Mosjes can use its once-per-turn ability one more time this turn. | EXTRA_USE · THIS_TURN |
| Ctrl+S | trick · ★★ · 0 | One of your Mosjes can't drop a level until the end of your next turn. | SAVE · UNTIL_NEXT_END |
| Sleutelpuntje | Snelle · ★ · 1 | When one of your Mosjes starts a Quest: +1 die on that Quest. | DIE_PLUS · on Quest start |
| Je Weet Niet | Snelle · ★★ · 1 | When your opponent rolls for a Quest: they reroll all those dice. | REROLL_OPP · on opponent roll |
| Ff Haaltje Nemen | Snelle · ★★ · 2 | Draw 1. | DRAW |
| Dikke Plaat | trick · ★ · 0 · kit: DJ 80/20, Alyssa | +1 die on one Quest this turn. With DJ 80/20 or Alyssa, Fissa Fissa! on your field: you can also reroll 1 die of that Quest. | DIE_PLUS · REROLL · friend check |
| Varkenspootjes | food · ★★★ · 1 · kit: Binti | Target 1 Mosje. A Binti gains 40 MP. Any other Mosje loses 15 MP. | MP_GAIN · MP_LOSS · target |

Rule change: **Ff Haaltje Nemen** goes from Draw 2 to Draw 1 (Gandalf's edit). Its cost of 2 Energy needs a look: see open ruling 9.
Rulebook lines owed: Rebouleh (the second use pays its cost again) · Ctrl+S (what happens at 0 MP while protected) · Varkenspootjes uses Target on either side, so Jensen! can cancel it.

---

### Batch 4 — Creative rest (14 Nov)

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Kladje | trick · ★ · 0 | Draw 1. **Discarded:** draw 2. | DRAW · DISCARDED |
| Bagga of Greed | trick · ★ · 0 | Draw 2, then discard 1. | LOOT |
| Zwoele Ming Power (NEW) | trick · ★★ · 2 · kit: Ming | Your next Quest this turn (not a Personal Quest) needs 1 success less. A Ming also gains 10 MP. | QUEST_EASE (new) · THIS_TURN · friend bonus |
| TemPiecie | trick · ★★★ · 2 | Take 1 card from your discard pile into your hand. You can't place or play it this turn. | RECYCLE |
| Spiegelen | trick · ★★ · 1 | Target 1 opponent Mosje. One of your Mosjes copies its Power this turn. | SET_POWER · THIS_TURN · target |
| Lucky Cóin | Snelle · ★ · 1 | **Needs:** a Creative Mosje. When a player rolls for a Quest: reroll any of those dice. | REROLL · on any Quest roll · needs CREATIVE |
| Oh nee toch niet | Snelle · ★★ · 1 | When your opponent starts a Quest: they roll 1 die less. | DIE_MINUS · on opponent Quest |

Rule change: **Lucky Cóin** loses "Artistic ★★★: choose the result"; the gate is the Creative type. Spiegelen says Target, so Jensen! can cancel it.
Rulebook line owed: Zwoele Ming Power (a Quest always needs at least 1 success). **Playtest watch:** Zwoele Ming Power (two 4+ on 3 dice is 50 %; one 4+ is 87.5 %).

---

### Batch 5 — Stookerino + starter Places (14 Nov)

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Stookerino | trick · ★★ · 1 · kit: Binti | Your opponent discards 1 card of their choice. With a Binti on your field: look at their hand first. | DISCARD_OPP (their choice) · PEEK_HAND · friend check |
| Gym | Place · ★★★ · 3 | Physical Mosjes get +10 Power. Quests that roll Str get +1 die. | POWER_UP · DIE_PLUS · PLACE |
| Ronnie's Kitchen (NEW) | Place · 2 · both Ronalds | Food Piecies give 10 MP more. With a Ronald on your field: draw 1 the first time you activate a food Piecie each turn. | MP_GAIN boost · DRAW · PLACE · friend check |
| Coert's Caravan | Place · ★★★★ · 3 | Once per turn, a player with a Coert on their field can activate 1 Piecie for 2 Energy less. | COST_DOWN · PLACE · friend check |
| Woonkamer (Discord) (NEW) | Place · 2 · FPS duo | A player with 2 Digital Mosjes on their field gets +1 die on Quests that roll Tech. | DIE_PLUS · PLACE |
| Youri's Woonkamer (NEW) | Place · 2 · Youri | Once per turn, when a player with a Youri activates a Piecie on the turn they placed it: that player draws 1. | DRAW · PLACE · on activate Piecie · friend check |
| Nieuwe Gimma (NEW) | Place · 2 · Ming | The first time each turn a Mosje rolls for a Quest: +1 die. | DIE_PLUS · PLACE |
| Punto Banco | Place · ★★★ · 3 · Jeffrey | Once per turn, before a Quest roll, a player can pay 1 Energy; they call Punto or Banco and roll 2 dice. If their call is higher: +2 dice on that Quest. On a tie: they take the Energy back. | GAMBLE · DIE_PLUS · PLACE |

Rule changes: **Stookerino** (Gandalf's edit): the opponent picks the discard, the MP gain is gone, and only a Binti player sees the hand. **Gym**: the 10 MP drain on non-Physical Mosjes is cut. **Youri's Woonkamer** (Gandalf's edit): only a player with a Youri draws. **Punto Banco**: a win pays +2 dice (was +1), so the gamble beats a sure +1 die from Sleutelpuntje. **Playtest watch:** Punto Banco stacked with Dikke Plaat and Gekke Dobbel.

---

### Batch 6 — starter Personal Quests (14 Nov)
One keyword per line on the card: Needs, Pay, Roll. The die icon is allowed in Roll lines.

| Personal Quest | ★ · Mosje | Final text |
|---|---|---|
| Charge! | ★★ · Alyssa, The Bulldozer | **Needs:** this Mosje has 31+ MP. **Pay:** this Mosje loses 30 MP. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. |
| Sterke Jongen | ★★★ · Jeffrey, The Strongman | **Needs:** Gym in play. **Pay:** discard 1 ready gear Piecie. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. |
| Knocked Down, Not Out (NEW) | ★★★ · Michelle, Iron Tuk | **Needs:** this Mosje lost MP since the start of your last turn and has 50+ MP. **Pay:** discard 1 ready food Piecie. **Roll:** 1 ▣ per Str★. Need 1× ⚄+. |
| Michelinster | ★★★ · Ronald, The Master Chef | **Needs:** Ronald Kip ready and 2 Mosjes on your field. **Pay:** discard 1 food Piecie from your hand. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. |
| Aloha Tech Support | ★★★ · Coert, Tech Savant | **Needs:** 1 ready gear Piecie and 5+ other cards in your hand. **Pay:** 2 Energy. **Roll:** 1 ▣ per Tech★. Need 2× ⚃+. |
| Vibe Coded (NEW) | ★★ · Gandoe, The Cloude Wizard | **Needs:** 1 ready gear Piecie. **Roll:** 1 ▣ per Tech★. Need any 2 the same. |
| World Record Run | ★ · Youri, The Speedrunner | **Pay:** discard 2 gear Piecies from your hand. **Roll:** 1 ▣ per Tech★. Need 2× ⚃+. |
| Headshot | ★★ · FPS Coert | **Needs:** 1 ready gear Piecie. **Roll:** 1 ▣ per Tech★. Need 1× ⚅. |
| Beginner's Luck | ★ · Ming, The Natural | **Pay:** 1 Energy. **Roll:** 1 ▣ per Art★. Need 1× ⚅. |
| High Roller | ★★ · Jeffrey, The Silent Gambler | **Pay:** any amount of Energy. **Roll:** 1 ▣ per Art★, +1 ▣ per 2 Energy paid. Need 2× ⚄+. |
| Lucky Crescendo | ★★ · DJ 80/20 | **Needs:** Skiffa in play. **Roll:** 1 ▣ per Art★. Need 2× ⚄+. |
| Binti Brandt | ★★ · Binti, The Sharp Tongue | **Needs:** your opponent has 2 or fewer cards in hand. **Pay:** discard 1 Piecie from your hand. **Roll:** 1 ▣ per Art★. Need 2× ⚃+. |

Rule change: **Vibe Coded** needs any 2 dice the same (the old Hocus Pocus roll, 44 % on 3 dice) instead of two 4+, so it differs from Headshot. Charge!: the "not if it takes her to 0" bracket became a Needs line. Knocked Down, Not Out: the list of what counts as losing MP moves to the rulebook.
Ruled 14 Nov: gear attached to a Mosje counts as a "ready gear Piecie". **Playtest watch:** Aloha Tech Support (5+ other cards in hand); High Roller with Punto Banco's +2 dice.

---

### Batch 7 — starter Mosje abilities (14 Nov)
Source: `mosje-personas.md` (the repo data still has the old abilities).

| Mosje | Final ability text | Template |
|---|---|---|
| Chris, The BigStepper | When you activate a Piecie: roll 1 die. On a 5 or 6, you can activate another ready Piecie for 0 Energy (max 2 per turn). | EXTRA_USE · GAMBLE · on activate Piecie |
| Alyssa, The Bulldozer | When this Mosje loses 20 or more MP from attacks in one turn: it gains 25 MP and gets +10 Power until the end of your next turn. | MP_GAIN · POWER_UP · UNTIL_NEXT_END · when attacked |
| Jeffrey, The Strongman | This Mosje can hold 3 attachments. | ATTACH limit |
| Michelle, Iron Tuk | This Mosje loses 10 less MP from each attack. From Level 2: 15 less. | MP_SHIELD · level upgrade |
| Ronald, The Master Chef | The first food Piecie you activate each turn gives 10 MP more. | MP_GAIN boost · once per turn |
| Coert, The Hawaiian Tech Savant | Up to twice per turn, at the start of your turn: pay 1 Energy; draw 1. | DRAW · pay Energy · START_OF_TURN |
| Gandoe, The Cloude Wizard | Once per turn: pay 1 Energy; look at the top 3 cards of your deck, take 1 and put the rest on the bottom. | SCRY · DRAW · pay Energy |
| Youri, The Speedrunner | Once per turn: pay 1 Energy; activate a Piecie on the turn you placed it. From Level 2: then draw 1. | EXTRA_USE · DRAW · pay Energy · level upgrade |
| FPS Coert | When this Mosje wins a Quest that rolls Str or Tech: roll 1 die. On a 5 or 6, it gains 30 MP and 1 target opponent Mosje loses 15 MP. | GAMBLE · MP_GAIN · MP_LOSS · ON_QUEST_WIN · target |
| FPS West | Once per turn: pay 1 Energy; look at your opponent's hand. Then you can have this Mosje lose 20 MP; put 1 card from that hand on the bottom of their deck. They draw 1. | PEEK_HAND · HAND_SWAP (new) · pay Energy · MP_COST |
| Ming, The Natural | Once per turn: pay 1 Energy; reveal the top card of your deck and draw it. If it's a Piecie, you can activate it for 0 Energy instead. | DRAW · EXTRA_USE · pay Energy |
| Jeffrey, The Silent Gambler | Once per turn: stake 1 or 2 Energy and roll 1 die. 1–2: lose it. 3–4: take it back. 5–6: take it back, draw 1, and this Mosje gains 10 MP per Energy staked. | GAMBLE · DRAW · MP_GAIN · stake Energy |
| DJ 80/20, The Lucky Mixer | Once per turn: reroll any 1 die. From Level 2: reroll up to 2 dice instead. | REROLL · level upgrade |
| Binti, The Sharp Tongue | Once per turn: pay 1 Energy and discard 1 Piecie; 1 target opponent Mosje loses 10 MP and your opponent discards 1 card of their choice. From Level 2: 20 MP instead, but not on two turns in a row. | MP_LOSS · DISCARD_OPP · pay Energy + discard · target · level upgrade |
| Ronald, Dr. Phill-osoof (draft ability) | Once per turn: pay 1 Energy; target 1 opponent Mosje. It rolls 1 die less on its next Quest. | DIE_MINUS · pay Energy · target |

Rule changes (Gandalf's edits): **FPS West** loses the naming bet; he looks at the hand and can pay 30 MP to discard a card of his choice from it. **DJ 80/20** at Level 3 rerolls up to 2 dice in one use (was: two uses per turn).
Rulebook lines owed: "Target" applies to Mosje abilities too, so Zonnebril and Blensen! protect against them · Youri still pays the Piecie's own cost · FPS West needs 21+ MP to pay for his swap (ruled 14 Nov).

---

### Pending cards resolved (14 Nov)

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Boosterpackkie | trick · ★★ · 0 · kit: Coert | Draw 1. With a Coert on your field: roll 1 die. On a 5 or 6, draw 1 more. | DRAW · GAMBLE · friend check |
| Those Eyelashes Tho... | trick · ★★★ · 2 · kit: Martin / West | **Needs:** a Martin or a West. Your opponent discards 1 card of their choice and can't play Snelle this turn. | DISCARD_OPP · LOCK · THIS_TURN · needs friend |
| Dubbele Dosis | trick · ★★ · 1 | +2 dice on one Quest this turn. | DIE_PLUS · THIS_TURN |
| Jantje Jantje... | trick (was attack) · ★★★ · 1 | Name a card, then look at your opponent's hand. If it's there: they discard it. If not: one of your Mosjes loses 10 MP. | PEEK_HAND · DISCARD_OPP · MP_COST |
| Larry / Zegeltje | substance · ★★ · 0 | Roll 1 die for one of your Mosjes. 1–2: it loses 25 MP. 3–4: it gains 20 MP. 5–6: it gains 40 MP and you draw 2. | GAMBLE |
| De Box | Place · ★★ · 2 · Michelle | A Gandoe, Michelle or Tuk gets +10 Power and +1 die on Quests that roll Str. | POWER_UP · DIE_PLUS · PLACE · friend check |
| Skiffa | Place · ★★★ · 3 · DJ 80/20 | When a Creative Mosje rolls for a Quest: it can reroll 1 die. Digital Mosjes get −10 Power. | REROLL · POWER_DOWN · PLACE |

Rule changes: Boosterpackkie (the 10 MP for a Coert is cut) · Those Eyelashes Tho... (the 20 MP is cut) · Dubbele Dosis (+2 dice, no reroll) · Jantje Jantje... (the +20 Power is cut; subtype becomes trick) · Larry / Zegeltje (the discard on 1–2 is cut) · **Nieuwe Gimma** now gives +1 die instead of a reroll, so it no longer copies Skiffa. De Box and Skiffa: wording only.

---

### Balance round (14 Nov)
After the review of the starter decks. All changes are already applied in the tables above.

| Card | Change | Why |
|---|---|---|
| Stookerino | 1 Energy, ★★ | The opponent picks the discard |
| Coert's Caravan | 2 Energy less instead of 0 Energy | No free Piecie every turn |
| FPS Coert | Triggers on a 5 or 6 | On a 6 only it almost never fired |
| Michelle, Youri, DJ 80/20, Binti | Upgrade from Level 2, not Level 3 | At Level 3 the game is nearly over |
| Zwoele Ming Power | Cost 2 | 50 % → 87.5 % on a Quest was too cheap at 1 |
| FPS West | Loses 20 MP to put a card from the hand on the bottom of the deck; the opponent draws 1 | Takes the best card without shrinking the hand |
| Youri, The Speedrunner | Always 1 Energy; the draw is the Level 2 upgrade | An ability that becomes free is hard to balance |
| Binti, The Sharp Tongue | The 20 MP hit not on two turns in a row | Cooldown (Gandalf's idea) |
| Ronald Kip | 50 → 40 MP | Stacked with the Master Chef and Ronnie's Kitchen |
| Ronald, The Master Chef | First food Piecie each turn only | Best case with Ronnie's Kitchen: 60 MP and a card (was 70) |
| Dumbbells | Attach: +1 die on Quests that roll Str | Gives Jeffrey gear for his third slot; no longer a free card that draws |

Rulebook lines from this round: a Personal Quest can't be discarded by an opponent's effect · a Quest roll never uses more than 6 dice · Binti's cooldown has to be tracked (a marker on the card).

---

## Booster cards — Piecies, Snelle and Places (14 Nov)

Gandalf asked to finish the boosters in one go. These texts were written by applying the rules already ruled in the starter pass (pet template, Needs: lines, fixed durations, cost first with a semicolon, Target, one friend bonus, "you can"). **They were not approved card by card.** Rule changes are listed under each table; the real choices are in "Booster decisions".

Costs: 41 booster cards had no cost. Claude proposed them on the approved scale and **Gandalf confirmed all 41 on 14 Nov**.

### Booster Piecies from the data

| Card | Kind · ★ · cost | Text | Template |
|---|---|---|---|
| Chef's Special | food · ★★★ · 1 · kit: Ronald | One of your Mosjes gains 15 MP. With Ronald, The Master Chef on your field: look at your opponent's hand; it gains 15 MP per Piecie there instead (max 45). | MP_GAIN · PEEK_HAND · friend check |
| Warm Kannetje Melk | food · ★ · 0 | One of your Mosjes loses 10 MP; draw 2. | MP_COST · DRAW |
| Harken maar (was Momentum Diefje) | attack · ★★★ · 2 | One of your Mosjes gets +10 Power this turn. If its attack makes a Mosje lose MP this turn, it gains 20 MP. | POWER_UP · MP_GAIN · THIS_TURN |
| Dikke Taks | attack · ★★★★ · 3 | **Needs:** a Mosje at Level 2 or higher. One of your Mosjes gets +10 Power this turn, and its attack hits both opponent Mosjes. | POWER_UP · THIS_TURN · multi-attack |
| Affoe | substance · ★ · 1 | Target 1 opponent Mosje. It loses 15 MP and one of your Mosjes gains 10 MP. | MP_DRAIN · target |
| Pot of Weed | substance · ★★ · 1 | Draw 2. | DRAW |
| Slecht Gezet | trick · ★★ · 1 | Destroy the Place. If it's yours, take it back into your hand instead. | PLACE_DESTROY |
| Bong Hit Demolition | substance · ★★★ · 2 | Destroy the Place. Draw 2. | PLACE_DESTROY · DRAW |
| TweedeKANs | trick · ★ · 0 | Reroll any 1 die this turn. | REROLL · THIS_TURN |
| Dubbele Ding | trick · ★★★ · 2 | Activate up to 2 Piecies from your hand as if they were ready. | EXTRA_USE |
| Mosje Reborn | trick · ★★★★★ · 2 · chase | Summon a Mosje from any player's Welloe pile onto your field at Level 1 with 50 MP. | REVIVE · STEAL |
| Laat me chillen! | trick · ★ · 1 | The next time one of your Mosjes would lose MP, it loses 20 less, until the end of your next turn. | MP_SHIELD · ONCE · UNTIL_NEXT_END |
| Leipe Swap | trick · ★★★★★ · 4 | Swap the MP of one of your Mosjes and 1 target opponent Mosje. Nobody levels up or drops a level from the swap. | MP_SWAP · target |
| Dingetje toch?! | trick · ★★★★★ · 0 | Discard this card; it counts as any 1 card or Piecie type a requirement asks for. It never adds Quest dice. | WILDCARD |
| Shhh, popo komt! | trick · ★★ · 0 | **Needs:** 3 or more Mosjes on the field. Destroy the Place. | PLACE_DESTROY |
| Huisbaas | trick · ★★★ · 1 | **Needs:** a substance Piecie on top of a discard pile. Destroy the Place. Then you can search your deck for a Place and activate it. | PLACE_DESTROY · TUTOR |
| Track Highscore (was F1 Telemetry Data) | trick · ★★ · 1 · kit: Martin | One of your Mosjes gains 15 MP. Draw 1. With Martin, The Precision Driver on your field: draw 2 instead. | MP_GAIN · DRAW · friend check |
| Call of the Welloes | trick · ★★★ · 1 | Summon a Mosje from your Welloe pile at Level 1 and attach this card to it. When either leaves the field, the other does too. | REVIVE · ATTACH |
| Welloe Force | trick · ★★★★ · 2 | Discard 1 card; during your opponent's next turn, each time an opponent Mosje attacks one of yours, the attacker loses 15 MP. | THORNS · OPP_TURN · discard as cost |
| Kan het?! | substance · ★★ · 0 | Roll 1 die for one of your Mosjes. 1–4: it loses 10 MP. 5–6: it gains 40 MP. | GAMBLE |
| Grammetje Pieter | substance · ★ · 0 | Roll 1 die for one of your Mosjes. 1–3: it loses 15 MP. 4–6: it gains 30 MP. | GAMBLE |
| Dikke Jonko | substance · ★★ · 0 | One of your Mosjes gains 25 MP and one opponent Mosje gains 10 MP. Each player draws 1. | MP_GAIN · DRAW · both players |
| Stripje Bennies | substance · ★★ · 0 | One of your Mosjes loses 20 MP; draw 3. | MP_COST · DRAW |
| Tikker | substance · ★★ · 0 | One of your Mosjes gains 40 MP. It can't attempt a Quest during your next turn. | MP_GAIN · LOCK |
| Straffoe | substance · ★ · 0 | One of your Mosjes loses 5 MP; each opponent Mosje loses 10 MP. | MP_COST · MP_LOSS |
| Touwtjespringen (was Skipping Rope) | gear · ★ · 0 | **Needs:** a Physical Mosje. Draw 1. One of your Mosjes gets +1 die on one Quest this turn. | DRAW · DIE_PLUS · needs PHYSICAL |
| Harde Didde | attack · ★★★★★ · 4 | **Needs:** a Mosje at Level 2 or higher. Send 1 target opponent Mosje with 40 MP or less to the Welloe pile. | KO · target |
| Klaar Met Jou | attack · ★★★★★ · 4 | **Needs:** a Mosje at Level 2 or higher. Send 1 target opponent Mosje with 30 MP or less to the Welloe pile. Draw 1. | KO · DRAW · target |
| Tony | pet · ★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Coert or Binti loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |
| Gekke Vogels | pet · ★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Jisca loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |
| KatjeGang | pet · ★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. An Alyssa loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |
| ViannaPoes | pet · ★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Cless loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |
| Ming's Hond (placeholder name) | pet · ★★ · 1 | One of your Mosjes loses 10 less MP each time it loses MP, until the end of your next turn. A Ming loses 20 less instead. | MP_SHIELD · UNTIL_NEXT_END · friend bonus |

Rule changes by precedent: **Dikke Taks** loses "Draw 1" (third effect) · **Track Highscore** loses "he gains 30 instead" (one friend bonus, the draw stays, as with Ronald Kip) · **Laat me chillen!**, **Welloe Force**: fixed duration phrases · **Touwtjespringen**: the Strength ★ gate becomes "Needs: a Physical Mosje" · pets and Chef's Special, Dingetje toch?!, Call of the Welloes: texts from Effect Library §10. Rulebook lines moved off the card: Dubbele Ding (pay their costs, free slots needed), Mosje Reborn and Call of the Welloes (the Mosje is fresh), Huisbaas (pay the Place's cost), Tikker (leave it face-up as a reminder).

### Booster Snelle from the data

| Card | ★ · cost | Text | Template |
|---|---|---|---|
| Counter Strikka | ★★★ · 2 | **Needs:** a Mosje with Tech ★★. When an opponent's Piecie or Snelle targets a Mosje: choose a new target for it. | REDIRECT |
| Jammertje Gepakt! | ★★★ · 2 | **Needs:** a Mosje with Tech ★★. When your opponent activates a Piecie: cancel it and put it on the bottom of their deck. | CANCEL |
| Nog Niet Klaar (was Not Today!) | ★★★★ · 2 | When one of your Mosjes would be sent to the Welloe pile: it stays on the field with at least 5 MP. | SAVE |
| The Protector | ★★★★★ · 1 · chase | **Attach:** your opponent's cards and abilities can't target this Mosje, and it loses 10 less MP from each attack. At the start of your turn: pay 1 Energy or discard this card. | UNTARGETABLE · MP_SHIELD · ATTACH · UPKEEP (new) |
| Bijna Welloe | ★★ · 0 | **Needs:** one of your Mosjes has 10 MP or less. It gains 20 MP. | MP_GAIN |
| Jantje Jantje... Jantje? | ★★★ · 0 | **Needs:** Bank Chilling in play. 1 target opponent Mosje loses 15 MP and one of your Mosjes gains 15 MP. | MP_DRAIN · target |
| Dubbele Temminks | ★★★ · 2 | When you activate a Piecie: its effect happens a second time. Not on a ★★★★★ card. | COPY |
| Gevalletje Klakkeloos | ★★★ · 2 | When your opponent activates a Piecie: you get the same effect too. Not on a ★★★★★ card. | COPY |
| Frenssen! | ★★★ · 2 | When a Jensen! is played: cancel it. One Mosje of the player who played it loses 10 MP. | CANCEL · MP_LOSS |
| Blensen! | ★★★★★ · 4 | Costs 0 Energy if a Jensen! or Frenssen! was played this turn. Until the end of this turn, your opponent's cards and abilities can't target your Mosjes. | UNTARGETABLE · THIS_TURN |
| Chillingsvoorbij! | ★★ · 1 | Take the last Place you lost from your discard pile into your hand. | RECYCLE |

Rule change by precedent: **Counter Strikka** loses "Mental ★★★: also draw 1" (as Jammertje Gepakt! did) and needs Tech ★★ (ruled 14 Nov).

### Booster Places

| Place | ★ · cost | Text | Template |
|---|---|---|---|
| Obby #1 | ★★★ · 2 | Quest wins give 10 MP more and Quest losses cost 10 MP more. With a Martin, West, Ronald or Gandoe on your field: one of your Mosjes gains 10 MP at the start of your turn. | Quest swing · MP_GAIN · START_OF_TURN · friend check |
| Obby #2 (NEW) | ★★★ · 2 | Quest wins give 10 MP more and Quest losses cost 10 MP more. With a Chris or Gandoe on your field: one of your Mosjes gains 15 MP at the start of your turn. | Quest swing · MP_GAIN · START_OF_TURN · friend check |
| Bank Chilling | ★★ · 2 | At the start of each player's turn, their Mosjes with Soc ★★ gain 10 MP. All Mosjes get −10 Power. | MP_GAIN · POWER_DOWN |
| Arcade | ★★★ · 3 | Quests that roll Tech get +1 die. Physical Mosjes get −10 Power. | DIE_PLUS · POWER_DOWN |
| Zo is Natuur | ★★★ · 2 | Mosjes with Res ★★ lose 10 less MP from each attack. | MP_SHIELD |
| Dooie Boel (was The Void) | ★★★★ · 3 | Piecies and Snelle can't make a Mosje gain MP. | LOCK (MP gain) |
| Welloe Plekka (was Welloe Graveyard) | ★★★★ · 3 | Cards that send a Mosje to the Welloe pile cost 1 Energy less. Mosjes can't leave the Welloe pile. | COST_DOWN · LOCK |
| Bed Chillings (was Momentum Stabilizer) | ★★★★ · 3 | A Mosje can't lose more than 30 MP at once. | MP_CAP |
| Delluft | ★★★★★ · 4 | The first time each player pays Energy on their turn, they pay 1 more. A player with a Coert or Binti on their field pays no fee. | COST_UP · friend check |
| Dierenasiel | ★★★ · 2 | Pet Piecies cost 0 Energy. A player with no pet in play: their Mosjes get −10 Power. | COST_DOWN · POWER_DOWN |
| Pre-order Market (was Digital Gaming Stop) | ★★★ · 2 | When a player activates a gear Piecie: that player draws 1. | DRAW · on activate gear |
| Tesla | ★★★ · 3 | **Needs:** a Coert on your field. A Coert or Binti gets +1 die on every Quest. If you have no Coert on your field, destroy Tesla. | DIE_PLUS · friend bonus |
| Eendjes Voeren | ★★ · 2 | On Quests that roll Res, every Mosje rolls 3 dice. A Michelle gains 10 MP at the start of her owner's turn. | Quest dice · MP_GAIN · friend bonus |
| Rugby Training (NEW) | ★★★ · 2 | Physical Mosjes that were attacked during the last turn get +10 Power. Digital Mosjes get −10 Power. | POWER_UP · POWER_DOWN |
| Ruilbeurs Jaarbeurs (NEW) | ★★★ · 2 | Once per turn, a player can discard 1 card; they draw 1. A player with a Coert on their field draws 2 instead. | LOOT · friend check |
| Gandoe's Cloude (NEW) | ★★★ · 2 | Gear Piecies cost 1 Energy less. Physical Mosjes get −10 Power. | COST_DOWN · POWER_DOWN |
| Silverstone (DDR arcade) (NEW) | ★★★ · 2 | The 3rd Piecie a player activates in a turn costs 0 Energy. With a Chris on their field: that Chris also gains 10 MP. | COST_DOWN · friend check |
| Perron (NEW, was De Dansvloer) | ★★★ · 2 | Mosjes with a Zonnebril attached lose 5 less MP from each attack. An Alyssa also gains 10 MP at the start of her owner's turn. | MP_SHIELD · MP_GAIN · friend bonus |
| Homeschool (NEW, was Schoolplein) | ★★★ · 2 | Once per turn, after a player activates a Piecie: they can discard 1 card; they draw 1. With a Cless on their field: that Cless also gains 10 MP. | LOOT · friend bonus |
| De Cockpit (NEW) | ★★★ · 2 | A player with 2 or more ready gear Piecies gets +1 die on Quest rolls. Physical Mosjes get −10 Power. | DIE_PLUS · POWER_DOWN |
| Het Podium (NEW) | ★★★ · 2 | Quests that roll Soc get +1 die. Physical Mosjes get −10 Power. | DIE_PLUS · POWER_DOWN |
| De Daken (NEW) | ★★★ · 2 | When a Mosje rolls Str or Art for a Quest: it can reroll 1 die. Digital Mosjes get −10 Power. | REROLL · POWER_DOWN |
| Circuit Zandvoort (NEW) | ★★★ · 3 | When a Mosje with ★★★ in the rolled trait rolls for a Quest: +1 die. Physical Mosjes get −10 Power. | DIE_PLUS · POWER_DOWN |

Rule changes: none beyond wording. Pre-order Market now says "a player" (Places work for both players). Trait names are shortened to Str, Tech, Art, Soc, Res.

### Booster kit cards (NEW, from the Mosje Kits doc)

| Card | Kind · ★ · cost | Text | Template |
|---|---|---|---|
| Zonnebril | gear · ★★ · 1 · party Mosjes, Jeffrey Gambler | **Attach:** your opponent's Snelle can't target this Mosje. | UNTARGETABLE · ATTACH |
| Knijpkat | gear · ★★ · 1 · Michelle, Tuk | **Attach:** when this Mosje fails a Quest, it gains 10 MP. A Michelle or Tuk gains 20 instead. | MP_GAIN · ATTACH · ON_QUEST_FAIL · friend bonus |
| Omafiets | gear · ★★ · 1 · Michelle | **Attach:** +1 die on one Quest each turn. If that roll shows a 1, discard this card. A Michelle ignores the first 1. | DIE_PLUS · ATTACH · friend bonus |
| Thuiszorg | Snelle · ★★ · 1 · Michelle, Tuk | One of your Mosjes gains 15 MP. A Michelle or Tuk also draws 1. | MP_GAIN · DRAW · friend bonus |
| Reserve-onderdelen | gear · ★★ · 1 · Coert | **Needs:** a Digital Mosje. Take 1 gear Piecie from your discard pile into your hand. | RECYCLE · needs DIGITAL |
| Kabelbak | gear · ★ · 0 · Coert | **Needs:** a Digital Mosje. Draw 2, then discard 1. | LOOT · needs DIGITAL |
| Bootstick | gear · ★★ · 1 · Coert | **Needs:** a Digital Mosje. Shuffle your hand into your deck and draw that many. With a Coert on your field: draw 1 more. | DRAW (mulligan) · needs DIGITAL · friend check |
| Med Kit | gear · ★ · 0 · FPS Coert | **Needs:** a Digital Mosje. One of your Mosjes gains 20 MP. An FPS Mosje gains 30 instead. | MP_GAIN · needs DIGITAL · friend bonus |
| Night Vision | gear · ★★ · 1 · FPS Coert | **Needs:** a Digital Mosje. Look at your opponent's hand. With FPS Coert on your field: one of your Mosjes gets +1 die on one Quest this turn. | PEEK_HAND · DIE_PLUS · needs DIGITAL · friend check |
| Loot Backpack | gear · ★★ · 1 · FPS Coert | **Attach:** when this Mosje wins a Quest, draw 1. | DRAW · ATTACH · ON_QUEST_WIN |
| Minimap | gear · ★★ · 0 · FPS West | **Needs:** a Digital Mosje. Look at the top 3 cards of your opponent's deck and put them back in any order. | SCRY (opponent) · needs DIGITAL |
| Smoke Grenade | Snelle · ★★ · 1 · FPS West | When an opponent's Mosje attacks: that attack gets −10 Power. If it attacks a West, cancel the attack instead. | POWER_DOWN · CANCEL · friend bonus |
| Racestuur | gear · ★★ · 1 · Martin Driver | **Attach:** +1 die on Quests that roll Tech. A Martin also gains 10 MP when he wins a Quest. | DIE_PLUS · ATTACH · friend bonus |
| Day-One Game | gear · ★★ · 1 · Ming | Draw 1. With a Ming on your field: it gets +1 die on its next Quest this turn. | DRAW · DIE_PLUS · friend bonus |
| Pokerfiches | gear · ★★ · 1 · Jeffrey Gambler | **Attach:** once per turn, when you stake Energy, it counts as 1 Energy more. | stake boost · ATTACH |
| Roast-boekje | gear · ★★ · 1 · Binti | **Attach:** once per turn, when your opponent discards a card: 1 target opponent Mosje loses 10 MP. On a Binti: 15 MP instead. | MP_LOSS · ATTACH · target · friend bonus |
| Telefoon | gear · ★ · 1 · Binti | Your opponent reveals 2 random cards from their hand. With a Binti on your field: they discard 1 of them, your choice. | PEEK_HAND · DISCARD_OPP · friend check |
| Bladmuziek | gear · ★ · 0 · Jisca | **Needs:** a Creative Mosje. Look at the top 3 cards of your deck and put them back in any order. | SCRY · needs CREATIVE |
| Metronoom | gear · ★★ · 1 · Jisca | **Attach:** once per turn, when you activate a Piecie: roll 1 die. On a 4, 5 or 6, this Mosje gains 10 MP. A Jisca's own ability also succeeds on a 3. | GAMBLE · MP_GAIN · ATTACH · friend bonus |
| Kattenbrokjes | food · ★ · 0 · Tuk | One of your Mosjes gains 15 MP. With Bowie & Stormey in play: 25 MP instead. | MP_GAIN |
| Japans Woordenboek | gear · ★★ · 1 · Cless Teacher | **Attach:** at the end of your turn, if you have 3 or fewer cards in your hand, draw 1. | DRAW · ATTACH · END_OF_TURN |
| Kanji Flashcards | Snelle · ★ · 1 · Cless Teacher | Draw 2, then put 1 card from your hand on top of your deck. With a Cless on your field: keep both. | DRAW · friend check |
| Bento Box | food · ★★ · 1 · Cless Teacher | One of your Mosjes gains 20 MP. A Cless also draws 1. | MP_GAIN · DRAW · friend bonus |
| Draaitafels | gear · ★★ · 1 · DJ 80/20 | **Attach:** +1 die on Quests that roll Art. A DJ 80/20 also gains 10 MP each time he rerolls a die. | DIE_PLUS · ATTACH · friend bonus |
| DJ Koptelefoon | gear · ★ · 0 · DJ 80/20 | **Attach:** once per turn, look at the top card of your deck. You can put it on the bottom. | SCRY · ATTACH |
| Mixer | gear · ★★ · 1 · DJ 80/20 | **Attach:** when this Mosje rolls a pair on a Quest, it gains 10 MP and you gain 1 Energy. | MP_GAIN · ENERGY_GAIN · ATTACH |
| Toploader | gear · ★★ · 2 · Coert, KasteLuck | **Attach:** your opponent's Piecies can't make this Mosje lose MP. A Coert also draws 1 when he wins a Quest. | UNTARGETABLE (MP loss) · ATTACH · friend bonus |
| ChestPress | gear · ★★ · 1 · AZN Cless | **Attach:** once per turn, before a Quest roll, this Mosje can lose 10 MP; +1 die on that Quest. An AZN Cless loses nothing. | MP_COST · DIE_PLUS · ATTACH · friend bonus |
| Señor West's Sombrero | gear · ★★ · 1 · Martin, Señor West | **Attach:** the first attack on this Mosje each turn gets −10 Power. On a Señor West: his ability costs 0 Energy. | POWER_DOWN · COST_DOWN · ATTACH · friend bonus |
| De Switch | gear · ★ · 0 · Youri, Chris | One of your Mosjes gains 10 MP. A Chris or Youri also gets +1 die on one Quest this turn. | MP_GAIN · DIE_PLUS · friend bonus |
| Yoke & Pedals | gear · ★ · 0 · Flightsim Coert | **Needs:** a Digital Mosje. One of your Mosjes gains 10 MP. With a Coert on your field: draw 1. | MP_GAIN · DRAW · needs DIGITAL · friend check |
| A Mili | substance · ★★ · 1 · Gandoe | Roll 1 die for one of your Mosjes. 1–2: it loses 10 MP. 3–4: it gains 20 MP. 5–6: it gains 20 MP and gets +10 Power this turn. A Gandoe never loses MP from it. | GAMBLE · friend bonus |
| Bodyguard | Snelle · ★★★ · 1 | When an opponent's Mosje attacks one of yours: your other Mosje takes the attack instead. | REDIRECT |

Señor West's Sombrero: "charm" is Señor West's own ability (an opponent Mosje is charmed and can't attack), so on him that ability costs 0 Energy.

### Booster decisions (ruled 14 Nov)

| Card | Kind · ★ · cost | Final text | Template |
|---|---|---|---|
| Boxing Gloves | gear · ★★ · 1 · Gandoe, Michelle | **Needs:** a Physical Mosje. One of your Mosjes gets +10 Power this turn. A Gandoe or Michelle gets +20 instead. | POWER_UP · THIS_TURN · needs PHYSICAL · friend bonus |
| Jeffrey's Plates | gear · ★★★ · 3 · Jeffrey Strongman | **Attach:** +20 Power. This Mosje can't attack on the turn you attach this. A Jeffrey can. | POWER_UP · ATTACH · LOCK · friend bonus |
| De Belt | gear · ★★★★ · 2 · Gandoe Destroyer | **Needs:** a Physical Mosje. **Attach:** +20 Power. If this Mosje drops a level from an attack, the attacker's owner can move De Belt to one of their Physical Mosjes. | POWER_UP · ATTACH · STEAL |
| Youri's Beta | gear · ★★ · 1 · Youri | **Attach:** the first time this Mosje fails a Quest, roll all the dice again. Then discard this card. On a Youri: once per turn, and keep this card. | REROLL · ATTACH · ON_QUEST_FAIL · friend bonus |
| Grip-schoenen | gear · ★★ · 1 · Parkour West | **Attach:** Mosjes with less Power can't attack this Mosje. A West also gets +10 Power. | LOCK (attack) · POWER_UP · ATTACH · friend bonus |
| Tesla Laadkabel | gear · ★★ · 0 · Coert | **Needs:** a Digital Mosje. One of your Mosjes loses 10 MP; gain 1 Energy this turn. With Tesla in play: gain 2 instead. | MP_COST · ENERGY_GAIN · THIS_TURN · needs DIGITAL |

Also ruled: the 17 cards archived on 1 Nov stay archived (Synergy Field, MP Amplifier, Perfect Dodge, Mosje Shield, Continuous Assault, MP Hemorrhage, Chain Reaction, Perfect Setup, MP Adjuster, Drain Reversal, Quest Haven, Synergy Chamber, Momentum Factory, Boxing Ring, Double Trigger, Moshpit, the old Schoolplein). **Mosje Reborn and The Protector become ★★★★★ chase cards** (Gandalf: "super powerful, a good card to try and pull"). Mosje Reborn is done: cost 2, a Mosje from any player's pile (the opponent's too) onto your field at Level 1 with 50 MP (Gandalf, 14 Nov: Level 1, not Level 2). The Protector is done too (Gandalf's idea, 14 Nov): a Snelle that attaches to one Mosje at any time and stays for 1 Energy per turn.

### Booster skim (14 Nov, by Claude on Gandalf's request)
Read all 129 booster texts against the rules and against each other. Fixed:
- **Bodyguard** named Kast-elein, a Mosje that is archived. The friend line is cut.
- **Blensen!** now says "cards and abilities", the same as The Protector, since Mosje abilities can target.
- **Silverstone, Homeschool, Day-One Game:** the friend line pointed at "it" or at a Mosje the card never picked. They now say which Mosje.
- **Roast-boekje:** friend line in the standard form ("On a Binti: 15 MP instead").

Left as they are, for the playtest: Med Kit (20 MP behind a gate is less than Kannetje Melk for anyone but an FPS Mosje) · Pre-order Market (a draw on every gear Piecie in a deck full of free gear) · Klaar Met Jou and Harde Didde (near-copies) · Welloe Plekka (switches off Mosje Reborn, Call of the Welloes and TemPiecie on Mosjes; that is its job).

Near-copies left as they are, on Gandalf's principle that the same effect is fine when the owner differs: Kabelbak (Bagga of Greed for Digital), De Switch (Dancepad for Youri), Homeschool (Ruilbeurs Jaarbeurs for Cless), Bladmuziek and Minimap. No owner difference, so worth a look later: Klaar Met Jou and Harde Didde.

---

## Booster cards — Mosje abilities and Personal Quests (14 Nov)
Reworded by rule, like the other booster cards. Source: `mosje-personas.md` and the Personal Quest List. Level upgrades start at Level 2, as ruled for the starter Mosjes.

### Booster Mosje abilities

| Mosje | Ability text | Template |
|---|---|---|
| Gandoe, The Destroyer (Physical · ★★★★★) | Once per game: pay 4 Energy; your opponent's lowest-level Mosje drops one level. | LEVEL_DOWN · pay Energy · once per game |
| Coert, KasteLuck (Physical) | At the start of your turn: roll 1 die. On a 4, 5 or 6, draw 1 and this Mosje gains 5 MP. | GAMBLE · DRAW · MP_GAIN · START_OF_TURN |
| Martin, Señor West (Physical) | Once per turn: pay 1 Energy; target 1 opponent Mosje. It can't attack until the end of your opponent's next turn. | LOCK (attack) · pay Energy · target |
| Parkour West, The Flow Fighter (Physical) | When this Mosje wins a Quest: it gains 20 MP more. Once per turn, when it loses 20 or more MP from an attack: it loses 10 less. From Level 2: 20 less. | MP_GAIN · MP_SHIELD · ON_QUEST_WIN · level upgrade |
| Alyssa, Fissa Fissa! (Physical) | Once per turn, when you activate a Place or your card destroys one: this Mosje gains 20 MP. | MP_GAIN · ON_PLACE |
| AZN Cless, The Wild Card (Physical) | At the end of your turn: roll 1 die. 1–2: discard 1 card. 5–6: draw 1 and this Mosje gains 10 MP. From Level 2: draw 2 instead. | GAMBLE · DRAW · MP_GAIN · END_OF_TURN · level upgrade |
| Martin, The Precision Driver (Digital) | When this Mosje wins a Quest: it gains 15 MP more. Once per turn: pay 1 Energy and discard 2 cards; draw 3. | MP_GAIN · DRAW · ON_QUEST_WIN · pay Energy + discard |
| Tuk, The Healing Spirit (Creative) | Once per turn: pay 1 Energy; one of your Mosjes gains 15 MP. From Level 2: 20 MP instead. | MP_GAIN · pay Energy · level upgrade |
| Cless, The Teacher (Creative) | When you activate a Piecie: roll 1 die. On a 5 or 6, draw 1 and one of your Mosjes gains 5 MP. From Level 2: on a 4, 5 or 6. | GAMBLE · DRAW · MP_GAIN · on activate Piecie · level upgrade |
| Jisca, The Maestro (Creative) | Once per turn, when you activate a Piecie: roll 1 die. 4–6: activate another ready Piecie for 0 Energy and 1 target opponent Mosje loses 15 MP. 1–3: this Mosje loses 10 MP. | GAMBLE · EXTRA_USE · MP_LOSS · target |

**Flightsim Coert** (NEW booster Mosje) is still a draft: no ability yet. Gandalf does him later (14 Nov). Archived Mosjes get no text: The Historian, The Predictor, The All-Rounder, The Creator, Kast-elein, The Sims Architect and the four placeholders.
**Ruled 14 Nov:** Gandoe, The Destroyer and Alyssa, The Bulldozer start at 10 MP (start MP is never 0). Parkour West and The Precision Driver carry two abilities each, the longest texts among the Mosjes.

### Booster Personal Quests

| Personal Quest | ★ · Mosje | Text |
|---|---|---|
| Kampioen Van De Box | ★★★★★ · Gandoe, The Destroyer | **Needs:** De Box in play and Boxing Gloves ready. **Roll:** none, it can't fail. |
| Fissa Tot De Ochtend | ★★ · Alyssa, Fissa Fissa! | **Needs:** 1 ready food Piecie and 1 ready substance Piecie. **Roll:** 1 ▣ per Soc★. Need 2× ⚃+. |
| All In | ★ · AZN Cless, The Wild Card | **Needs:** 3+ other cards in your hand. **Pay:** discard your hand. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. |
| Over Alle Daken | ★★★ · Parkour West | **Needs:** 1 ready gear Piecie. **Roll:** 1 ▣ per Str★ and 1 ▣ per Art★. Need 3× ⚃+. |
| Lucky Streak | ★★ · Coert, KasteLuck | **Pay:** 2 Energy. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. Each ⚅ lets you roll 1 more ▣. |
| Obby Shotjes Gauntlet | ★★★★ · Martin, Señor West | **Needs:** Obby #1 in play. **Pay:** discard 2 substance Piecies, 1 from your hand and 1 ready. **Roll:** 1 ▣ per Str★. Need 2× ⚃+. |
| Full Combo | ★★★★ · Chris, The BigStepper | **Needs:** you activated 3 Piecies this turn. **Roll:** 1 ▣ per Str★. Need 1× ⚃+. |
| Clutch Round | ★★ · FPS West | **Needs:** you have 1 Mosje on your field and your opponent has 2. **Pay:** 1 Energy. **Roll:** 1 ▣ per Tech★. Need 2× ⚃+. |
| Grand Prix | ★★★ · Martin, The Precision Driver | **Needs:** Track Highscore ready. **Pay:** 2 Energy. **Roll:** 1 ▣ per Tech★ and 1 ▣ per Art★. Need 3× ⚃+. |
| Ongevraagd Advies | ★★★ · Ronald, Dr. Phill-osoof | **Needs:** your opponent has 4+ cards in hand. **Roll:** 1 ▣ per Art★. Need 2× ⚃+. |
| Staande Ovatie | ★★★ · Jisca, The Maestro | **Needs:** Het Podium in play. **Pay:** discard 1 ready pet Piecie. **Roll:** 1 ▣ per Soc★. Need 2× ⚃+. |
| Cat Sanctuary | ★★★★ · Tuk, The Healing Spirit | **Needs:** Bowie & Stormey ready. **Pay:** discard 2 food Piecies from your hand. **Roll:** 1 ▣ per Soc★. Need 1× ⚃+. |
| Final Exam | ★★ · Cless, The Teacher | **Needs:** ViannaPoes ready. **Pay:** discard 2 cards from your hand. **Roll:** 1 ▣ per Men★. Need 2× ⚃+. |

Rule change by precedent: **Obby Shotjes Gauntlet** loses the alternative payment (a ready Those Eyelashes Tho... plus 1 substance). Roll traits follow the personas doc (re-typed 7 Nov: Lucky Streak, Obby Shotjes Gauntlet and Full Combo roll Str; Grand Prix rolls Tech and Art).
**Butter Landing** (Flightsim Coert) waits for that draft. Personal Quests of archived Mosjes are archived with them: Called It, Archive Dive, Manus-je Van Alles, Blank Canvas, The Immovable Kast, Dream House. Ongevraagd Advies has no rarity in the docs; ★★★ is taken from Checkmate, the card it replaces.

---

## Open rulings
1. ~~Cost first~~ **Ruled 14 Nov:** a price is paid when the card is played, written before the reward with a semicolon (Te Hard Gaan, Ronald's Fles Fireman).
2. ~~Dice wording~~ **Ruled 14 Nov:** the word "die" in effect text; the die icon only in Quest and Personal Quest Roll lines. Effect Library §6.1 ("▣ everywhere") is overruled.
3. **Baseline:** what 0 and 1 Energy buy. Protein Shake, Hawaii Pizza and Ronald's Fles Fireman are weaker than generic cards for anyone but their own friend.
4. ~~Missing costs~~ **Ruled 14 Nov.** Piecies and Snelle: Dancepad 0, Rugbybal 2, Koksmes 2, Ronald's Fles Fireman 1, In De Groove 1, Gekke Dobbel 0, Chris's Handdoek 0, Headset 0, MagicPrompt 1, Hawaiishirt 2, Blikje Monsteros 0. Places: Ronnie's Kitchen 2, Woonkamer (Discord) 2, Youri's Woonkamer 2, Nieuwe Gimma 2. Mouse goes from 0 to 1, the same as MagicPrompt. Guideline: a free card should not draw or give Energy.
5. ~~Near-copies in the Creative deck~~ **Closed 14 Nov:** the dice trio is resolved; Schetsboek stays as it is (it puts the other card on the bottom, Zie je die Dingetjes does not). Playtest watch.
6. ~~Jeffrey, The Strongman~~ **Ruled 14 Nov:** Dumbbells became an Attach card, so the Physical deck has 5 (Rugbybal ×2, Koksmes, Dumbbells ×2).
7. ~~Mouse and MagicPrompt~~ **Ruled 14 Nov:** the same effect is fine when the owner differs. Digital deck: 1 Mouse + 2 MagicPrompt, and a second Keyboard in the free slot.
8. ~~Headset~~ **Closed 14 Nov:** stays as it is at 0 Energy. Playtest watch.
9. ~~Ff Haaltje Nemen~~ **Ruled 14 Nov: stays Draw 1 at 2 Energy** (Gandalf). Claude's note for the record: at Draw 1 for 2 Energy is the weakest card in the Digital deck (Boosterpackkie draws 1 for 0; Keyboard draws 1 and gives 10 MP for 0). Lower the cost to 0, or swap it out.
10. ~~Skiffa and Nieuwe Gimma~~ **Ruled 14 Nov: Skiffa keeps the reroll, Nieuwe Gimma gives +1 die.** Was: both give a reroll on Quest rolls and both sit in the Creative deck; only one Place is in play at a time. One needs a different effect.
11. ~~Stookerino~~ **Ruled 14 Nov: 1 Energy and ★★.** Was: at 2 Energy and ★★★ it is weak (the opponent throws away their worst card) and close to Those Eyelashes Tho... option A. Lower it to 1 Energy and ★★, or pick Eyelashes B.
12. ~~Personal Quests and discard~~ **Ruled 14 Nov, rulebook: "A Personal Quest can't be discarded by an opponent's effect."** Background: FPS West (every turn), Jantje Jantje... and TemPiecie-style effects can remove a Personal Quest from the opponent's hand. Proposal: "A Personal Quest can't be discarded by an opponent's effect."
13. ~~Dice stacking~~ **Ruled 14 Nov, rulebook: "A Quest roll never uses more than 6 dice."** Background: Punto Banco +2, Gekke Dobbel +2 (Jeffrey), Dikke Plaat +1, Zwoele Ming Power, Lucky Cóin, DJ 80/20 and Skiffa / Nieuwe Gimma can land on one roll. Proposal: "A Quest roll never uses more than 6 dice."
14. ~~Level 3 upgrades~~ **Ruled 14 Nov: Michelle, Youri, DJ 80/20 and Binti get their upgrade from Level 2.** Playtest watch: Youri (free from Level 2) and Binti (20 MP from Level 2) are stronger for longer now.
15. ~~Coert's Caravan~~ **Ruled 14 Nov: 2 Energy less instead of 0 Energy.**
16. ~~FPS Coert~~ **Ruled 14 Nov: triggers on a 5 or 6.**

## Parked ideas (14 Nov, from other card games; not part of the pass)
| Idea | Draft text | Note |
|---|---|---|
| Type bonus form | "One of your Mosjes gets +20 Power this turn. A Physical Mosje gets +30 instead." | A softer gate than Needs:. Would touch Protein Shake, Dumbbells, Super Saiyan Mos. |
| Opstaan! (placeholder) | Discard 1 card; one of your sideways Mosjes stands up. | Fits Michelle; feeds Discarded. |
| Doorpakken (placeholder) | One of your Mosjes loses 20 MP; it can attack one more time this turn. | Attacks only. Dangerous with Super Saiyan Mos. |
| Groepsfoto | Reveal 3 cards from your hand; gain 1 Energy this turn. | New verb REVEAL. MP version: 10 MP per revealed card. |
| Wat Heb Je Daar? (placeholder) | Name a Piecie subtype. Your opponent discards 1 Piecie of that subtype. If they can't, they show you their hand. | Naming a card type is too easy (28 of 40 cards are Piecies). |

## Deck list changes from this pass (14 Nov)
- **Digital:** Mouse 2 → 1, Keyboard 1 → 2.
- **Physical:** no count change; Dumbbells ×2 are now Attach gear (5 Attach cards in the deck).
- **Creative:** no count change.

## Rulebook lines owed
1. A Personal Quest can't be discarded by an opponent's effect.
2. A Quest roll never uses more than 6 dice.
3. "Target" is a defined word; only cards and Mosje abilities target, attacks don't. Jensen!, Zonnebril and Blensen! work against anything that says Target.
4. A price before a semicolon is paid when the card is played.
5. **Ruled 14 Nov:** gear attached to a Mosje counts as a "ready gear Piecie", for Needs lines and for Pay lines (Sterke Jongen, Vibe Coded, Headshot, Aloha Tech Support). Playtest watch: a Mosje with gear on it always meets those Needs lines.
6. Rebouleh and Youri: the extra use still pays the normal cost.
7. **Ruled 14 Nov:** a Mosje protected by Ctrl+S that reaches 0 MP stays at 0 and keeps its level. After the protection ends it only drops when it loses MP again.
8. Zwoele Ming Power: a Quest always needs at least 1 success.
9. Kleine Taks stays in its slot until its second tick, then is discarded.
10. Binti: a marker shows that the 20 MP hit was used last turn.
11. **Ruled 14 Nov:** FPS West needs 21 or more MP to pay the 20 MP for his swap (same as Charge!). Not yet ruled for other MP costs (Te Hard Gaan, Ronald's Fles Fireman, Blikje Monsteros, Stripje Bennies, ChestPress): can they take a Mosje to 0?
12. Knocked Down, Not Out: an attack, a failed Quest or a Pay all count as losing MP.
13. DJ 80/20 counts as a Gandoe.
14. **One pile per player (Gandalf, 14 Nov):** the Welloe pile and the discard pile are the same pile. Cards say "Welloe pile" when they are about Mosjes and "discard pile" otherwise. Consequences: Mosje Reborn also finds a Mosje that was discarded from a hand; TemPiecie can take a knocked-out Mosje back into the hand (it still has to be summoned again at Level 1).
15. **Mosje Reborn on an opponent's Mosje:** it needs a free Mosje spot on your field; you control it and it counts as yours for friend bonuses and Personal Quests; when it leaves play it goes back to its owner's pile.
16. **The Protector** is a Snelle that attaches: it can be played at any time, counts as one of the Mosje's 2 attachments, and is discarded at the start of your turn unless you pay 1 Energy. This "pay or discard" line is a new duration (UPKEEP) and needs its own handler.

## To do
- Flightsim Coert (draft): ability and Personal Quest (Butter Landing), later
- The 38 general Quests are not part of this pass (names round)
- Sync the older docs with this pass: Starter Decks (Digital counts), Effect Library (§6.1, new templates HAND_SWAP, QUEST_EASE, PEEK_DECK), Mosje Kits, Mosje Personas (abilities), Rules and Decisions, Personal Quest List
- Push this doc to the repo branch `card/mosje-roster-7nov`
- Playtest watch list: Headshot and Vibe Coded now that attached gear counts as ready, Med Kit, Pre-order Market, Mosje Reborn (steals from the opponent's pile; with Harde Didde it is a two-card steal), Gekke Dobbel, Zwoele Ming Power, Punto Banco with High Roller, Coert's Caravan, FPS West, Youri, Binti, Aloha Tech Support, Vibe Coded with extra dice, Headset, Schetsboek, Ff Haaltje Nemen
