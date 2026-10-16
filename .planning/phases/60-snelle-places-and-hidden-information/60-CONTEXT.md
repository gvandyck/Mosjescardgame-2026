# Phase 60: Snelle, Places and Hidden Information - Context

**Gathered:** 2026-10-16 · **Source:** handoff express path (Gandalf: mostly autonomous, cheapest process)

<decisions>
## Locked
- **Source of truth:** Card List Snelle + Places tables and Rulings. If a text can't be built as written, list it — don't invent rules.
- **Snelle (EFX-03):** all 20 via the Phase 57 reaction windows (both players; Jammertje Piecie-only); "Needs:" conditions now checked when offering; Jensen! → Frenssen! → Blensen! (Blensen! free after a Jensen!/Frenssen! this turn, else 4 Energy; cards only, attacks still hit); Harde Didde / Klaar Met Jou answered by Not Today! and Jensen!; The Protector limit 1 per deck.
- **Places (EFX-04):** all 20 from hand (Phase 57), effects per Card List; Place Power in `getPower`; Momentum Stabilizer caps one loss at 30 (40 hit → 30); fresh Mosjes ignore both sides; Delluft parking fee in Energy; Synergy Chamber already passive (Phase 58).
- **Hidden info (EFX-07):** Ronald, FPS West, Stookerino, Jantje, Chef's Special, Those Eyelashes reveal cards only to the entitled player (reveal modal for the human; bot uses only what the card allows). State shape must allow per-player visibility later (online, slice B).
- **Known gaps to close (ROADMAP notes + 59 SUMMARYs):** Drain Reversal reflect amount; Skiffa dice + Tweede Kans reroll (2 skipped tests live); Drain Zone "+10 Power"; leftover `questBonusMP` consumer; Zie je die vs on-draw Place effects; Chef's Special / Jantje reveal modals; any remaining `test.fixme` naming Phase 60.
- **TEST-02:** every Card List card has a card-test-library entry incl. §6b edge cases; card suite green (full headless card run once, in the last plan).
- Cheapest process: executors run only the specs for cards they touch; SUMMARY ≤15 lines. Same rules: one engine; npm test green per plan; never weaken tests; no test:sim; Playwright headless only via a temporary config; helpers in tests/helpers/*.js; node --check each UI file separately; card effects may live in section files (Gandalf's Phase 59 ruling).
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — Snelle, Places, Rulings
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2f, §2g, §3c, §6b
- ROADMAP v2.0 Phase 60 entry (known-gap notes); Phase 57–59 SUMMARYs
</canonical_refs>
