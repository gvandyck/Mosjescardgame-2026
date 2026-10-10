# Phase 54: Energy, Levels and Getemt - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning
**Source:** Handoff express path (Gandalf chose "mostly autonomous"; the Obby 2.0 docs are the locked spec)

<domain>
## Phase Boundary

Replace the V4 MP economy in the live `.js` engine with the 2.0 core: an **Energy pool** pays for everything (MP is never spent), Mosjes live on **Levels 1–3** with reset-to-0 level-ups and a 95 cap at Level 3, **getemt** (level drop to 50 / sideways at Level 1 / Welloe pile), the **hold-Level-3 win** and the **no-Mosje-left loss**, and the **MP/Power grid + one-loss resolution order**. Turn setup/draw/R1/R5/cooldown/fresh rules are Phase 55; attacks and Quests Phase 56; slots/Snelle/Places Phase 57; card effects 58–60; UI 62–63.

</domain>

<decisions>
## Implementation Decisions

### Energy (RULE-01, locked — handoff §2a, Core Numbers §1–2)
- `player.energy`: starts at 2 for both players; +1 at the start of each of the player's own turns, max 6; unspent Energy carries over (so with nothing spent: 3/4/5/6 on turns 1–4).
- Energy pays for summons, Piecie activations, Snelle, Places and activated abilities, using the 2.0 `cost` field from Phase 53. A payment larger than the pool is refused (no partial pay, no negative Energy).
- **MP is never a currency:** every V4 MP-cost path (`mpCost`, U7 cost rule in `universal-rules.js`, tribute payer, Welloe Force paying MP) stops charging MP. Where a card's V4 effect still reads `mpCost`, charge `cost` in Energy instead; effect texts themselves are rewritten in Phases 58–60.
- Remove/neutralise V4 fields' consumers as they are replaced (Phase 53 kept `mpCost` etc. alongside); delete the field consumers this phase replaces, and keep the data field only if another not-yet-rewritten consumer still needs it (record which in the SUMMARY).

### Levels (RULE-02, locked — handoff §2b)
- No Level 0 anywhere: a Mosje enters at **Level 1** with its `startMP`. Engine level representation may stay 0-based internally only if every display/test uses 1–3; prefer storing 1–3 (decide in research, record it).
- Reaching 100 MP from **any** gain (Quest, Piecie, ability, Place) → level +1, **MP resets to 0** (no carry-over). L1→L2→L3.
- At Level 3, MP can't go above **95**.
- Leipe Swap is never a gain; Tactician's 10–75 can never reach 100 (effects in later phases — just don't let a "set MP" path trigger level-up).
- Power comes from the Mosje's current level row (`levels[level-1].power`) plus boosts; boosts and Power plumbing that cards use arrive in later phases, but `getPower(mosje)` (level row + modifiers, floor 0) belongs here.

### Getemt (RULE-03, locked — handoff §2b, Core Numbers §1, Phase 1/3 rulings)
- Trigger: after **any** MP loss (attack, card, own ability or cost, failed Quest, Quest jab, Place) whose **final amount is > 0** and that leaves the Mosje at **0 MP or less**.
- Level 2–3: level −1, MP = 50.
- Level 1: MP = 0, the Mosje turns **sideways**: it skips its owner's next turn and stands up at the end of that turn. Getemt again while sideways → **Welloe pile** (out of the game, separate from the discard pile).
- **A loss reduced to 0 is no loss:** no getemt, also at 0 MP.
- Negative MP never persists (floor 0).

### Win / lose (RULE-04, locked)
- Win check is the **first thing at the start of a player's turn**: if one of their Mosjes is at Level 3 (it got there on an earlier turn and is still there), they win. Reaching Level 3 does not win immediately.
- A player **loses** when no Mosje of theirs is left outside their Welloe pile (field, hand and deck all empty of Mosjes).

### Grid and loss order (RULE-09, locked — handoff §2g)
- MP always a multiple of 5 (keep `roundToFive`), never below 0. Power a multiple of 10, never below 0.
- One MP loss resolves: base amount → reductions (pets, Afblijven!, Laat me chillen!, Zo is Natuur, Flow, reaction Snelle) → Momentum Stabilizer's 30 cap → round to 5, floor 0 → if 0: no loss. Emergency Healings adds MP *before* the loss. Build this as one engine function (e.g. `resolveMpLoss`) with hook points for reductions/caps that later phases register into; the concrete card reductions arrive in 58–60.

### Transition (locked by orchestrator)
- One engine, no V4/2.0 switch: V4 level/MP rules are replaced in place.
- `npm test` green at the end of every plan: V4 tests that encode Level 0, MP costs, carry-over level-up, V4 getemt (remainder into 100), 100-cap of non-Quest gains, or "win at Level 3 immediately" are **rewritten to the 2.0 rule or deleted** (never left failing, never weakened into no-ops). List them in SUMMARYs.
- The game must still start and run a bot-vs-bot game on the Example Decks without throwing (Node smoke in `npm test`); it may play oddly until Phases 55–57.
- MP-touching phase: run the full CLAUDE.md verification at the phase gate. The V4 Ronald Kip stacking test is replaced in Phase 59 — keep or adapt the current one so it still passes under 2.0 MP rules. The sim (`npm run test:sim`) still uses old deck ids until Phase 64: don't run the full 2-hour sim; run at most one short headless sim spec, or the Node smoke, and say so.
- Playwright: headless only; if a headed window is unavoidable it must open at `--window-position=2560,0` (Gandalf plays on the main screen).

### Claude's Discretion
- File layout (one exported function per file, small files), names like `gainMp`, `loseMp`, `resolveMpLoss`, `checkLevelUp`, `applyGetemt`, `getPower`, `checkWin`, `checkLoss`, `payEnergy`, `canPay`.
- Where the Welloe pile lives in state (`player.welloePile`), and how "sideways"/"skips next turn" is flagged (turn skipping itself can be wired minimal here and completed in Phase 55's turn flow — record the boundary).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 2.0 spec
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` — §2a, §2b, §2g, §6a (E1, E3–E8, E7b, E14, E27)
- `docs/obby-2.0/Obby Card Game 2.0 - Core Numbers.md` — §1 rulings, §2 numbers
- `docs/obby-2.0/tools/obby_desk_sim.py` — working reference for getemt/level/win logic (reference only, don't import)

### Codebase
- `src/engine/mpManager.js`, `src/engine/turnManager.js`, `src/engine/victoryChecker.js`, `src/engine/gameState.js`, `src/rules/universal-rules.js` (U7), `src/abilities/*`, `src/bot/*` (cost-paying paths)
- `.planning/phases/53-2-0-card-data-and-example-decks/53-*-SUMMARY.md` — field names actually used (`cost`, `levels`, `startMP`, `disabled`, …)
- `CLAUDE.md` — verification sequence, small files, never `/_archive/`

</canonical_refs>

<specifics>
## Specific Ideas
- Handoff tests to add: E1 (Energy), E3 (level-up from a Piecie gain, no carry-over), E4 (getemt L2/L3 → 50), E5 (L1 sideways, skip, upright, second getemt → Welloe), E6 (loss reduced to 0 → no getemt at 0 MP), E7 (win only at start of next turn), E7b (L3 90 + 25 → 95), E8 (lose with no Mosje outside the Welloe pile), E14 (Power floor 0), E27 (MP grid after gains/losses/halves/doubles).

</specifics>

<deferred>
## Deferred Ideas
- Summon cost charging at summon time (TABLE-01) and setup/R1/R5/cooldown/fresh — Phase 55.
- Attack damage, Quest win/lose, jabs — Phase 56.
- Card-specific reductions (pets, shields, Stabilizer) registering into the loss pipeline — Phases 58–60.
- Energy crystals UI — Phase 63.

</deferred>

---

*Phase: 54-energy-levels-and-getemt*
*Context gathered: 2026-10-11 via handoff express path*
