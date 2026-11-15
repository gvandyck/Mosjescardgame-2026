# Obby Card Game 2.0 — Names Round To-do

Open to-do, written 15 Nov 2026. **Status: not started.**

Goal: every card name comes from the friend group. The Quests become memories from things we did together, and generic English card names get a name with a story behind it.

## For Claude: when to bring this up
- **At the start of any new MOSJES / Obby chat, while this doc says "not started" or "in progress": suggest this to-do in one line** ("The names round is still open: shall we do a batch?"), unless Gandalf has already asked for something else. Then do what he asks.
- When a batch is done, tick the boxes here, update the status line at the top, and save this doc again (project and repo).

## How to run it
1. **Batches of about 12**, shown as a card sheet: the card's current name small, 2–3 name options large, a one-line "the story behind it" for each, and an own-name field. Mark the recommended option. The picker sends names back, never colour codes, and the picked button must be very obvious (solid colour, check mark, tinted card).
2. **Draft from what we know**: `Obby Card Game 2.0 - Mosje Lore.md` and `Mosje Personas.md` (memories, places, inside jokes). Label every draft as a guess. **Never present an invented memory as something that happened**; ask Gandalf what the real story is.
3. **Rules for names:** Dutch for card names and flavour, English for keywords. No real brand names (open question below). A name must fit what the card does.
4. **Save** each approved name:
   - tick it below, with the new name;
   - in `wording-pass.md`, rename the card in its table and add a line under "Renames (names round)";
   - in `tools/gen_cards.py`, add `"<new name>": "<name in src/data>"` to the `alias` map (the data name is in the card's "In data as" column of `handover/card-list.md`; without it the generator loses the link and marks the card as new), then run `python3 docs/obby-2.0/tools/gen_cards.py .` from the repo root to regenerate `handover/card-list.md` and `cards.json`;
   - commit on `card/mosje-roster-7nov` (docs only), and save this doc and the Wording Pass to the project.
   - For a starter card that the coder has already built, tell Gandalf that the name also has to change in `src/data` (a small data-only change).

## A. Quests: turn them into memories (36)
On 3 Nov many Quests got a Dutch name, but most are still generic ("Yolo", "Plan B"). The code (`src/data/quests.js`) still has the English names from before 3 Nov. Band and type stay; only the name and the flavour change. The 8 marked "keep" are already memories.

**Physical**
- [ ] Biceps Battle (was Arm Wrestling) · Skilled
- [ ] Parkour Challenge · Prepared
- [ ] Rondje Hardlopen (was Endurance Test) · Prepared
- [ ] Sprintje Trekken (was Sprint Race) · Trained
- [ ] Stormpje gepakt (was Survive Storm) · Steady
- [ ] Geen Pain Geen Gain (was Endure Pain) · Prepared
- [ ] Never Give Up · Skilled
- [ ] In De Flow (was Momentum Master) · Gated
- [ ] De Eindbaas (was Ultimate Challenge) · Heroic
- [ ] Sustained Assault · Steady
- [x] Geen Raad? Vraag Aad! · Coin Flip (keep)
- [x] Dutch courage · Prepared (keep)

**Digital**
- [ ] Snel Schakelen (was Quick Thinking) · Steady
- [ ] Strategy Puzzle · Skilled
- [ ] Plan B (was Master Plan) · Gated
- [ ] Ctrl Alt Delete (was Debug System) · Trained
- [ ] Root Access (was Hack Mainframe) · Skilled
- [ ] Build Gadget · Prepared
- [ ] Speed Run · Prepared
- [ ] Net Op Tijd (was Perfect Timing) · Coin Flip
- [ ] Samen Sterk (was Synergy Mastery) · Heroic
- [x] Regelaar · Gated (keep)
- [x] Late Night Questing · Steady (keep)
- [x] Cheat code · Prepared (keep)

**Creative**
- [ ] Applaus! (was Inspire Crowd) · Steady
- [ ] Handjeklap (was Form Alliance) · Skilled
- [ ] Marktplaats Deal (was Negotiation) · Prepared (also a brand name)
- [ ] Team Building · Trained
- [ ] Artistic Expression · Steady
- [ ] Freestylen (was Improvise!) · Steady
- [ ] Create Masterpiecie · Gated
- [ ] Geluksvogel (was Lucky Break) · Heroic
- [ ] Yolo (was Leap of Faith) · Coin Flip
- [x] Larry Temmen Niemand Zeggen · Prepared (keep)
- [x] Parkeren Delft · Prepared (keep)
- [x] Shotje Obby · Gated (keep)

Archived on 1 Nov, no name needed: Tough It Out, Calculate Odds.

**Do together with the names:** the Quest text pass. The 36 Quests still have their 1 Nov text, and the stacks lean on Res and Soc, which most Mosjes barely have. Fix the rolled trait while renaming, since a memory often decides which trait fits. Their text goes into `wording-pass.md` like the other cards.

## B. Cards with a generic name

**Must**
- [ ] **Ming's Hond** (pet, booster): placeholder. Needs the dog's real name and breed.

**Should** (English or generic, no friend-group link yet)
- [ ] Bodyguard (Snelle)
- [ ] Arcade (Place)
- [ ] Chef's Special (food, Ronald)
- [ ] Rugby Training (Place, Alyssa)
- [ ] Day-One Game (gear, Ming)
- [ ] Bento Box (food, Cless)
- [ ] Mixer (gear, DJ 80/20)
- [ ] Toploader (gear, Coert KasteLuck)
- [ ] ChestPress (gear, AZN Cless)
- [ ] Bootstick (gear, Coert)
- [ ] Med Kit · Night Vision · Loot Backpack (gear, FPS Coert)
- [ ] Minimap · Smoke Grenade (FPS West)
- [ ] Call of the Welloes · Welloe Force (trick)

**Optional** (literal names; ruled "fine as-is" on 1 Nov, a nickname is a bonus)
- [ ] Keyboard · Mouse · Controller · Headset (Digital gear)
- [ ] Dumbbells · Boxing Gloves (Physical gear)

Out of scope: the Personal Quest names (approved on 3 Nov) and every name Gandalf already gave.

## C. Questions for Gandalf
- [ ] **Real brand names**: the rule is "avoid real brand names", but these are real parts of the story. Keep or rename? **Tesla** (Place, and Tesla Laadkabel; Coert's car) · **Silverstone (DDR arcade)** (Place, Chris) · **Marktplaats Deal** (Quest) · **Super Saiyan Mos** (attack; a Dragon Ball reference).
- [ ] **Starter cards first?** The three starter decks go online first, so names of starter cards matter soonest: Keyboard, Mouse, Controller, Headset, Dumbbells, and the Quests. Booster names can wait.
