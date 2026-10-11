# Phase 55: Turn Flow, Setup and Protection - Context

**Gathered:** 2026-10-11 · **Source:** handoff express path (Gandalf: mostly autonomous)

<domain>
2.0 setup and turn loop on the live `.js` engine, summoning, empty-field rule, cooldown turn, fresh + level-up protection, and removal of the remaining V4 leftovers. Attacks/Quest resolution = Phase 56; slots/Snelle/Places = 57; effects 58–60; UI polish 62–63.
</domain>

<decisions>
## Locked (handoff §2b, §2c, §2f; Core Numbers §1, §1a)
- **Setup:** deck's starting Mosje on the field free + fresh (Example Decks mark it); shuffle; draw **3**; 2 Energy each; build the 3 typed Quest stacks (Fighting/Digital/Artistic, from Phase 53 `stack`) and turn the top of each face-up (Quest resolution itself is Phase 56); highest die goes first.
- **Turn start order:** win check (Phase 54) → +1 Energy (max 6) → draw 1 (**player 1 skips the draw on their first turn, R5**) → R1 empty field → start-of-turn triggers → this player's fresh / level-up-protected flags clear.
- **R1 empty field:** no Mosje on field at turn start → cheapest Mosje (by `cost`) from hand or deck placed free and fresh; shuffle deck if it was searched. (Loss when none left = Phase 54 `checkLoss`.)
- **Summon (TABLE-01):** from hand on your turn, pay Mosje `cost` in Energy, arrives fresh, max 2 Mosjes per field. Setup Mosje is free.
- **Cooldown turn (RULE-07):** must draw from empty deck → shuffle discard (never Welloe pile) into new deck, draw, and that whole turn only face-down Piecie placing is allowed (no Quests, attacks, summons, Places, activations, Snelle). Still gets +1 Energy. Replaces V4 `skipNextTurn` deck-out skip.
- **Fresh (RULE-08):** extend V4 U8 `entryProtected`: until owner's next turn start, can't attack; no opponent card, ability or Quest jab can choose or hit it ("each opponent Mosje" effects skip it); ignores Places (good and bad). Target pickers show it disabled.
- **Level-up protection (R2):** a Mosje that levelled up this turn is flagged; can't be taksed (attacked) until owner's next turn; cards/jabs/Places still affect it. (Attack gate itself lands in Phase 56; set + clear the flag here.)
- **End of turn:** end-of-turn triggers, "this turn" boosts expire, sideways Mosjes that sat out stand up (Phase 54 sideways lifecycle).
- **Remove V4 leftovers (RULE-10):** first-turn General Quest lock; 4th Piecie slot (→ 3); 6-card opening hand; the "active Mosje" concept — every "you/your Mosje" effect asks which of your Mosjes (target picker; bot chooses); the V4 +10 MP turn-start trickle (not in 2.0); V4 deck-out `skipNextTurn`; any leftover Level 0 / MP-cost path.
- One engine, no V4/2.0 switch. `npm test` green after every plan; V4 tests rewritten to 2.0 or deleted, never weakened; changed expected values explained in SUMMARY or marked `KNOWN GAP (fix in Phase NN)`.
- Never run `npm run test:sim`; Playwright headless only (Gandalf plays on the main screen). Node bot-vs-bot smoke on the Example Decks must keep finishing.
- Docs (handoff §7): rewrite `docs/phase0-rulings.md`, `docs/card-reference.md`, `docs/developer-handoff.md`, `src/rules/card-specific-rulings.md` on this branch to point at `docs/obby-2.0/` (short pointer docs are fine).

## Claude's Discretion
- File layout (one exported function per file); how "which Mosje" is asked (reuse existing SelectionModal / target picker); Quest-stack state shape (Phase 56 must be able to build on it).
</decisions>

<canonical_refs>
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §2b, §2c, §2f, §6a (E2, E9, E11, E21), §7
- `docs/obby-2.0/Obby Card Game 2.0 - Core Numbers.md` §1, §1a
- `.planning/phases/54-energy-levels-and-getemt/54-*-SUMMARY.md` (Energy, slot factory, sideways, checkWin/checkLoss, Welloe pile)
- `src/engine/gameState.js`, `turnManager.js`, `deckEngine.js`, `src/rules/universal-rules.js` (U8), `src/main.js`, `src/bot/`
</canonical_refs>
