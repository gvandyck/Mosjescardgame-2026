# Obby Card Game 2.0 — Roadmap & how to work

Entry point for any new chat. Reading order: this file → `Obby Card Game 2.0 - Progress.md` → `Obby Card Game 2.0 - Core Numbers.md` → the phase's section in `Obby Card Game 2.0 - Rework Plan.md`. Rules are in `Obby Card Game 2.0 - Rules and Decisions.md` (note: the Core Numbers doc overrides it where they differ: Getemt keeps its name, level-ups reset to 0, no Player 2 compensation, cooldown turn on deck-out).

Card source: Card List V4 on Google Drive, "Mosjes Card List Momentum Edition V4" (file id `1E1ZYPim6x4oWVrhplapufDeetP5gzsTJAzP8EcRHZnc`). Read it with the Drive connector; it is not in the repo. From Phase 3 on, the web game's card data (`src/data/*.js`) is a second source: it has newer texts, renamed cards and web-only cards. Read it, never edit it, and ask how to use it (Phase 3: V4 + web extras, web names, mostly web text).

This is a **design** rework. Do not touch the web game engine until Phase 6.

## When the user says "start on phase N"
1. Read the files above. Check `Progress.md` says phases before N are done; if one was skipped, say so and ask before proceeding.
2. Do only that phase, in the order of the Rework Plan.
3. Ask real decisions, and ask more than feels necessary: use AskUserQuestion with a recommendation, 2–4 questions per round. Anything that changes how a card plays (cost, who it can target, a new limit, a rule that interacts with getemt/level-ups, a rework of a placeholder card) is a question, not a "small thing". Gandalf asked for this explicitly after the Digital phase, where only 1 of ~10 real calls was asked. Before writing the doc, do a round of questions on the 3–5 most debatable cards. Only truly cosmetic choices (wording, column order, rarity proposals) go in Progress.md under "Small things I decided myself".
4. Rework existing cards and keep names. Don't invent new cards unless there is no other way.
5. Everything must be playable on a real table. Explain things simply.
6. At the end of the phase: save the output as its own doc in this folder, update `Progress.md` (done, decisions, next), tick the roadmap below, commit, push, and give a short summary.
7. If the chat gets long, update `Progress.md` and tell the user to start a new chat with "start on phase N".

Git: work on a branch (`docs/obby-2.0-...`), never commit straight to `main`.

## Roadmap
| Phase | What | Status | Output doc |
|---|---|---|---|
| 0 | Lock the numbers | **DONE** 2026-10-09 | `Obby Card Game 2.0 - Core Numbers.md` |
| 1 | Mosjes: Fighting → Digital → Artistic (stat block, 3 level rows, ability) | **DONE** 2026-10-09 (Fighting, Digital, Artistic) | `Obby Card Game 2.0 - Phase 1 Fighting Mosjes.md`, `... Digital Mosjes.md`, `... Artistic Mosjes.md` |
| 2 | Quests: 3 typed stacks, odds for ★/★★/★★★, ≥1/3 need a Piecie or Place; add Quests so Mental/Social/Resilient have a home | **DONE** 2026-10-10 | `Obby Card Game 2.0 - Phase 2 Quests.md` |
| 3 | Piecies & Snelle: MP → Energy, Power-based attacks, tags (food/gear/substance/pet), reword "active Mosje" cards | **DONE** 2026-10-10 | `Obby Card Game 2.0 - Phase 3 Piecies and Snelle.md` |
| 4 | Places: each changes combat or Quests; good-for / bad-for | **DONE** 2026-10-10 | `Obby Card Game 2.0 - Phase 4 Places.md` |
| 5 | Starter decks (min 30 cards) + paper playtests | **IN PROGRESS** 2026-10-10: decks + desk test done; paper games and R1–R6 calls open | `Obby Card Game 2.0 - Phase 5 Starter Decks.md` |
| 6 | Card List 2.0, Example Decks 2.0, Claude Code handoff for the web game | not started | — |
| 7 | Visual production | not started | — |

## Reminders for later phases
- Parked Place: Momentum Factory comes back only if you ask (Phase 4 doc).
- Parked Mosjes (Binti The Creator, The Amplifier, Kast-elein) come back only if you ask; see the Artistic doc.
- Phase 5 balance checks: levelling leaves you at 0 MP (any hit drops it), Prepared-band Quests too strong, player 1 advantage, cooldown turn strength (see Core Numbers §7); plus the Phase 3 flags (shield stacking on a Level 3, Ronald Kip without a gate, full Piecie rows blocking Snelle, Leipe Swap) and the Phase 4 flags (The Gym's drain and getemt, the first Place locking the table, The Void, Delluft vs Cless). Each starter deck gets 1–3 Places and 1–2 Place destroyers.
- Phase 6 handoff must include: Energy pool, Power + attack action, level path, getemt/sideways, fresh-Mosje protection (off-limits to all opponent effects), Snelle slot rule, 3 typed Quest slots, cooldown turn on deck-out, new board layout, Piecie tags (one `gear` tag replaces the web's two equipment tags), "Stays" cards in their slot, "a loss reduced to 0 is no loss", Places 2.0 (play from hand and work at once, fresh Mosjes ignore Places, Power never below 0, unhide Drain Zone and The Void, drop Momentum Factory, rename the web Piecie "Eendjes voeren" back to Nature's Gift).
