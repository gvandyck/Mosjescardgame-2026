# Phase 59: Piecie Effects - Context

**Gathered:** 2026-10-15 · **Source:** handoff express path (Gandalf: mostly autonomous, cheaper process)

<domain>
Rewrite all 73 Piecie effects to the 2.0 Card List (Example-Deck Piecies first), on top of the Phase 54–58 engine (Energy, loss pipeline, Stays slots, reaction windows, dice counter, target resolvers, Mosje triggers). Snelle and Place effects are Phase 60.
</domain>

<decisions>
## Locked
- **Source of truth:** Card List Piecie tables + Rulings section (incl. the Phase 59 bullet). If a text can't be built as written, list it — don't invent rules.
- **Rulings 2026-10-15:** MP Amplifier and Synergy Field are NOT "MP-giving" (Jeffrey allows them; The Void doesn't block their boost). Tikker and MP Hemorrhage **Stay** face-up in their slot until their effect ends, then discard (remove the `TODO(phase 59)` markers and update the guard test that counts them).
- **General:** Power boosts last "this turn" unless the card Stays; reductions shrink a loss (LOSS_STEPS), never stop it; dice boosts +1 die, never above 4; "Needs:" requirements checked; Level 2+ gate only on Harde Didde, Klaar Met Jou, Dikke Taks; limit 1 per deck for ★★★★★ + The Protector + Mosje Reborn; tags drive tag checks (food/pet/substance/gear; Dingetje toch?! counts as any).
- **Edge cases (handoff §6b):** Ronald Kip with Ronald, The Master Chef = 60 + a draw; Ronald Kip + MP Amplifier stacks per the Card List (double, max +40); Leipe Swap never causes level-up or getemt; Harde Didde / Klaar Met Jou gate + MP limit, answered by Not Today! and Jensen!.
- **Card-effect draws** use `drawFromEffect` (empty deck mid-turn draws nothing).
- **Known gaps to close:** redbull-coert / redbull cinema specs (Redbull: "pay its cost again" = pay the ability's Energy again); flaky Affoe-getemt spec (reproduce, then fix); VIS-02 (Leipe Swap revert) fixme; Momentum Diefje + MP Hemorrhage attack flags; Boosterpackkie/other effect draws counting for Artistic Expression; Binti +10 for Varkenspootjes/Protein Shake; Tony's "Morning Luck on 3–6".
- **Tests:** card-test-library entries for all 73 Piecies (headless), Example-Deck Piecies first; the new Ronald Kip test replaces the old stacking test.
- Same rules as before: one engine; `npm test` green after every plan; never weaken tests; fixme/skip only with Phase 60 + reason (meta guard); no `npm run test:sim` (old deck ids until Phase 64 — use the Node bot-vs-bot smoke); Playwright HEADLESS only via a temporary config (never the default "visual" project); helpers in `tests/helpers/*.js`; node --check each UI file separately.

## Claude's Discretion
- Plan grouping (Example-Deck Piecies first, then by section: MP / Attack / Utility / Gear / Pet / Substance); one exported function per file.
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — Piecies section + Rulings
- `docs/obby-2.0/Obby Card Game 2.0 - Example Decks.md`
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2g, §3c, §6b
- Phase 54–58 SUMMARYs
</canonical_refs>
