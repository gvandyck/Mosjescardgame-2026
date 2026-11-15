# Obby Card Game 2.0 — Code handover pack (15 Nov 2026)

For Claude Code. Gandalf isn't a coder: explain choices in plain words and ask when something is unclear (repo `CLAUDE.md`: when in doubt, stop and ask).

## 0. Scope: starters first (FINAL on 15 Nov 2026)
Gandalf has said the design is **FINAL for the rules and the three starter decks**. That is what you build now:

- the rules in `rules.md` (engine work, section 4 below);
- the 15 starter Mosjes, 12 starter Personal Quests and the starter Piecies, Snelle and Places: in `cards.json` these have `"set": "starter"` or `"starter": true`;
- the three starter decks in `starter-decks-draft.md`.

**Booster cards are not FINAL.** Their texts were reworded by rule and not playtested. Do not add or change booster cards (`"set": "booster"` / `"starter": false`) until Gandalf says so. It is fine to build handlers in a way that the booster cards can use later.

This pack **replaces** `Obby Card Game 2.0 - Claude Code Handoff.md` and `Obby Card Game 2.0 - Card List.md` (both 10 Oct). Those describe an earlier design: old roster, no Personal Quest cards, level-up resets to 0. Do not follow them.

## 1. Sources of truth, in this order
1. `handover/rules.md`: the rules as they stand.
2. `handover/card-list.md` and `handover/cards.json`: every card with its final text, cost, rarity, kit, template tags and the name it has in `src/data` today. Generated from `wording-pass.md` by `tools/gen_cards.py`; never edit them by hand.
3. `wording-pass.md`: the history behind each text (what changed and why), the balance round and the playtest watch list.
4. `starter-decks-draft.md`: the three 40-card starter decks.
5. `effect-library.md`: what each template tag means and its canonical wording (§1–§7, and §12 for the tags added in the pass).
6. `mosje-kits.md`, `mosje-personas.md`: which cards belong to which friend, and why.

## 2. What changed since the 10 Oct handoff
- **Types:** Physical / Digital / Creative (was Fighting / Digital / Artistic). Trait names on cards: Str, Tech, Art, Men, Soc, Res.
- **Win condition:** a Level 3 Mosje completes a **Personal Quest card** from its owner's deck. "Hold Level 3" is gone.
- **Level-up** resets MP to 10 (was 0). Start MP is never 0.
- **Attacks:** type triangle (+10 Power against the type you beat) and Resilient as defence (−5 per Res ★, minimum 5).
- **Attachments:** gear, pets and The Protector attach to a Mosje, max 2.
- **Roster:** 26 Mosjes (25 from the 7–9 Nov roster plus Flightsim Coert). Standard and specialist trait curves. Every Mosje has a kit.
- **Card text:** all text, fixed phrases, six keywords, the defined word Target (rules.md §9).
- **Wording pass (14 Nov):** 217 final texts, a balance round, and the rules in `rules-update-14-nov.md`.

## 3. Data work (`src/data`)
`cards.json` has four lists: `mosjes`, `personalQuests`, `cards` (Piecies, Snelle, Places) and `dataCardsWithoutText`.

- **Per card:** `name`, `kind`, `subtype`, `rarity` (1–5, `null` = not ruled yet), `cost`, `kit`, `text`, `templates`, `starter` (true = in a starter deck), `chase`, and `dataName` / `dataId` (the card as it exists in `src/data` now; `isNew: true` = not in the data).
- **67 new cards** to add (`isNew`). 98 existing cards get new text, and often a new cost or rarity.
- **17 renames** (data name → 2.0 name): Broodje Döner → Late Night Döner · Perfect Rhythm → In De Groove · Loaded Dice → Gekke Dobbel · Momentum Rush → Aansteker · Momentum Boost → Ctrl+S · Shoettoe → Kladje · Nature's Gift → Spiegelen · Emergency Healings → Oh nee toch niet · The Gym → Gym · Momentum Diefje → Harken maar · F1 Telemetry Data → Track Highscore · Skipping Rope → Touwtjespringen · Not Today! → Nog Niet Klaar · The Void → Dooie Boel · Welloe Graveyard → Welloe Plekka · Momentum Stabilizer → Bed Chillings · Digital Gaming Stop → Pre-order Market. Several of these also change what the card does; the text in `cards.json` wins.
- **17 cards to archive** (`dataCardsWithoutText`): MP Amplifier, Synergy Field, Mosje Shield, Battle Concert, Perfect Setup, MP Adjuster, Chain Reaction, Double Trigger, Continuous Assault, MP Hemorrhage, Perfect Dodge, Drain Reversal, Quest Haven, Momentum Factory, Synergy Chamber, Drain Zone, Boxing Ring. Keep them in the data, disabled, out of decks and boosters.
- **Mosjes:** 26 active (`mosjes` list: type, cost, start MP, Power per level, traits per level, ability). The 10 Mosjes already `disabled: true` stay disabled. `mosjes.js` still has the old Power values (mostly 10/20/30) and rarities ★–★★★★: apply the Power curve and make every Mosje ★★★★ (Gandoe, The Destroyer ★★★★★). Flightsim Coert is new.
- **Personal Quests:** 26 cards (`personalQuests`). There is no Personal Quest card type in `src/` yet; `quests.js` only has the old `questType: "PERSONAL"` Quests, which these replace.
- **Starter decks:** rebuild `starterDecks.js` from `starter-decks-draft.md`.

## 4. Engine work
New or changed mechanics, each needing a handler and tests:
1. **Personal Quest card type:** in the deck, played from the hand by a Level 3 Mosje, Needs / Pay / Roll, fail → back into the deck and reshuffle, win ends the game, pacing rule, can't be discarded by an opponent (rules.md §7).
2. **Level-up to 10 MP; type triangle; Resilient defence** (rules.md §4–§5).
3. **Attachments** on Mosjes, max 2 (3 for Jeffrey, The Strongman), and attached gear counting as ready (§8).
4. **Keywords:** Needs, Attach, Entrance, Discarded, Level Down, Combo (§9).
5. **Target** as a defined step, so Jensen!, Counter Strikka, Zonnebril, Blensen! and The Protector can act on it; Mosje abilities target too.
6. **Durations:** this turn, until the end of your next turn, during your opponent's next turn, and the new Upkeep (The Protector).
7. **Costs:** semicolon costs are paid on play; no MP cost can take a Mosje to 0 or less.
8. **Dice cap:** max 6 dice on any Quest or Personal Quest roll.
9. **One pile per player;** Mosje Reborn can summon from the opponent's pile, with ownership going back when the Mosje leaves play.
10. **Level upgrades from Level 2** on eight Mosje abilities; Binti's every-other-turn limit.

Template tags in `cards.json` (count of cards using each), so one handler can serve many cards: MP_GAIN 40 · DRAW 37 · DIE_PLUS 25 · ATTACH 25 · POWER_UP 18 · MP_SHIELD 14 · GAMBLE 14 · POWER_DOWN 12 · MP_COST 10 · REROLL 8 · COST_DOWN 7 · MP_LOSS 7 · LOCK 7 · SCRY 6 · EXTRA_USE 6 · PEEK_HAND 6 · DISCARD_OPP 5 · CANCEL 4 · LOOT 4 · PLACE_DESTROY 4 · UNTARGETABLE 4 · TUTOR 3 · ENERGY_GAIN 3 · RECYCLE 3 · THORNS 2 · SAVE 2 · DIE_MINUS 2 · MP_DRAIN 2 · REVIVE 2 · STEAL 2 · KO 2 · REDIRECT 2 · COPY 2 · and one card each for DOT, PEEK_DECK, REROLL_OPP, QUEST_EASE, SET_POWER, MP_SWAP, WILDCARD, MP_CAP, COST_UP, HAND_SWAP, LEVEL_DOWN. Triggers and durations are tags too (THIS_TURN, UNTIL_NEXT_END, OPP_TURN, START_OF_TURN, END_OF_TURN, ON_QUEST_WIN, ON_QUEST_FAIL, COMBO, DISCARDED, UPKEEP).

## 5. Tests and repo rules
- Follow the repo `CLAUDE.md`: work on a branch, never commit to `main`, run the 3-step verification before every commit, reproduce bugs in the browser first, one `.js` engine, never read `/_archive/`.
- **Baseline on `card/mosje-roster-7nov` (15 Nov):** the syntax check passes; `npm test` shows 35 failing tests out of 2,492. They pin the old roster and card texts. Rewriting them is part of this work; do not "fix" them by restoring old data.
- Every new or changed card gets a test in the same branch. Anything that touches MP gain or loss: re-run the Ronald Kip stacking test and the simulation. Ronald Kip itself changed (40 MP, and Ronald, The Master Chef now boosts only the first food Piecie each turn), so that test's expected numbers change.
- Branch: `card/mosje-roster-7nov`, stacked on PR #12 (`card/physical-rename`).

## 6. Ruled on 15 Nov, and what is still open
Ruled:
- **Rarities** for the 13 cards that had none are in `cards.json` now.
- **Power** follows the curve for every Mosje, including Ronald, The Master Chef, Martin, Señor West, Coert, KasteLuck (10 / 20 / 25) and Flightsim Coert (5 / 10 / 15).
- **Quests:** keep the 38 general Quests in `quests.js` as they are, with only the type and trait renames. Their wording pass comes later as a data-only change.

Still open (Gandalf decides; ask, don't guess):
1. **Booster cards:** not FINAL (see section 0). Nothing has been playtested since the balance round; the watch list is at the bottom of `wording-pass.md`.
2. **The Quest pass:** texts, the trait spread (the stacks lean on Res and Soc) and friend-group names.
3. **Names:** generic card names, and "Ming's Hond" is a placeholder.
4. **Ultimate Mosjes:** ruled in principle, no card designed.

## 7. What this pack does not tell you
The author of this pack did not compare the design with the engine code. Three facts were checked on 15 Nov: `src/` has no Personal Quest card type; `mosjes.js` has `levels` with Power and traits, 10 Mosjes disabled, and the old Power values; `getCopyLimit.js` already gives 1 copy for ★★★★★ and 2 otherwise. Everything else in §4 may be partly built already. Check before you build.
