# Developer Handoff - Obby 2.0

> **This branch (`obby-2.0`) plays Obby Card Game 2.0.** The old V4 text that used to live here is gone from this branch (it stays in git history on `main`).
>
> The canonical rules and card data now live in `docs/obby-2.0/`:
>
> - `Obby Card Game 2.0 - Rules and Decisions.md` (Core Numbers overrides it where they differ)
> - `Obby Card Game 2.0 - Core Numbers.md`
> - `Obby Card Game 2.0 - Card List.md`
> - `Obby Card Game 2.0 - Claude Code Handoff.md`
> - `Obby Card Game 2.0 - Example Decks.md`
>
> Start at `docs/obby-2.0/README.md` (roadmap, working rules, reading order).

## Engine map (Phases 54-55)

One imperative `.js` engine, no V4/2.0 switch. 2.0 modules under `src/engine/`, one exported function per file:

- `energy/` - Energy pool (start 2, +1 per turn, max 6), `canPay`, `payEnergy`, `gainEnergy`, ability costs.
- `mp/` - MP on the five-grid, level-ups (reset to 0), Getemt.
- `winLose/` - `checkWin` (hold Level 3 until your next turn) and `checkLoss`.
- `setup/` - starting Mosje free and fresh, 3-card hand, 3 typed Quest stacks, opening die, R5 first-draw skip.
- `turn/` - turn start order, R1 empty-field rule, cooldown turn (`isCooldownBlocked`), end of turn.
- `fresh/` - fresh / level-up protection flags (`isFresh`), opponent-proof by source.
- `targets/` - own/opponent target resolvers (no "active Mosje"; the player or bot picks which Mosje).
- `table/` - summoning (pay `cost` in Energy, max 2 Mosjes per field).

Tests that matter run the real game headless: `tests/ui/turn-flow-2-0.spec.js`, `tests/ui/cards/`. Run Playwright headless only.
