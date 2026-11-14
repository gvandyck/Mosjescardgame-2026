# Obby Card Game 2.0 — Next Chat Prompt (14 Nov 2026)

Paste everything below the line into a new chat in the "Mosjes card game" project.

---

We're continuing the Obby Card Game 2.0 (MOSJES) rework. Read these project docs first, in this order, before answering:

1. `Obby Card Game 2.0 - Effect Library.md` (the wording rules: read all of it)
2. `Obby Card Game 2.0 - Mosje Kits.md` (kits, the to-do checklist at the top, new cards)
3. `Obby Card Game 2.0 - Starter Decks.md` (the three 40-card decks)
4. `Obby Card Game 2.0 - Rules and Decisions.md` and `Card Design Lock.md` (only where you need them)

Repo: `gvandyck/mosjescardgame-2026`, branch `card/mosje-roster-7nov` (stacked on PR #12, `card/physical-rename`). The docs live in `docs/obby-2.0/`.

## Where we are
- Roster, types (Physical / Digital / Creative), trait curve, starter decks and Mosje kits are done.
- Every friend has a pet card or a signature card. Pets all share one effect. Signature cards follow the pattern "works for anyone, its own friend gets more".
- The Effect Library is written: verb templates, durations, 4 new keywords (Entrance, Discarded, Level Down, Combo), 9 card reworks, 12 shortened cards.
- Card text style is FINAL: all text, no glyphs, no name tags, no icons for duration or Energy. Yu-Gi-Oh style fixed phrases: colon = condition, semicolon = cost, "until the end of your next turn", "during your opponent's next turn". The plain die icon is only for Quest and Personal Quest roll lines.

## What to do now: the wording pass (Phase 6)
Rewrite every card text to the rules in the Effect Library (§0 clean text rule, the style decisions at the top, §9 the 12 wording rules). Start with the cards in the three starter decks, then the rest.

How I want it:
- Show me the cards as a sheet of cards I can approve, edit or reroll per card, in batches of about 12. Old text small, new text large, and say what you cut if a rewording changes the rule.
- Keep effects easy and clean: one short sentence, two at most. No star thresholds on top of a condition.
- Use "one of your Mosjes" as the standard target phrase and "Target" as the defined word for targeting.
- Tag each card with its template ID from the Effect Library, so the code handover is easy.
- Save approved texts in a new doc, `Obby Card Game 2.0 - Wording Pass.md`, and in the repo under `docs/obby-2.0/`.

## After the wording pass
1. Names round: the 38 generic Quests become memories from our friend group, and the 26 generic card names (Synergy Field, MP Amplifier, …) get friend-group names. Draft them in a reroll sheet.
2. Open items from the checklist in the kits doc: Obby #1 / #2 balance, gear for Alyssa Fissa, Chris The Gamer, Ming's dog (name and breed), helmet and shoulderpads for Alyssa Bulldozer if needed.
3. Sync the older docs: `Rules and Decisions.md` and `Personal Quest List.md` (still says Ironman; it's now Knocked Down, Not Out) with everything decided 9–14 Nov.
4. Only when I say the design is FINAL: the handover to code (new cards and starter decks into `src/data`, fix the failing tests that pin the old roster, merge PR #12, playtest).

## How I like to work
- Be critical. Don't just agree with me; tell me when an idea is weak and why.
- Show results as cards (type-coloured border, badges, effect in a box, dashed outline for new or draft cards), not long tables.
- For choices, give me a picker with buttons that sends my picks back, and mark your recommendation. Make sure the picker sends names, not colour codes.
- Core terms and keywords in English; Dutch for card names and flavour. Avoid real brand names.
- Docs only until FINAL. No commits to main; work on a branch and keep tests green before merging.

## Reference pages
- Mosje Kits page: https://claude.ai/artifact/NDSpFbyYiNXLzpEPkWhtCZ
- Card Text Style Test canvas (board G is the final all-text style): https://claude.ai/artifact/JB1MUCSC1jjM8vohDmBvJ1

Start by confirming what you read in two or three lines, then show me the first batch of starter-deck cards.
