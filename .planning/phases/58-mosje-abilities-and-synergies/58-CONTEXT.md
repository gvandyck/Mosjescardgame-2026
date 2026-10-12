# Phase 58: Mosje Abilities and Synergies - Context

**Gathered:** 2026-10-12 · **Source:** handoff express path (Gandalf: mostly autonomous)

<domain>
Rewrite all 32 Mosje abilities and the synergy holder texts to the 2.0 Card List, with activated abilities paid in Energy. Piecie effects = Phase 59; Snelle/Place effects = Phase 60.
</domain>

<decisions>
## Locked
- **Source of truth:** the Card List Mosje tables (ability + synergy text) and its Rulings section. Card List wins over phase docs and over the current engine. If a text can't be built exactly as written, or two readings are possible, list it — don't invent a rule (orchestrator asks Gandalf).
- **Order:** the 18 Mosjes in the 3 Example Decks first, then the other 14.
- **Energy:** activated abilities pay their cost via `src/rules/abilityEnergyCosts.js` + `useMosjeAbility` (Phase 54); optional / staked Energy (Ming Predictor, Jeffrey Gambler — `ABILITY_IN_EFFECT_ENERGY`) is paid inside the effect. Refused when the player can't pay. MP is never a cost.
- **Once per turn** where the text says so; start-of-turn / end-of-turn / passive triggers hook into the Phase 55 turn flow, attack triggers into the Phase 56 `ATTACK_TRIGGERS` registry, losses into the Phase 54 loss pipeline (reductions as `LOSS_STEPS`), reactions into the Phase 57 windows.
- **Synergies:** a Mosje prints `Synergy: <name>`; the named holder card has "While <partner> is also on your field: …" (test-guarded convention). Re-wire `synergyResolver` (and turnManager / questLogic / piecieEffects hooks) to the 2.0 pairs from the Card List. Synergy Chamber (Place) makes holder texts work without the partner. A Piecie activated for free (Jisca, DDR Chris, Ming Natural, Master Plan, Chain Reaction) never starts another chain roll or Teaching Moment roll; copies aren't activations; Coert's Caravan 0-Energy activation is a normal one.
- **Tactician (EFX-06):** set any Mosje's MP to 10–75 until end of turn; store real MP; at end of turn real MP + this turn's gains/losses; getemt during the turn works normally; never a level-up from the set.
- **Hidden info:** Ronald (Strategic Insight) and FPS West show the opponent's hand only to the acting player (UI); the bot doesn't peek beyond what the card allows. Full EFX-07 is Phase 60.
- **Known gaps to close here:** Michelle's Tough Gamble double = ONE gain (40 + 65 doubled → Level 2 / 0 MP; fix `tests/engine/gandoe-michelle-synergy.test.ts`); Chris The All-Rounder "gain 15 MP"; FPS West 1 Energy +20/−10; Battle Concert redirect test (if Mosje-side); Youri / Unstoppable / alyssa-jisca Playwright fixmes (VIS-06, bulldozer-comeback cinema, Scenario A); Ming Future Sight stack choice; Ming Predictor / Jeffrey Gambler in-effect Energy; card-library entries for all 32 Mosjes (headless).
- **TEST-01:** engine tests E1–E30 all pass in `npm test` at the end (E26 Tactician added here).
- One engine, no switch; `npm test` green after every plan; never weaken tests; no `npm run test:sim`; Playwright headless only (Gandalf plays on the main screen); test helpers in `tests/helpers/*.js`; syntax-check each UI file separately (`for f in …; do node --check "$f"; done`); fixme/skip must name a later phase (meta guard).

## Claude's Discretion
- One exported function per file; grouping of abilities into plans (Example-Deck Mosjes first); card-test-library entry format (existing `tests/ui/cards/` registry).
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — Mosje tables, Rulings
- `docs/obby-2.0/Obby Card Game 2.0 - Example Decks.md`
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2g, §3c, §6a (E26), §6b
- Phase 54–57 SUMMARYs (Energy costs, loss pipeline, ATTACK_TRIGGERS, turn hooks, reaction windows, target resolvers)
</canonical_refs>
