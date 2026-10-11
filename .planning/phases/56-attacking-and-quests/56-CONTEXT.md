# Phase 56: Attacking and Quests - Context

**Gathered:** 2026-10-11 · **Source:** handoff express path (Gandalf: mostly autonomous)

<domain>
The two Mosje actions: attack ("taksen") and Quests in 3 typed stacks, replacing the V4 General/Personal Quest system. Card-specific attack triggers and reactions that need Snelle windows (Perfect Dodge, Drain Reversal, Emergency Healings, The Protector) arrive in Phase 57/60; this phase provides the hook points and the triggers whose cards already work.
</domain>

<decisions>
## Locked (handoff §2c, §2d, §2e; Card List "Quests" section with the band table + 3 stacks)
- **One action per Mosje per turn:** attack OR Quest (or nothing). Both actions take the acting Mosje and call `canMosjeAct` (closes the Phase 54-11 gap). Fresh Mosjes can't attack; sideways can't act; cooldown turn blocks both.
- **Attack:** acting Mosje (not fresh, not sideways) picks one opponent Mosje that is not fresh and not level-up protected (sideways targets ARE allowed). Target loses MP = attacker's current Power (`getPower`: level row + Place + boosts, min 0) through the Phase 54 loss pipeline (can getemt). Power 0 = nothing happens (still uses the action). Register attack triggers already in the engine (Unstoppable 30+ in one turn, Flow, Welloe Force thorns, Momentum Diefje, MP Hemorrhage, Zo is Natuur, Momentum Stabilizer) as hooks; card amounts per the Card List where they exist, otherwise mark KNOWN GAP for Phases 58–60.
- **Quest stacks:** 3 face-up Quests (one per stack, built in Phase 55 setup). Any Mosje may try any of them.
- **Roll:** 1 d6 per ★ of the Quest's `rollTrait` on the acting Mosje (min 1, max 4, +1 die effects included). `best` = Mosje's best trait; `none` (Coin flip) = 1 die.
- **Bands (Card List table):** Steady one 4+ +25/−15 · Skilled two 4+ +40/−30 · Heroic two 5+ +60/−25 · Prepared pay first, one 4+ +50/−30 · Gated condition then one 4+ +35/−20 · Coin flip 1 die 4+ +50/−25 · Trained ★★+ in trait, no roll, +25, can't fail (★ Mosje refused).
- **Costs:** "First you must…" paid before the roll, never refunded; Endurance Test, Dutch courage, Larry Temmen Niemand Zeggen accept a discard "from your hand or a ready one".
- **Fail tokens:** each failed attempt (any player) adds a token; win or 2nd token → Quest goes to its stack's Quest discard pile and the next card of that stack turns face-up; empty stack reshuffles its own discards.
- **Jab:** on a win, one non-fresh opponent Mosje of the winner's choice loses 10 MP (MP loss, can getemt; hits level-up-protected Mosjes; not an attack).
- **Extras:** named bonuses (Gandoe Geen Raad +10, Youri Speed Run, Coert/Cless Parkeren Delft +20, Larry/Zegeltje Larry Temmen), +1 die rules, Vraag Aad (on fail you may discard 1 card to lose only 10), Cheat code draws 1 on a win, Debug System looks at 5, Parkeren Delft removes up to 3 cards — exact texts from the Card List rows (`text`, `extras`).
- **Remove V4:** shared General Quest deck, Personal Quests, `attemptGeneralQuest`/`attemptPersonalQuest`, per-trait thresholds, successMP/failMP use, `questLogic.getFirstActiveMosje`. V4 Quest tests rewritten to 2.0 or deleted.
- **Bot (minimal here, full strategy in Phase 61):** bot must be able to attack and Quest legally with the acting Mosje so bot-vs-bot games keep finishing; simple rule ok (desk-sim style: best expected MP swing).
- **UI (minimal, full board in Phase 63):** human can choose acting Mosje → Attack (pick target; invalid targets disabled) or Quest (pick one of 3); reuse existing modals/pickers.
- One engine, no switch; `npm test` green after every plan; never weaken tests; no `npm run test:sim`; Playwright headless only; syntax-check each UI file separately (`for f in …; do node --check "$f"; done`).

## Claude's Discretion
- Module layout (one exported function per file); dice injection for tests (seeded RNG); how Gated conditions are expressed (per-Quest condition ids).
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2c–§2e, §6a (E10, E12, E13, E15–E20)
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — Quests section (band table, 3 stack tables)
- `docs/obby-2.0/tools/obby_desk_sim.py` — reference for attack-or-Quest and getemt (don't import)
- Phase 53–55 SUMMARYs (Quest data fields, stacks state, canMosjeAct, loss pipeline, fresh/level-up flags)
</canonical_refs>
