# Obby Card Game 2.0 — Rework Plan

Goal: bring every existing card in line with the 2.0 rules (see "Obby Card Game 2.0 - Rules and Decisions"), without growing the card count. One phase per chat session; each phase ends with a written output that the next phase reads.

## Ground rules for every phase
- Rework existing cards; keep names. Add a new card only if a gap can't be filled by reworking one.
- Everything must work on a physical table: no hidden counters, boosts last "this turn", lasting effects are cards on the table.
- Use the 2.0 vocabulary: Energy, Power, MP, taksen, ready, Welloe pile, "one of your Mosjes".
- Output per phase is a table that can be pasted into the card list (name · type · cost · stats · text · rarity · change note).
- Flag balance worries instead of silently fixing them.

## Phase 0 — Lock the numbers (1 session)
Answer the open questions in the Rules doc, then set the number budgets everything else follows:
- Energy cost curve per rarity (★ 0–1, ★★ 1–2, ★★★ 2–3, ★★★★ 3–4: proposal).
- Mosje ranges: starting MP, Power per level, Energy cost.
- Quest ranges: success/fail MP by difficulty; dice odds table.
- Old MP-cost → Energy conversion table.
- Which traits each Mosje type's Quests test.
Done when: a one-page "Number Bible" exists in the project.

## Phase 1 — Mosjes (1–2 sessions, by type)
For every Mosje: Energy cost, starting MP, Power, LVL 1 / LVL 2 / LVL 3 rows (traits + Power), ability rewritten to use Energy/Power/MP and the new rules.
Order: Fighting → Digital → Artistic.
Done when: every Mosje has a full stat block and no ability references "active Mosje", MP-as-currency or Level 0.

## Phase 2 — Quests (1 session)
Rebuild the Quest pool as 3 stacks (Fighting / Digital / Artistic), balanced in count and difficulty.
Each Quest gets: requirement (trait dice and/or Piecie and/or Energy and/or board state), success MP, fail MP, and a short "how to set it up" note.
At least a third of the Quests must need a Piecie or a Place to be attempted well.
Done when: every Quest has odds written next to it for ★, ★★ and ★★★.

## Phase 3 — Piecies & Snelle (1–2 sessions)
- Convert MP costs to Energy using the Phase 0 table.
- Give attack Piecies Power-based effects (like Te Hard Gaan).
- Tag Piecies Quests can ask for (food, gear, substance, pet) and make sure each tag has enough cards.
- Reword "active Mosje" cards (see cleanup backlog).
- Check Snelle against the "needs a free Piecie slot" rule.
Done when: every Piecie/Snelle has an Energy cost and a 2.0 text.

## Phase 4 — Places (1 session)
Rework each Place to change combat or Quests (Power, dice, costs), not only MP per turn. Each Place should favour one Mosje type and hurt another.
Done when: every Place has a clear "good for / bad for".

## Phase 5 — Starter decks + paper playtest (1–2 sessions)
Rebuild the 3 starter decks (Fighting, Digital, Artistic) from the reworked cards. Play 3+ paper games per matchup. Track: turns per game, deck-outs, how often players attack vs. quest, Level 3 holds.
Done when: games end in a sensible number of turns without deck-out and both actions get used.

## Phase 6 — Card list V5 + Claude Code handoff (1 session)
- Write "Card List 2.0" and "Example Decks 2.0".
- Write a Claude Code handoff for the web game: Energy pool, Power + attack action, level path, getemt/sideways, fresh-Mosje protection, Snelle slot rule, 3 typed Quest slots, new board layout (felt, 180×132 field cards).
Done when: the handoff is in the project and the tests to add are listed.

## Phase 7 — Visual production (ongoing)
Update card frames for the new stat layout (cost top-left, Power/MP footer, level path), list missing art, render print sheets.

---

## Kickoff prompt for the new chat (Phase 0)
Paste this into a new chat in this project:

> We're reworking my card game to version 2.0. Read the project docs "Obby Card Game 2.0 - Rules and Decisions" and "Obby Card Game 2.0 - Rework Plan", plus the synced Card List V4. We're doing Phase 0 only: help me answer the open questions one at a time (give me a recommendation for each), then build the "Number Bible" — Energy cost curve, Mosje stat ranges, Quest reward ranges with dice odds, the MP→Energy conversion table, and which traits each Mosje type's Quests use. Keep explanations short and simple. Rework existing cards, don't invent new ones. When we're done, save the Number Bible to the project.

For later phases, swap the last part for the phase you're on, e.g. "We're doing Phase 1, Fighting Mosjes only. Use the Number Bible."
