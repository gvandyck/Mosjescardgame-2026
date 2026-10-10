# Obby Card Game 2.0 — Phase 7: Card Frames and Art

Phase 7 output, 2026-10-10. Two parts: **(A) the 2.0 card frame spec** for the web game (what each card face shows and where), and **(B) the missing-art list**, with starter-deck cards first.

**Scope (your call):** digital only. Paper cards and print sheets are out of scope for now. No engine or UI code was changed; the engine milestone (`obby-2.0` branch, see the Claude Code Handoff) builds the frames from this doc.

**Builds on what is live on `main`:** the rarity-tier card design (Phase 50–52, merged as `98cc965`): `src/ui/cardV1/`, `styles/card-v1.css`, 5 tiers, Quest cards in the tier design, the local card editor. This doc lists only **what changes for 2.0**. Anything not mentioned stays as it is on `main` (fonts Sora + DM Sans, 440 × 660 reference size that scales, radius 24, tier 1–3 boxed art with seigaiha frame, full-art layout, hover / long-press panel for flavour text and rarity).

---

## A. Frame spec

### A1. Rarity → frame (5 tiers)
| Tier | Frame |
|---|---|
| ★ | Boxed (partial) art, soft white pinline |
| ★★ | Boxed art, type-colour ring |
| ★★★ | Boxed art, rainbow foil ring, cosmos dots in the art window |
| ★★★★ | Full art, plain black frame, **no** shine ("regular") |
| ★★★★★ | Full art, plain black frame, **holo shine / foil** |

This matches `main` (`getRarityTier` 1–5, shine only at tier 5).

**Mosjes are always full art (your call).** The 2.0 Card List rarity still drives the rules (copy limits, ★★★★★ = limit 1 per deck, boosters), but a Mosje's frame ignores it:
- Every Mosje uses the full-art layout.
- Foil (tier 5 look) when the Mosje's 2.0 rarity is ★★★★★ (only Gandoe, The Destroyer) **or** it has a `foil: true` flag set in the card editor.
- Proposal: carry your 6 Oct re-tier over as that flag, so the 12 Mosjes you set to ★★★★★ on `main` keep their foil (Gandoe Wizard, Alyssa Fissa, Gandoe Destroyer, Ronald Chef, Ming Natural, Martin Historian, Coert Tech Savant, Jeffrey Gambler, FPS West, Dancing/DDR Chris; plus the parked Amplifier and Kast-elein).
- Engine note: split "rules rarity" (`rarity`, from the Card List) from "frame tier" (`frameTier`, derived) so rarity can never accidentally change a copy limit.

Piecies, Snelle, Places and Quests use their 2.0 rarity for the frame as normal.

### A2. Shared face layout (all card types)
Taken from your approved 2.0 mock-up ("0c · Alyssa with Power + Energie" on the Board & Combat canvas) and the Rules doc's card-face section.

| Area | What goes there |
|---|---|
| **Top-left** | **Energy cost:** big white number (Sora 800), small "COST" label under it, **no box, no crystal** (your call). A 0-cost card shows **0**, not "Free". A thin divider line separates it from the name. Quests have no cost here (see A6). |
| **Top, next to cost** | Name, left-aligned. Mosjes: first name large + nickname on a second line (as today, `parseMosjeName`; drop the `[ ]` brackets in the data). |
| **Top centre** | Rarity diamonds (lit ones only, centred), as on `main`. |
| **Art** | Boxed window (tier 1–3) or full art (tier 4–5). |
| **Text box** | **Frosted / blurred** (your call): the art shows through, blurred, with a dark tint for contrast. This overrides the earlier "no blur" rule from the card-frame-v1 handoff. Keep text contrast at 4.5:1 or better; raise the tint if a light artwork makes text hard to read. Ability name in bold. Text split at sentence breaks only, never reworded. |
| **Footer** | Per type (below). |
| **Colours** | Black, white and one type colour per card (unchanged `TYPE_COLORS`). |

Hover / long-press panel (not on the face): flavour text, rarity, "Limit 1 per deck" when it applies, and the type reminder (A3–A6).

### A3. Mosje
**Pop-up / hand card**
- Top-left: summon cost (Energy). Hand only; **field mode drops the cost**.
- Text box: ability (bold name), then the holder's synergy text if it has one ("While <name> is also on your field: …"), then `Synergy: <name>` label for non-holders.
- **Level rows (your call: 3 rows, current one lit):** a small 3-row table at the bottom of the text box:
  `L1  Power 10 · Phys ★★ · Res ★ · Cre ★★`
  `L2  Power 20 · Phys ★★★ · Res ★ · Cre ★★`
  `L3  Power 30 · Phys ★★★ · Res ★★ · Cre ★★`
  The row for the Mosje's current level is bright white; the other two are dimmed (about 45% opacity). In hand / deck builder (no live state) the L1 row is lit.
- Footer: **Power bottom-left** (number + "POWER"), **LVL chip + type centre** ("LVL 1" pill in type colour, "FIGHTING MOSJE" under it), **MP bottom-right** (number + "MP"). Power and MP are live values (Power includes this turn's boosts; MP is the real MP).
- Level 3: the LVL chip reads **"LVL 3 · HOLD"** until the win check at the start of the owner's next turn.

**Field tile (180 × 132)**
- Art, name + nickname on top, `L1` chip centre bottom, Power box bottom-left, MP box bottom-right (as in the mock-up). No cost.
- **Badges** top-right, small icon + word on hover: **Fresh** (can't attack, can't be chosen by opponent cards, ignores Places), **Protected** (levelled up this turn, can't be taksed).
- **Sideways** (getemt at Level 1): tile rotated 90°.
- **The Tactician:** while a Mosje's MP is temporarily set, the MP box shows the temporary MP big and the real MP small under it.

### A4. Piecie
- Top-left: activation cost (Energy).
- Info line above the pill: **"Needs: …"** only when the card has a requirement (e.g. "Needs: one of your Mosjes at Level 2+", "Needs: a Digital Mosje on your field"). No line when there is none (don't print "Requires: Any").
- Pill: `PIECIE`.
- **Label under the pill (your call: tag first):** the gameplay tag when the card has one: **Food**, **Gear**, **Substance**, **Pet**. Otherwise the Card List group: **MP**, **Attack**, **Utility**. This replaces today's sub-categories (Momentum-Gaining, Digital Equipment, Pet Protection, …).
- **Stays** cards: a small "STAYS" chip next to the pill; when the card sits face-up in its slot, the field tile shows the same chip.
- Face-down field Piecie (88 × 132): card back, unchanged. A "ready" glow from the owner's next turn on.
- Hover panel: "Place face-down for free. From your next turn, pay its cost to activate it."

### A5. Snelle
- Top-left: cost. **Blensen!** shows "4" with a small "or free" under the COST label.
- Info line: "Needs: …" only when the card has one (Perfect Dodge, Counter Strikka, Jammertje Gepakt!, Lucky Cóin, …).
- Pill: `SNELLE`. Label under it: **"Instant · any turn"**.
- Hover panel: "Play from your hand at any time, also on your opponent's turn, with saved Energy. Needs a free Piecie slot."

### A6. Place
- Top-left: **cost** (new: Places cost Energy in 2.0; today's Place face has no badge).
- Info line: **"Good for: X · Bad for: Y"** (from the Card List columns).
- Pill: `PLACE`. Label: **"Only 1 in play"**.
- Hover panel: "Play from your hand on your turn. Works at once and stays until destroyed. Fresh Mosjes ignore it."
- On the board the Place sits left of the Quests; the felt may take on the Place's colour (mock-up idea, optional).

### A7. Quest (same frame family, stack colour for the whole card)
**Colour (your call):** the whole card uses the stack colour: Fighting `#C2410C`, Digital `#0E7490`, Artistic `#A21CAF` (the Mosje type colours). Today's rose Quest colour is dropped. To keep a Quest from being mistaken for a Mosje, a Quest has **no LVL chip, no Power/MP boxes and no cost**, and its pill always says QUEST.

- Top-left: instead of a cost, the **dice need** in the same big style: e.g. **"2× 4+"** with "NEED" under it; Trained shows **"★★"** with "TRAINED"; Coin flip shows **"4+"** with "COIN".
- Name next to it.
- Art: optional. Until a Quest has art, the window shows the stack colour with the seigaiha pattern and a large die icon. (Quests are listed under B4, but they're not required.)
- Info line: **"Rolls: Physical"** (or "best trait" / "no trait"), plus the band ("Skilled").
- Text box: "First you must: …" (when it has one), then the "Also" text (jab, +1 die rule, named bonus, Vraag Aad, draw).
- Footer: **WIN +40** bottom-left, pill `FIGHTING QUEST` / `DIGITAL QUEST` / `ARTISTIC QUEST` centre, **LOSE −30** bottom-right (Trained: "can't fail").
- Field tile: name, need, win/lose, and **2 fail-token pips** (empty / filled) top-right. A Quest with 2 tokens is replaced.
- Quest stack piles on the board: card back with the stack colour, a stack label and the count of cards left.
- Rarity: Quests have no rarity; they use the tier 1 boxed frame.

### A8. Board pieces (from the Handoff §4, listed here so the visuals are in one place)
- **Energy:** 6 crystals per player next to their field, filled = available.
- Per player one row: 3 Piecie slots + 2 Mosjes. Middle: Place left, 3 Quests + stacks centre, End Turn right. Hand of real card frames at the bottom.
- Welloe pile next to the discard pile, showing the count.
- Judge everything at **1920 × 1080 or larger**.

### A9. Data the frames need (for the engine milestone)
Maps onto the Handoff §3b fields. New or changed for the face:
| Face element | Field |
|---|---|
| Cost | `cost` (Energy); Blensen! `costText: "4 or free"` |
| Level rows | `levels[0..2].power`, `levels[0..2].traits` |
| Mosje foil | `foil: true` (editor flag) or `rarity === ★★★★★` |
| Piecie label | `tag` else `group` (`mp` / `attack` / `utility`) |
| Needs line | `needsText` (or derived from `levelGate` + card requirement) |
| Stays chip | `stays` |
| Place info line | `goodFor`, `badFor` |
| Quest face | `stack`, `band`, `rollTrait`, `costId` text, `win`, `lose`, `extras` |
| Limit 1 | `limitPerDeck` (hover panel) |

Code that changes on `obby-2.0` (for orientation): `formatCost.js` (Energy, 0 not "Free", no "MP COST"), `buildMosjeSpecV1.js` (level rows, Power, cost top-left), `getPiecieCategoryLabel.js` (tags), `buildPlaceSpecV1.js` (cost), `buildQuestSpecV1.js` (stack colour, need, win/lose), `typeColors.js` (QUEST rose no longer used for 2.0 Quests), `getRarityTier.js` (+ Mosje full-art rule), CSS for the frosted text box.

### A10. Tests for the frames (add to the Handoff's test list)
- Unit: frame tier for Mosjes is always 4 or 5; foil only with ★★★★★ or `foil: true`; Piecie label returns the tag first; cost 0 renders "0".
- Playwright (`tests/ui/`): a Mosje pop-up shows 3 level rows with the current one lit after a level-up; a field Mosje shows Fresh and Protected badges at the right times; a Quest card shows the stack colour, need, win/lose and fail pips; a Place shows its cost. Screenshots at 1920 × 1080.

---

## B. Missing-art list

How this was counted: every 2.0 card was matched to its web card id, and its `artPath` checked against the files in `assets/`. **78 cards have no art**, **2 borrow another card's art**, and **38 Quests** have none (optional). Parked and cut cards are left out.

A short brief per card says what the image could show, based on the card's name and text. Change any of them freely. "Full art" means the image fills the whole card, so it needs a tall image (2:3) with the subject in the middle.

### B1. Starter-deck cards (do these first) — 34
**Deck 1, Fighting "Taksen" (11)**
| Card | Type | Rarity | Frame | Brief |
|---|---|---|---|---|
| Parkour West, The Flow Fighter | Mosje | ★★★★ | full art | West mid-jump over a railing or wall, city rooftops, motion blur |
| Protein Shake | Piecie · food | ★★ | boxed | A big shaker bottle, gym bench behind it |
| Boxing Gloves | Piecie · gear | ★★ | boxed | A pair of worn red boxing gloves hanging on a hook |
| Super Saiyan Mos | Piecie | ★★★ | boxed | A Mosje powering up with spiky glowing hair and a golden aura |
| ViannaPoes | Piecie · pet | ★★ | boxed | Vianna's cat, looking unimpressed |
| Straffoe | Piecie · substance | ★ | boxed | A badly rolled, crooked joint with too much smoke |
| Slecht Gezet | Piecie | ★★ | boxed | A car parked badly / a tow truck in front of a building |
| Harde Didde | Piecie | ★★★★★ | full art, foil | One huge knockout punch, dramatic and over the top |
| Perfect Dodge | Snelle | ★★★ | boxed | A Mosje leaning back as a fist flies past (Matrix-style) |
| Jensen! | Snelle | ★★ | boxed | Someone shouting "Jensen!" with a hand up: stop! |
| Not Today! | Snelle | ★★★★ | full art | A hand pulling a Mosje back from the edge of a grave / Welloe pile |

**Deck 2, Digital "Regelaars" (13)**
| Card | Type | Rarity | Frame | Brief |
|---|---|---|---|---|
| [...], The Hacker *(name owed)* | Mosje | ★★ (frame: full art) | full art | A hooded figure in front of green code screens |
| FPS Coert | Mosje | ★★★ | full art | Coert with a headset, aiming in a shooter game, crosshair |
| Placeholder 4, The Drainer *(name owed)* | Mosje | ★★ | full art | A figure pulling glowing energy out of others with a straw / cable |
| Coert's Caravan | Place | ★★★★ | full art | Coert's caravan on a campsite, lights and gadgets inside |
| Keyboard | Piecie · gear | ★ | boxed | A glowing RGB gaming keyboard |
| Controller | Piecie · gear | ★ | boxed | A game controller with worn buttons |
| Boosterpackkie | Piecie | ★★ | boxed | A shiny booster pack being torn open |
| Momentum Boost | Piecie | ★★ | boxed | An arrow / rocket going up, speed lines |
| Momentum Diefje | Piecie | ★★★ | boxed | A little thief sneaking off with a glowing MP orb |
| Klaar Met Jou | Piecie | ★★★★★ | full art, foil | A Mosje walking away, the other one flat on the floor behind |
| Shhh, popo komt! | Piecie | ★★ | boxed | Friends hiding, blue police lights at the window |
| Jammertje Gepakt! | Snelle | ★★★ | boxed | A hand catching another hand in the act |
| Momentum Rush | Snelle | ★ | boxed | A quick burst of light / a sprint start |

**Deck 3, Artistic "Creatievelingen" (10)**
| Card | Type | Rarity | Frame | Brief |
|---|---|---|---|---|
| Tuk, The Healing Spirit | Mosje | ★★ | full art | Tuk with glowing healing hands, calm, soft light |
| Dancing/DDR Chris | Mosje | ★★★ | full art | **Borrowed art:** uses Chris, The All-Rounder's alt art. Needs its own: Chris on a DDR dance mat, arrows lighting up |
| Nature's Gift | Piecie | ★★ | boxed | **Borrowed art:** shares "Eendjes voeren" with the Place. Give the Place the image; new art for the Piecie: a hand holding seeds / fruit in a sunny park |
| Zie je die Dingetjes | Piecie | ★★ | boxed | Someone squinting at sparkly little things in the air |
| Chain Reaction | Piecie | ★★★ | boxed | Dominoes falling into each other |
| Stookerino | Piecie | ★★★ | boxed | A troublemaker whispering, stirring a pot |
| Laat me chillen! | Piecie | ★ | boxed | A Mosje in a hammock with a "do not disturb" sign |
| Huisbaas | Piecie | ★★★ | boxed | An angry landlord at the door with a key ring |
| Jantje Jantje... Jantje? | Snelle | ★★★ | boxed | Someone on a park bench (Bank Chilling) calling out, puzzled |
| Drain Reversal | Snelle | ★★★ | boxed | A stream of energy bending back to where it came from |

### B2. Other Mosjes — 3
| Card | Rarity | Brief |
|---|---|---|
| Ming, The Predictor | ★★ | Ming with a crystal ball / glowing screen of probabilities |
| Placeholder 1, The Tactician *(name owed)* | ★★★★ | A figure moving pieces on a board, MP numbers floating |
| Tuk "The Builder", The Sims Architect | ★★★ | Tuk building a house in a Sims-style build mode, green diamond above |

### B3. Other Piecies (28), Snelle (8) and Places (7)
**Piecies**
| Card | Rarity | Frame | Brief |
|---|---|---|---|
| Shoettoe | ★ | boxed | A last-second shot / boost when almost empty |
| Snoeiertje | ★ | boxed | A small sharp flick / pruning shears |
| Jantje Jantje... | ★★★ | boxed | Someone peeking at another player's hand of cards |
| TweedeKANs | ★ | boxed | A die rolling a second time, ghost of the first roll |
| Bagga of Greed | ★ | boxed | A bag overflowing with cards |
| Dubbele Ding | ★★★ | boxed | Two cards flying out of a hand at once |
| TemPiecie | ★★★ | boxed | A hand pulling a card back out of the discard pile |
| Loaded Dice | ★ | boxed | Weighted dice, one with a tiny lead blob |
| Perfect Rhythm | ★★ | boxed | A metronome / music notes in a neat line |
| Dikke Plaat | ★ | boxed | A vinyl record on a turntable, DJ hands |
| MP Amplifier | ★★ | boxed | A guitar amp turned to 11, MP glow |
| Mosje Reborn | ★★★ | boxed | A Mosje rising out of a glowing grave |
| Synergy Field | ★★ | boxed | Two Mosjes connected by a glowing field |
| Mosje Shield | ★★ | boxed | A Mosje behind a big round shield |
| Leipe Swap | ★★★★★ | full art, foil | Two Mosjes swapping places in a swirl, mirror image |
| Battle Concert | ★★★ | boxed | Alyssa on a stage in a battle pose, crowd |
| Dingetje toch?! | ★★★★★ | full art, foil | A shapeshifting card that looks like every card at once |
| Those Eyelashes Tho... | ★★★ | boxed | A close-up of long fluttering eyelashes, a blushing opponent |
| F1 Telemetry Data | ★★ | boxed | An F1 pit wall screen full of graphs |
| Perfect Setup | ★★ | boxed | Everything lined up perfectly on a desk |
| Double Trigger | ★★★★ | full art | Two hands pressing two buttons at the same moment |
| Welloe Force | ★★★★ | full art | A Mosje surrounded by thorny energy, attackers bouncing off |
| Gekke Vogels | ★★ | boxed | A couple of silly birds |
| Mouse | ★ | boxed | A gaming mouse with RGB light |
| Dumbbells | ★ | boxed | A pair of dumbbells on a gym floor |
| Skipping Rope | ★ | boxed | A skipping rope in motion |
| Continuous Assault | ★★★ | boxed | A row of fists / a flurry of punches |
| MP Hemorrhage | ★★★ | boxed | An MP bar slowly leaking |

**Snelle**
| Card | Rarity | Frame | Brief |
|---|---|---|---|
| Counter Strikka | ★★★ | boxed | An attack bouncing back toward the sender |
| Je Weet Niet | ★★ | boxed | A shrug while dice roll again |
| Bijna Welloe | ★★ | boxed | A Mosje hanging on at the edge, barely |
| Dubbele Temminks | ★★★ | boxed | A card's effect echoing twice |
| Gevalletje Klakkeloos | ★★★ | boxed | Someone copying a neighbour's move without thinking |
| Frenssen! | ★★★ | boxed | Someone shouting "Frenssen!" back at a "Jensen!" |
| Blensen! | ★★★★★ | full art, foil | A big bright bubble around your Mosjes, cards bouncing off |
| Chillingsvoorbij! | ★★ | boxed | Packing up a hangout spot / taking the sign back home |

**Places**
| Card | Rarity | Frame | Brief |
|---|---|---|---|
| Obby #1 | ★★★ | boxed | The original Obby hangout spot |
| The Void | ★★★★ | full art | An empty black space swallowing light |
| Synergy Chamber | ★★★★★ | full art, foil | A glowing room where pairs of Mosjes connect |
| Drain Zone | ★★★★ | full art | A red-lit arena, energy draining into the floor |
| Momentum Stabilizer | ★★★★ | full art | A machine with gauges holding an MP bar steady |
| Delluft | ★★★★★ | full art, foil | Delft streets with a parking meter / parking fine |
| Digital Gaming Stop | ★★★ | boxed | A game shop full of controllers and keyboards |

**Count check:** Mosjes 8 missing (5 in starter decks + 3 in B2) + 1 borrowed. Piecies 47 missing (19 in starter decks + 28 in B3) + 1 borrowed. Snelle 15 (7 + 8). Places 8 (1 + 7). Total **78 missing + 2 borrowed = 80** (34 of them in the starter decks).

### B4. Quests (optional) — 38
No Quest has art today; the frame works without it (A7). If you want art later, the two new Quests come first because they have no web card yet: **Dutch courage** (a Mosje knocking back a shot before a fight) and **Cheat code** (a controller with a secret button combo). The other 36 can follow per stack.

### B5. Art notes
- Mosjes are always full art, so every Mosje image needs a tall 2:3 crop with the face in the upper-middle.
- Full-art Piecies, Snelle and Places (★★★★–★★★★★), 14 cards: Harde Didde, Klaar Met Jou, Not Today!, Coert's Caravan, Leipe Swap, Dingetje toch?!, Double Trigger, Welloe Force, Blensen!, The Void, Synergy Chamber, Drain Zone, Momentum Stabilizer, Delluft. Do these before the boxed ones if placeholders bother you most there.
- Drop new art into `assets/<type>-art/` and set it with the local card editor (it saves `artPath` into `src/data/*.js`).
- The three "name owed" Mosjes (The Hacker, The Tactician, The Drainer) need a name before their art makes sense.

---

## Decisions (your calls, this phase)
- **Paper is out of scope:** no print sheets or print sizes; Phase 7 = frame spec + missing-art list.
- **5 tiers:** ★–★★★ boxed art; ★★★★ full art "regular"; ★★★★★ full art with shine / foil (matches `main`).
- **Mosjes always full art;** foil on ★★★★★ or an editor `foil` flag. Rules keep the Card List rarity.
- **Level rows:** 3 rows on the face, the current one lit.
- **Text box: frosted / blurred** (overrides the old "no blur" rule).
- **Quests get a 2.0 face in the same frame family, coloured by stack** (Fighting orange, Digital teal, Artistic purple); rose dropped.
- **Cost:** big number + "COST", no box or crystal.
- **Missing-art list:** starter decks first.
- **Piecie label:** tag first (Food / Gear / Substance / Pet), else MP / Attack / Utility.

## Small things I decided myself (check these)
- 0-cost cards show "0" (not "Free"); the old "MP COST" label goes.
- No "Needs" line when a card has no requirement (no "Requires: Any").
- "STAYS" chip for Stays cards; "LVL 3 · HOLD" chip at Level 3; Fresh / Protected badges top-right of the field tile.
- Quest top-left shows the dice need ("2× 4+", "★★ TRAINED", "4+ COIN"); Quests use the tier-1 frame (they have no rarity); fail tokens as 2 pips.
- Blensen! cost shows "4" with "or free".
- Proposal: the 12 Mosjes you set to ★★★★★ on 6 Oct keep foil via the `foil` flag.
- Borrowed art: the Place Eendjes Voeren keeps the "Eendjes voeren" image; Nature's Gift gets new art. Dancing/DDR Chris needs its own art (it uses Chris's alt).
- Art briefs are suggestions from the card names and texts.
