# Obby Card Game 2.0 — Next Chat Prompt (after the wording pass, 14 Nov 2026)

Paste everything below the line into a new chat in the "Mosjes card game" project.

---

We're continuing the Obby Card Game 2.0 (MOSJES) rework. Read these project docs first, in this order, before answering:

1. `Obby Card Game 2.0 - Wording Pass.md` (**the single source for card texts, costs and abilities; it wins over every older doc**)
2. `Obby Card Game 2.0 - Rules and Decisions - Update 14 Nov.md` (the new rules from the pass, and what they override)
3. `Obby Card Game 2.0 - Effect Library.md` (wording rules and template IDs)
4. `Obby Card Game 2.0 - Rules and Decisions.md`, `Mosje Kits.md` and `Starter Decks.md` (only where you need them; both are older than the wording pass)

Repo: `gvandyck/mosjescardgame-2026`, branch `card/mosje-roster-7nov` (stacked on PR #12, `card/physical-rename`). The docs live in `docs/obby-2.0/`; the wording pass is `wording-pass.md`.

## Where we are
- **Wording pass done (14 Nov).** 217 texts: 86 starter cards approved one by one, 131 booster cards reworded "by rule" (not approved one by one) or decided.
- Starter decks are complete: Piecies, Snelle, Places, Personal Quests and Mosje abilities, every cost set.
- A balance round is applied (FPS West, Youri, Binti, Ronald, Zwoele Ming Power, Coert's Caravan, FPS Coert, Stookerino, Dumbbells, level upgrades from Level 2).
- Chase cards: Mosje Reborn (any player's pile, Level 1, 50 MP) and The Protector (a Snelle that attaches and costs 1 Energy per turn to keep).
- New rulebook lines are listed in the wording pass under "Rulebook lines owed" (16 lines), including: a Quest roll never uses more than 6 dice; a Personal Quest can't be discarded by an opponent's effect; one pile per player (Welloe pile = discard pile); "Target" covers cards and Mosje abilities.

## Still open (in the wording pass doc)
1. Booster texts were reworded by rule and skimmed by Claude, not approved one by one. Gandalf confirmed all booster costs.
2. Ff Haaltje Nemen stays "Draw 1" at 2 Energy (Gandalf's call; Claude flagged it as too weak).

Flightsim Coert is complete (Digital; Tech and Men on the specialist curve; ability, Butter Landing). Ruled on 14 Nov, after the pass: attached gear counts as a "ready gear Piecie"; Ctrl+S at 0 MP stays at 0 and keeps its level; Gandoe, The Destroyer and Alyssa, The Bulldozer start at 10 MP; no MP cost can take a Mosje to 0 MP or less.

## What to do next
The code handover pack is in the repo under `docs/obby-2.0/handover/` and in the project as `Code Handover (15 Nov)` and `Rules (current, 15 Nov)`. **The rules and the three starter decks are FINAL (15 Nov); booster cards are not.**
1. **Playtest** the starter decks, with the watch list at the bottom of the wording pass. Then decide when the boosters are FINAL.
2. **Quest pass:** the 38 general Quests still need rewording, a trait fix (the stacks lean on Res and Soc) and friend-group names. It goes to the coder later as a data-only change.
3. **Names round:** generic card names (Bodyguard, Arcade, Track Highscore…); "Ming's Hond" is a placeholder.
4. **Project docs with old text:** Rules and Decisions, Mosje Kits, Mosje Personas, Effect Library, Starter Decks and the Personal Quest List in the project were not overwritten (the project copies differ from the repo copies). `Rules (current, 15 Nov)` and `Rules and Decisions - Update 14 Nov` say what wins.
5. **Code:** Claude Code starts from `docs/obby-2.0/handover/README.md` on branch `card/mosje-roster-7nov`.

## How I like to work
- Be critical. Don't just agree with me; tell me when an idea is weak and why. Use what Yu-Gi-Oh, Pokémon and Magic learned.
- Show results as cards (type-coloured border, badges, effect in a box, dashed outline for new or draft cards), not long tables.
- For choices, give me a picker with buttons that sends my picks back, and mark your recommendation. The picked button must be obvious (solid colour, check mark, tinted card). The picker sends names, not colour codes.
- Core terms and keywords in English; Dutch for card names and flavour. Avoid real brand names.
- Docs only until FINAL. No commits to main; work on a branch and keep tests green before merging.

## Parked ideas (in the wording pass doc)
Type bonus form ("A Physical Mosje gets +30 instead"), Opstaan!, Doorpakken, Groepsfoto, Wat Heb Je Daar?.

## Reference pages
- Mosje Kits page: https://claude.ai/artifact/NDSpFbyYiNXLzpEPkWhtCZ
- Card Text Style Test canvas (board G is the final all-text style): https://claude.ai/artifact/JB1MUCSC1jjM8vohDmBvJ1

Start by confirming what you read in two or three lines, then ask me which of the open items to take first.
