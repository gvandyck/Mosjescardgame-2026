# Obby Card Game 2.0 — Roadmap & how to work

Entry point for any new chat. Reading order: this file → `Obby Card Game 2.0 - Progress.md` → `Obby Card Game 2.0 - Core Numbers.md` → the phase's section in `Obby Card Game 2.0 - Rework Plan.md`. Rules are in `Obby Card Game 2.0 - Rules and Decisions.md` (note: the Core Numbers doc overrides it where they differ: Getemt keeps its name, level-ups reset to 0, no Player 2 compensation, cooldown turn on deck-out).

Card source: Card List V4 on Google Drive, "Mosjes Card List Momentum Edition V4" (file id `1E1ZYPim6x4oWVrhplapufDeetP5gzsTJAzP8EcRHZnc`). Read it with the Drive connector; it is not in the repo.

This is a **design** rework. Do not touch the web game engine until Phase 6.

## When the user says "start on phase N"
1. Read the files above. Check `Progress.md` says phases before N are done; if one was skipped, say so and ask before proceeding.
2. Do only that phase, in the order of the Rework Plan.
3. Ask only real decisions: one question at a time, with a recommendation (use AskUserQuestion). Decide small things yourself and list them in Progress.md under "Small things I decided myself".
4. Rework existing cards and keep names. Don't invent new cards unless there is no other way.
5. Everything must be playable on a real table. Explain things simply.
6. At the end of the phase: save the output as its own doc in this folder, update `Progress.md` (done, decisions, next), tick the roadmap below, commit, push, and give a short summary.
7. If the chat gets long, update `Progress.md` and tell the user to start a new chat with "start on phase N".

Git: work on a branch (`docs/obby-2.0-...`), never commit straight to `main`.

## Roadmap
| Phase | What | Status | Output doc |
|---|---|---|---|
| 0 | Lock the numbers | **DONE** 2026-10-09 | `Obby Card Game 2.0 - Core Numbers.md` |
| 1 | Mosjes: Fighting → Digital → Artistic (stat block, 3 level rows, ability) | Fighting **DONE** 2026-10-09; Digital **DONE** 2026-10-09; Artistic next | `Obby Card Game 2.0 - Phase 1 Fighting Mosjes.md`, `Obby Card Game 2.0 - Phase 1 Digital Mosjes.md` |
| 2 | Quests: 3 typed stacks, odds for ★/★★/★★★, ≥1/3 need a Piecie or Place; add Quests so Mental/Social/Resilient have a home | not started | — |
| 3 | Piecies & Snelle: MP → Energy, Power-based attacks, tags (food/gear/substance/pet), reword "active Mosje" cards | not started | — |
| 4 | Places: each changes combat or Quests; good-for / bad-for | not started | — |
| 5 | Starter decks (min 30 cards) + paper playtests | not started | — |
| 6 | Card List 2.0, Example Decks 2.0, Claude Code handoff for the web game | not started | — |
| 7 | Visual production | not started | — |

## Reminders for later phases
- Cleanup backlog: reword "your active Mosje" in Broodje Döner, Ronald Kip, Nature's Gift, Perfect Setup, MP Adjuster, Emergency Swap; Mosje Reborn mentions Level 0.
- Phase 5 balance checks: levelling leaves you at 0 MP (any hit drops it), Prepared-band Quests too strong, player 1 advantage, cooldown turn strength (see Core Numbers §7).
- Phase 6 handoff must include: Energy pool, Power + attack action, level path, getemt/sideways, fresh-Mosje protection, Snelle slot rule, 3 typed Quest slots, cooldown turn on deck-out, new board layout.
